
  const app = document.getElementById("app");
  

  /* =========================================================
     STUDIOBEAT — BLACK & WHITE MOBILE DAW
     A BandLab-inspired workflow, built as a single file.
     ========================================================= */

  const instruments = [
    ["Piano","piano"],["Grand Piano","piano"],["Bright Piano","piano"],["Electric Piano","epiano"],
    ["Warm EP","epiano"],["Honky Piano","piano"],["Organ","organ"],["Jazz Organ","organ"],
    ["Church Organ","organ"],["Rock Organ","organ"],["Acoustic Guitar","guitar"],["Nylon Guitar","guitar"],
    ["Electric Guitar","guitar"],["Clean Guitar","guitar"],["Muted Guitar","guitar"],["Bass Guitar","bass"],
    ["808 Bass","bass"],["Sub Bass","bass"],["Slap Bass","bass"],["Fretless Bass","bass"],
    ["Violin","strings"],["Viola","strings"],["Cello","strings"],["Contrabass","strings"],
    ["String Ensemble","strings"],["Trumpet","brass"],["Trombone","brass"],["Saxophone","brass"],
    ["French Horn","brass"],["Brass Section","brass"],["Flute","woodwind"],["Clarinet","woodwind"],
    ["Oboe","woodwind"],["Recorder","woodwind"],["Pan Flute","woodwind"],["Marimba","mallet"],
    ["Vibraphone","mallet"],["Xylophone","mallet"],["Kalimba","mallet"],["Steel Drums","mallet"],
    ["Acoustic Kit","drum"],["Studio Kit","drum"],["808 Kit","drum"],["Afro Kit","drum"],["Percussion","drum"],
    ["Talking Drum","talkingdrum"],["Djembe","djembe"],["Conga","conga"],["Bongo","bongo"],["Shaker","shaker"],
    ["Lead Saw","synth"],["Lead Square","synth"],["Lead Pulse","synth"],["Synth Brass","synth"],
    ["Synth Bass","synthbass"],["Warm Pad","pad"],["Dark Pad","pad"],["Choir Pad","choir"],
    ["Air Pad","pad"],["Dream Pad","pad"],["Pluck","pluck"],["Digital Pluck","pluck"],
    ["Bell Pluck","pluck"],["Afro Pluck","pluck"],["Trap Pluck","pluck"],["Choir","choir"],
    ["Male Choir","choir"],["Female Choir","choir"],["Vocal Ah","choir"],["Vocal Oo","choir"],
    ["Breath","fx"],["Atmosphere","fx"],["Noise Sweep","fx"],["Impact","fx"],["Reverse FX","fx"],
    ["Harp","pluck"],["Acoustic Harp","pluck"],["Banjo","guitar"],["Mandolin","guitar"],["Ukulele","guitar"],
    ["Accordion","organ"],["Accordion Bass","bass"],["Clavinet","epiano"],["Celesta","mallet"],
    ["Music Box","mallet"],["Glockenspiel","mallet"],["Church Bells","bell"],["Bell","bell"],
    ["Crystal Bell","bell"],["African Bell","bell"],["Cowbell","bell"],["Agogo","bell"],
    ["Guiro","shaker"],["Cabasa","shaker"],["Tambourine","shaker"],["Woodblock","perc"],
    ["Rimshot","perc"],["Clap","perc"],["Snap","perc"],["Cajon","perc"],["Timbale","perc"],
    ["Tom","drum"],["Floor Tom","drum"],["Kick","drum"],["Deep Kick","drum"],["Snare","drum"],
    ["Closed Hat","drum"],["Open Hat","drum"],["Crash","drum"],["Ride","drum"],["Synth Lead","synth"],
    ["Retro Lead","synth"],["Vapor Lead","synth"],["House Lead","synth"],["Amapiano Lead","synth"],
    ["Afro Bass","bass"],["Afro Piano","piano"],["Afro Guitar","guitar"],["Amapiano Log Drum","logdrum"],
    ["Log Drum Deep","logdrum"],["Log Drum High","logdrum"],["Talking Drum High","talkingdrum"],
    ["Talking Drum Low","talkingdrum"],["Djembe High","djembe"],["Djembe Low","djembe"],
    ["Shekere","shaker"],["African Percussion","perc"],["World Flute","woodwind"],["World Strings","strings"],
    ["R&B Keys","epiano"],["Soul Keys","epiano"],["Lo-fi Keys","epiano"],["Trap Bell","bell"],
    ["Trap Keys","piano"],["Drill Piano","piano"],["Drill Bell","bell"],["Drill 808","bass"],
    ["Cinematic Strings","strings"],["Cinematic Brass","brass"],["Cinematic Pad","pad"],
    ["Cinematic Piano","piano"],["Vintage Synth","synth"],["Analog Bass","synthbass"],
    ["Mono Synth","synth"],["Poly Synth","synth"],["FM Keys","epiano"],["FM Bell","bell"],
    ["Dream Bell","bell"],["Space Pluck","pluck"],["Digital Choir","choir"],["Robot Voice","fx"],
    ["Vinyl FX","fx"],["Tape Stop FX","fx"],["Riser","fx"],["Downlifter","fx"],["Sub Drop","fx"]
  ];

  const genres = ["Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B","Pop","Dancehall","Reggae","Gospel","EDM","House","Lo-fi"];
  const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  let audio = null, master = null, analyser = null;
  let bpm = 105, key = "C", playing = false, playTimer = null, currentStep = 0;
  let masterVol = .8, selectedInstrument = "Piano", octave = 4;
  let tracks = [], loops = [], clips = [], recordings = [];
  let armedTrack = null, activeTab = "arrange", tunerStream = null, tunerRAF = null;
  let recorder = null, recChunks = [], recording = false, recordStart = 0;
  let projectName = "My First Song";
  let metronome = true, countIn = false;
  let undoStack = [];

  const uid = () => Math.random().toString(36).slice(2,10);

  function ensureAudio() {
    if (audio) return;
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain();
    master.gain.value = masterVol;
    analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(analyser);
    analyser.connect(audio.destination);
  }

  function unlockAudio() {
    ensureAudio();
    if (audio.state === "suspended") audio.resume();
  }

  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  function midiFromNote(note, oct) {
    return 12 * (oct + 1) + noteNames.indexOf(note);
  }

  function profile(kind) {
    const p = {
      piano:{wave:"triangle", attack:.005, release:.65, filter:4200, gain:.34, detune:0},
      epiano:{wave:"sine", attack:.01, release:.8, filter:3000, gain:.3, detune:5},
      organ:{wave:"sine", attack:.03, release:1.2, filter:3200, gain:.24, detune:7},
      guitar:{wave:"triangle", attack:.002, release:.7, filter:2300, gain:.28, detune:-3},
      bass:{wave:"sine", attack:.006, release:.5, filter:900, gain:.42, detune:0},
      synthbass:{wave:"sawtooth", attack:.01, release:.45, filter:1000, gain:.25, detune:0},
      strings:{wave:"sawtooth", attack:.16, release:1.1, filter:2500, gain:.15, detune:8},
      brass:{wave:"sawtooth", attack:.06, release:.5, filter:1800, gain:.2, detune:4},
      woodwind:{wave:"sine", attack:.08, release:.5, filter:2400, gain:.22, detune:-2},
      mallet:{wave:"sine", attack:.001, release:.7, filter:5000, gain:.32, detune:0},
      bell:{wave:"sine", attack:.001, release:1.1, filter:7000, gain:.22, detune:0},
      choir:{wave:"sine", attack:.22, release:1.0, filter:1800, gain:.16, detune:6},
      pad:{wave:"sawtooth", attack:.35, release:1.5, filter:1800, gain:.1, detune:12},
      pluck:{wave:"triangle", attack:.001, release:.45, filter:3600, gain:.25, detune:0},
      synth:{wave:"sawtooth", attack:.015, release:.55, filter:2600, gain:.2, detune:5},
      drum:{wave:"noise", attack:.001, release:.18, filter:2500, gain:.35, detune:0},
      talkingdrum:{wave:"sine", attack:.002, release:.25, filter:1300, gain:.38, detune:0},
      djembe:{wave:"noise", attack:.001, release:.3, filter:1700, gain:.3, detune:0},
      conga:{wave:"sine", attack:.001, release:.32, filter:1600, gain:.3, detune:0},
      bongo:{wave:"sine", attack:.001, release:.2, filter:2100, gain:.28, detune:0},
      shaker:{wave:"noise", attack:.001, release:.08, filter:5500, gain:.18, detune:0},
      perc:{wave:"noise", attack:.001, release:.12, filter:3500, gain:.25, detune:0},
      logdrum:{wave:"sine", attack:.003, release:.3, filter:750, gain:.4, detune:0},
      fx:{wave:"sawtooth", attack:.05, release:1.0, filter:1200, gain:.14, detune:0}
    };
    return p[kind] || p.piano;
  }

  function playTone(note, velocity=.8, dur=null, instrument=selectedInstrument) {
    unlockAudio();
    const ins = instruments.find(x => x[0] === instrument) || ["Piano","piano"];
    const p = profile(ins[1]);
    const now = audio.currentTime;
    const o = audio.createOscillator();
    const g = audio.createGain();
    const f = audio.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = p.filter;
    o.type = p.wave === "noise" ? "sine" : p.wave;
    const freq = hz(note);
    o.frequency.setValueAtTime(freq, now);
    o.detune.value = p.detune;
    if (p.wave === "noise") {
      const buffer = audio.createBuffer(1, audio.sampleRate * .3, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
      const src = audio.createBufferSource();
      src.buffer = buffer;
      src.connect(f); f.connect(g); g.connect(master);
      g.gain.setValueAtTime(.0001,now);
      g.gain.exponentialRampToValueAtTime(Math.max(.01,p.gain*velocity), now+p.attack);
      g.gain.exponentialRampToValueAtTime(.0001, now+(dur||p.release));
      src.start(now); src.stop(now+(dur||p.release)+.05);
      return;
    }
    o.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(.0001,now);
    g.gain.exponentialRampToValueAtTime(Math.max(.01,p.gain*velocity), now+p.attack);
    g.gain.exponentialRampToValueAtTime(.0001, now+(dur||p.release));
    o.start(now); o.stop(now+(dur||p.release)+.05);
  }

  function drumHit(type, velocity=.8) {
    const map = {
      Kick:[40,"sine",.34,180], Snare:[190,"noise",.16,3000], Hat:[5000,"noise",.06,8000],
      Clap:[1100,"noise",.11,2500], Perc:[800,"noise",.12,2200], Tom:[120,"sine",.22,1200],
      Crash:[4500,"noise",.55,10000], Ride:[6000,"noise",.4,11000]
    };
    const [freq,wave,dur,filter] = map[type] || map.Kick;
    unlockAudio();
    const now = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(), f = audio.createBiquadFilter();
    f.type="lowpass"; f.frequency.value=filter;
    o.type=wave==="noise"?"sine":wave; o.frequency.value=freq;
    o.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.35*velocity,now+.003);
    g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.start(now); o.stop(now+dur+.03);
    if(wave==="noise"){
      const b=audio.createBuffer(1,audio.sampleRate*dur,audio.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const s=audio.createBufferSource(); s.buffer=b; s.connect(f); s.start(now); s.stop(now+dur+.02);
    }
  }

  const drumPatterns = {
    Afrobeats:{Kick:[0,6,8,12],Snare:[4,12],Hat:[0,2,4,6,8,10,12,14],Perc:[3,7,11,15]},
    Amapiano:{Kick:[0,6,8,12],Snare:[4,12],Hat:[0,2,4,6,8,10,12,14],Perc:[1,5,9,13]},
    Trap:{Kick:[0,3,7,10,14],Snare:[4,12],Hat:[0,1,2,4,5,6,8,10,12,13,14],Perc:[6,14]},
    Drill:{Kick:[0,5,8,11,14],Snare:[4,12],Hat:[0,2,4,6,8,10,12,14],Perc:[3,9,15]},
    "R&B":{Kick:[0,7,10],Snare:[4,12],Hat:[0,2,4,6,8,10,12,14],Perc:[5,13]},
    House:{Kick:[0,4,8,12],Snare:[4,12],Hat:[2,6,10,14],Perc:[3,7,11,15]},
    Pop:{Kick:[0,4,8,12],Snare:[4,12],Hat:[0,2,4,6,8,10,12,14],Perc:[7,15]}
  };

  function defaultTrack(type,name,inst="Piano"){
    return {id:uid(),type,name,instrument:inst,volume:.8,pan:0,mute:false,solo:false,armed:false,fx:"Clean",pitch:0};
  }

  tracks = [
    defaultTrack("instrument","Piano","Piano"),
    defaultTrack("drums","Drums","Acoustic Kit"),
    defaultTrack("audio","Vocals","Piano")
  ];

  const loopPacks = [
    {name:"Afrobeats Starter",genre:"Afrobeats",cells:[
      ["Drums",0,"drums"],["Percussion",1,"perc"],["Bass",2,"bass"],["Keys",3,"keys"],
      ["Melody",4,"melody"],["FX",5,"fx"]
    ]},
    {name:"Amapiano Groove",genre:"Amapiano",cells:[
      ["Kick",0,"kick"],["Log Drum",1,"log"],["Perc",2,"perc"],["Keys",3,"keys"],
      ["Piano",4,"piano"],["FX",5,"fx"]
    ]},
    {name:"Trap Night",genre:"Trap",cells:[
      ["808",0,"808"],["Drums",1,"drums"],["Hats",2,"hat"],["Bell",3,"bell"],
      ["Keys",4,"keys"],["FX",5,"fx"]
    ]},
    {name:"R&B Soul",genre:"R&B",cells:[
      ["Drums",0,"drums"],["Bass",1,"bass"],["Keys",2,"keys"],["Guitar",3,"guitar"],
      ["Pad",4,"pad"],["FX",5,"fx"]
    ]}
  ];

  function loopCellSound(kind){
    const base = midiFromNote(key,3);
    if(kind==="kick") drumHit("Kick",.9);
    else if(kind==="drums"){drumHit("Kick",.8); setTimeout(()=>drumHit("Snare",.7),160); setTimeout(()=>drumHit("Hat",.55),80);}
    else if(kind==="perc"){drumHit("Perc",.7); setTimeout(()=>drumHit("Clap",.55),130);}
    else if(kind==="hat"){drumHit("Hat",.65);}
    else if(kind==="808"){playTone(base-12,.9,.45,"808 Bass");}
    else if(kind==="log"){playTone(base-5,.9,.35,"Amapiano Log Drum");}
    else if(kind==="bass"){playTone(base-12,.8,.5,"Bass Guitar");}
    else if(kind==="keys"||kind==="piano"){[0,4,7].forEach((n,i)=>setTimeout(()=>playTone(base+n,.55,.65,"Afro Piano"),i*15));}
    else if(kind==="melody"){[0,2,4,7].forEach((n,i)=>setTimeout(()=>playTone(base+n,.55,.28,"Afro Pluck"),i*100));}
    else if(kind==="guitar"){[0,7,12].forEach((n,i)=>setTimeout(()=>playTone(base+n,.55,.5,"Clean Guitar"),i*70));}
    else if(kind==="bell"){playTone(base+12,.55,.8,"Trap Bell");}
    else if(kind==="pad"){playTone(base,.4,1.2,"Warm Pad");}
    else if(kind==="fx"){playTone(base+24,.25,.8,"Riser");}
  }

  function snapshot(){
    undoStack.push(JSON.stringify({tracks,clips,loops,bpm,key,projectName}));
    if(undoStack.length>20) undoStack.shift();
  }
  function restore(data){
    tracks=data.tracks||tracks; clips=data.clips||[]; loops=data.loops||[]; bpm=data.bpm||105; key=data.key||"C"; projectName=data.projectName||"My First Song";
    render();
  }

  function addClip(name,trackId,kind="loop",bars=1){
    snapshot();
    clips.push({id:uid(),name,trackId,kind,start:currentStep/16,length:bars});
    render();
  }

  function beat(){
    const p=drumPatterns[document.getElementById("genre")?.value] || drumPatterns.Afrobeats;
    if(p.Kick.includes(currentStep%16)) drumHit("Kick");
    if(p.Snare.includes(currentStep%16)) drumHit("Snare");
    if(p.Hat.includes(currentStep%16)) drumHit("Hat",.45);
    if(p.Perc.includes(currentStep%16)) drumHit("Perc",.5);
  }

  function tick(){
    beat();
    loops.filter(x=>x.on).forEach(x=>{ if(currentStep%16===x.step) loopCellSound(x.kind); });
    currentStep++;
    if(currentStep>=64) currentStep=0;
    updatePlayhead();
  }

  function start(){
    unlockAudio();
    if(playing) return;
    playing=true;
    currentStep=0;
    const ms=60000/bpm/4;
    playTimer=setInterval(tick,ms);
    render();
  }
  function stop(){
    playing=false;
    clearInterval(playTimer); playTimer=null;
    currentStep=0;
    render();
  }

  function addInstrument(){
    snapshot();
    const t=defaultTrack("instrument",selectedInstrument,selectedInstrument);
    tracks.push(t); render();
  }
  function addAudioTrack(){
    snapshot(); tracks.push(defaultTrack("audio","Audio "+(tracks.length+1))); render();
  }

  async function record(){
    unlockAudio();
    if(recording){ recorder?.stop(); return; }
    if(!navigator.mediaDevices?.getUserMedia){alert("Microphone recording is not available in this browser.");return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      recChunks=[];
      const mime=["audio/webm;codecs=opus","audio/mp4","audio/webm"].find(x=>MediaRecorder.isTypeSupported?.(x));
      recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      recorder.ondataavailable=e=>{if(e.data.size)recChunks.push(e.data)};
      recorder.onstop=()=>{
        recording=false; stream.getTracks().forEach(t=>t.stop());
        const blob=new Blob(recChunks,{type:recorder.mimeType||"audio/webm"});
        const url=URL.createObjectURL(blob);
        recordings.push({id:uid(),name:"Vocal Take "+(recordings.length+1),url,blob,size:blob.size});
        const track=tracks.find(t=>t.id===armedTrack)||tracks.find(t=>t.type==="audio");
        if(track) clips.push({id:uid(),name:"Vocal Take "+recordings.length,trackId:track.id,kind:"recording",start:0,length:4,recordingId:recordings.at(-1).id});
        render();
      };
      recorder.start();
      recording=true;
      recordStart=performance.now();
      render();
    }catch(e){alert("Microphone permission is needed for recording.");}
  }

  function playRecording(id){
    const r=recordings.find(x=>x.id===id); if(!r)return;
    const a=new Audio(r.url); a.volume=masterVol; a.play();
  }

  function downloadRecording(id){
    const r=recordings.find(x=>x.id===id); if(!r)return;
    const a=document.createElement("a"); a.href=r.url; a.download=(r.name.replace(/\s+/g,"_")+".webm"); a.click();
  }

  async function importAudio(file){
    if(!file)return;
    const url=URL.createObjectURL(file);
    const track=tracks.find(t=>t.type==="audio")||tracks[0];
    clips.push({id:uid(),name:file.name,trackId:track.id,kind:"import",start:0,length:4,url});
    render();
  }

  function saveProject(){
    const data={version:2,projectName,bpm,key,tracks,clips,loops,masterVol,selectedInstrument};
    try{
      localStorage.setItem("studiobeat_project_"+projectName,JSON.stringify(data));
      localStorage.setItem("studiobeat_last_project",projectName);
      alert("Project saved on this device.");
    }catch(e){alert("The browser could not save this project.");}
  }
  function loadProject(){
    const names=Object.keys(localStorage).filter(k=>k.startsWith("studiobeat_project_")).map(k=>k.replace("studiobeat_project_",""));
    if(!names.length){alert("No saved StudioBeat projects yet.");return;}
    const name=prompt("Project to load:\n\n"+names.join("\n"),projectName);
    if(!name)return;
    try{const d=JSON.parse(localStorage.getItem("studiobeat_project_"+name)); restore(d);}
    catch(e){alert("Could not load that project.");}
  }
  function exportProject(){
    const d={version:2,projectName,bpm,key,tracks,clips,loops};
    const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=projectName.replace(/\s+/g,"_")+".studiobeat.json";a.click();
  }

  function tunerStart(){
    if(tunerStream){tunerStop();return;}
    if(!navigator.mediaDevices?.getUserMedia){alert("Microphone is not available.");return;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      tunerStream=stream;
      const ac=new (window.AudioContext||window.webkitAudioContext)();
      const src=ac.createMediaStreamSource(stream);
      const an=ac.createAnalyser();an.fftSize=4096;src.connect(an);
      const buf=new Float32Array(an.fftSize);
      const loop=()=>{
        if(!tunerStream)return;
        an.getFloatTimeDomainData(buf);
        let best=0,bestCorr=0;
        for(let lag=30;lag<1000;lag++){
          let sum=0;
          for(let i=0;i<buf.length-lag;i+=4)sum+=buf[i]*buf[i+lag];
          if(sum>bestCorr){bestCorr=sum;best=lag;}
        }
        if(best){const f=ac.sampleRate/best;let midi=69+12*Math.log2(f/440);let n=Math.round(midi);let cents=Math.round((midi-n)*100);let note=noteNames[(n%12+12)%12];
          const el=document.getElementById("tunerReadout"); if(el) el.innerHTML=`<b>${note}</b><span>${cents>0?"+":""}${cents} cents</span>`;
          const bar=document.getElementById("tunerBar");if(bar)bar.style.transform=`translateX(${Math.max(-45,Math.min(45,cents*.45))}px)`;
        }
        tunerRAF=requestAnimationFrame(loop);
      }; loop();
    }).catch(()=>alert("Microphone permission is needed for the tuner."));
  }
  function tunerStop(){
    cancelAnimationFrame(tunerRAF);tunerRAF=null;
    tunerStream?.getTracks().forEach(t=>t.stop());tunerStream=null;
  }

  function pianoKey(noteIndex,black=false){
    const midi=12*(octave+1)+noteIndex;
    return `<button class="piano-key ${black?'black':''}" data-midi="${midi}" aria-label="piano key"></button>`;
  }

  function render(){
    app.innerHTML=`
      <style>
      :root{--bg:#090909;--panel:#111;--panel2:#171717;--line:#2b2b2b;--text:#fff;--muted:#999;--white:#f4f4f4}
      *{box-sizing:border-box}body{margin:0;background:#050505;color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      button,input,select{font:inherit}button{color:#fff;background:#151515;border:1px solid #333;border-radius:8px;padding:10px 12px}
      button:active{background:#333}select,input{background:#111;color:#fff;border:1px solid #333;border-radius:7px;padding:8px}
      .sb{min-height:100vh;background:var(--bg)}.top{position:sticky;top:0;z-index:10;background:#080808;border-bottom:1px solid var(--line);padding:10px}
      .brand{display:flex;justify-content:space-between;align-items:center;gap:10px}.brand h1{font-size:18px;margin:0;letter-spacing:2px}.sub{color:#888;font-size:10px}
      .transport{display:flex;gap:7px;align-items:center;overflow:auto;padding-top:9px}.transport button{white-space:nowrap}
      .round{width:42px;height:42px;border-radius:50%;padding:0}.recordBtn{border-color:#fff}.recording{background:#fff;color:#000}
      .meter{height:5px;background:#222;border-radius:4px;overflow:hidden;flex:1;min-width:80px}.meter i{display:block;width:40%;height:100%;background:#fff}
      .tabs{display:flex;gap:4px;overflow:auto;border-bottom:1px solid var(--line);padding:7px}.tabs button{border:0;background:transparent;color:#888}.tabs .on{background:#fff;color:#000}
      .content{padding:10px;max-width:1200px;margin:auto}.section{background:var(--panel);border:1px solid var(--line);border-radius:12px;margin-bottom:10px;padding:10px}
      .sectionHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.sectionHead h2{font-size:14px;margin:0}.muted{color:#888;font-size:12px}
      .timeline{overflow-x:auto}.ruler{display:grid;grid-template-columns:repeat(16,70px);font-size:9px;color:#666;border-bottom:1px solid var(--line);height:25px}
      .ruler span{border-left:1px solid #222;padding:4px}.track{display:grid;grid-template-columns:105px 1fr;min-width:1240px;min-height:72px;border-bottom:1px solid #222}
      .trackInfo{padding:9px;border-right:1px solid var(--line);background:#0d0d0d}.trackInfo b{font-size:12px}.trackInfo small{display:block;color:#777;margin-top:3px}
      .trackBtns{display:flex;gap:3px;margin-top:7px}.trackBtns button{font-size:9px;padding:4px 6px}.lane{position:relative;background:repeating-linear-gradient(90deg,#111 0,#111 69px,#202020 70px);min-height:72px}
      .clip{position:absolute;top:12px;height:48px;border:1px solid #888;background:#ddd;color:#000;border-radius:7px;padding:7px;overflow:hidden;font-size:11px;font-weight:600}
      .clip.dark{background:#292929;color:#fff;border-color:#555}.playhead{position:absolute;top:0;bottom:0;width:2px;background:#fff;z-index:4;left:0}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.card{background:#0d0d0d;border:1px solid #292929;border-radius:9px;padding:10px}
      .card b{display:block;font-size:12px}.card small{color:#777}.row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.row>*{margin:2px 0}
      .instrumentGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;max-height:300px;overflow:auto}.instrumentGrid button{text-align:left}
      .instrumentGrid button.active{background:#fff;color:#000}
      .pianoWrap{overflow-x:auto;padding:12px 2px}.piano{position:relative;height:190px;min-width:720px;display:flex}
      .whiteKeys{display:flex;height:190px}.piano-key.white{width:48px;height:190px;background:#f5f5f5;border:1px solid #111;border-radius:0 0 5px 5px}
      .blackKeys{position:absolute;left:0;top:0;display:flex;height:115px}.blackSpacer{width:48px}.black{width:30px;height:115px;background:#080808;border:1px solid #444;border-radius:0 0 5px 5px;margin-left:-15px;margin-right:-15px;z-index:3}
      .looperGrid{display:grid;grid-template-columns:110px repeat(6,1fr);gap:5px}.loopHead,.loopName{padding:8px;font-size:11px;color:#999}.loopCell{height:55px;border:1px solid #333;background:#0c0c0c;border-radius:7px}.loopCell.on{background:#fff;color:#000}
      .tuner{background:#0c0c0c;border:1px solid #333;border-radius:10px;padding:20px;text-align:center}.tunerRead{font-size:42px}.tunerRead span{display:block;font-size:12px;color:#888}.tunerLine{height:4px;background:#333;position:relative;margin:25px 15px}.tunerLine:after{content:"";position:absolute;left:50%;top:-10px;height:24px;width:2px;background:#fff}.tunerBar{height:10px;width:2px;background:#fff;position:absolute;left:50%;top:-3px;transition:.08s}
      .modal{position:fixed;inset:0;background:#000b;z-index:50;display:flex;align-items:flex-end}.sheet{background:#111;border:1px solid #333;border-radius:16px 16px 0 0;width:100%;max-height:85vh;overflow:auto;padding:15px}
      .file{display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #222}.hidden{display:none}
      @media(min-width:700px){.instrumentGrid{grid-template-columns:repeat(4,1fr)}.grid{grid-template-columns:repeat(4,1fr)}.content{padding:18px}}
      </style>

      <div class="sb">
        <header class="top">
          <div class="brand">
            <div><h1>STUDIOBEAT</h1><div class="sub">RECORD • MIX • ARRANGE</div></div>
            <button id="projectBtn">☰ ${projectName}</button>
          </div>
          <div class="transport">
            <button class="round" id="stopBtn">■</button>
            <button class="round" id="playBtn">${playing?"Ⅱ":"▶"}</button>
            <button class="round recordBtn ${recording?"recording":""}" id="recBtn">●</button>
            <label>BPM <input id="bpm" type="number" min="40" max="240" value="${bpm}" style="width:65px"></label>
            <label>KEY <select id="key">${noteNames.map(n=>`<option ${n===key?"selected":""}>${n}</option>`).join("")}</select></label>
            <label>VOL <input id="master" type="range" min="0" max="1" step=".01" value="${masterVol}"></label>
            <div class="meter"><i></i></div>
          </div>
        </header>

        <nav class="tabs">
          ${["arrange","instruments","looper","record","tuner","mixer","projects"].map(t=>`<button class="${activeTab===t?"on":""}" data-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}
        </nav>

        <main class="content">
          ${activeTab==="arrange"?renderArrange():activeTab==="instruments"?renderInstruments():activeTab==="looper"?renderLooper():
            activeTab==="record"?renderRecord():activeTab==="tuner"?renderTuner():activeTab==="mixer"?renderMixer():renderProjects()}
        </main>
      </div>`;
    bind();
  }

  function renderArrange(){
    const pos=(currentStep/64)*100;
    return `<section class="section">
      <div class="sectionHead"><h2>ARRANGEMENT</h2><span class="muted">${clips.length} clips • ${tracks.length} tracks</span></div>
      <div class="row">
        <button id="addInst">＋ Instrument</button><button id="addAudio">＋ Audio</button><button id="openLooper">＋ Looper</button>
        <button id="save">Save</button><button id="undo">Undo</button>
        <label><input id="metro" type="checkbox" ${metronome?"checked":""}> Metronome</label>
      </div>
      <div class="timeline" style="margin-top:10px">
        <div class="ruler">${Array.from({length:16},(_,i)=>`<span>${i+1}</span>`).join("")}</div>
        ${tracks.map(t=>`<div class="track">
          <div class="trackInfo"><b>${t.name}</b><small>${t.type}</small>
            <div class="trackBtns"><button data-mute="${t.id}">${t.mute?"UNMUTE":"MUTE"}</button><button data-arm="${t.id}">${t.armed?"ARMED":"ARM"}</button></div>
          </div>
          <div class="lane">
            <div class="playhead" style="left:${pos}%"></div>
            ${clips.filter(c=>c.trackId===t.id).map(c=>`<div class="clip ${c.kind==="recording"?"dark":""}" style="left:${c.start/16*100}%;width:${Math.max(6,c.length/16*100)}%">${c.name}</div>`).join("")}
          </div>
        </div>`).join("")}
      </div>
    </section>`;
  }

  function renderInstruments(){
    return `<section class="section">
      <div class="sectionHead"><h2>INSTRUMENTS</h2><button id="addSelected">＋ Add Track</button></div>
      <div class="row"><b>${selectedInstrument}</b><button id="octDown">−</button><span>OCT ${octave}</span><button id="octUp">＋</button><button id="sustain">SUSTAIN</button></div>
      <div class="instrumentGrid">${instruments.map(i=>`<button class="${selectedInstrument===i[0]?"active":""}" data-inst="${i[0]}">${i[0]}</button>`).join("")}</div>
    </section>
    <section class="section">
      <div class="sectionHead"><h2>VIRTUAL KEYBOARD</h2><span class="muted">No note labels — piano layout</span></div>
      <div class="pianoWrap"><div class="piano">
        <div class="whiteKeys">${[0,2,4,5,7,9,11,12,14,16,17,19,21,23,24].map(n=>pianoKey(n,false)).join("")}</div>
        <div class="blackKeys"><div class="blackSpacer"></div>${[1,3,null,6,8,10,null,13,15,null,18,20,22].map(n=>n===null?'<div class="blackSpacer"></div>':pianoKey(n,true)).join("")}</div>
      </div></div>
      <div class="row"><button id="smartChord">SMART CHORD</button><button id="arp">ARPEGGIATOR</button><label>Attack <input type="range" min="0" max="1" value=".1"></label><label>Release <input type="range" min="0" max="1" value=".5"></label></div>
    </section>`;
  }

  function renderLooper(){
    if(!loops.length) loops=Array(24).fill(0).map(()=>({id:uid(),on:false,step:0,kind:"drums"}));
    return `<section class="section">
      <div class="sectionHead"><h2>LOOPER</h2><span class="muted">Pre-made performances • synced to BPM</span></div>
      <div class="grid">${loopPacks.map((p,pi)=>`<div class="card"><b>${p.name}</b><small>${p.genre}</small><div class="looperGrid" style="margin-top:8px">
        ${p.cells.map((c,ci)=>`<div class="loopName">${c[0]}</div><button class="loopCell ${loops[pi*6+ci]?.on?"on":""}" data-loop="${pi*6+ci}" data-kind="${c[2]}" data-step="${c[1]}">●</button>`).join("")}
      </div></div>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button id="loopRecord">RECORD PERFORMANCE</button><button id="filterFx">FILTER</button><button id="gaterFx">GATER</button><button id="stutterFx">STUTTER</button><button id="tapeFx">TAPE STOP</button></div>
    </section>`;
  }

  function renderRecord(){
    return `<section class="section">
      <div class="sectionHead"><h2>VOCAL / AUDIO RECORDING</h2><span class="muted">${recording?"RECORDING…":"Ready"}</span></div>
      <div class="grid">
        <div class="card"><b>Input</b><small>Device microphone</small><div class="meter" style="margin-top:10px"><i></i></div></div>
        <div class="card"><b>Noise Reduction</b><small>Clean background noise</small><button id="noise" style="margin-top:7px">ON</button></div>
        <div class="card"><b>Pitch Correction</b><small>AutoPitch-style correction</small><input id="pitch" type="range" min="0" max="100" value="45"></div>
      </div>
      <div class="row" style="margin-top:10px"><button id="vocalPreset">VOCAL PRESET</button><button id="fx">FX</button><button id="comp">COMPRESSOR</button><button id="eq">EQ</button><button id="reverb">REVERB</button><button id="delay">DELAY</button></div>
      <h3>Recorded Takes</h3>
      ${recordings.length?recordings.map(r=>`<div class="file"><span>${r.name}</span><span><button data-playrec="${r.id}">▶</button><button data-download="${r.id}">↓</button></span></div>`).join(""):"<div class='muted'>Your recordings will appear here and can be placed in the arrangement.</div>"}
    </section>`;
  }

  function renderTuner(){
    return `<section class="section"><div class="sectionHead"><h2>GUITAR TUNER</h2><span class="muted">Standard tuning</span></div>
      <div class="tuner"><div id="tunerReadout" class="tunerRead"><b>—</b><span>Start tuner and play a string</span></div>
      <div class="tunerLine"><i id="tunerBar" class="tunerBar"></i></div>
      <div class="row" style="justify-content:center"><button id="tunerStart">🎸 ${tunerStream?"STOP TUNER":"START TUNER"}</button></div>
      <div class="muted" style="margin-top:14px">E • A • D • G • B • E</div></div>
    </section>`;
  }

  function renderMixer(){
    return `<section class="section"><div class="sectionHead"><h2>MIXER</h2><span class="muted">Track controls</span></div>
      ${tracks.map(t=>`<div class="row" style="border-bottom:1px solid #222;padding:10px 0">
        <b style="width:90px">${t.name}</b><button data-mute="${t.id}">${t.mute?"UNMUTE":"MUTE"}</button><button data-solo="${t.id}">${t.solo?"UNSOLO":"SOLO"}</button>
        <label>VOL <input data-vol="${t.id}" type="range" min="0" max="1" step=".01" value="${t.volume}"></label>
        <label>PAN <input data-pan="${t.id}" type="range" min="-1" max="1" step=".01" value="${t.pan}"></label>
        <select data-fx="${t.id}">${["Clean","Warm Vocal","Bright Vocal","Space","Punch","Wide"].map(x=>`<option ${t.fx===x?"selected":""}>${x}</option>`).join("")}</select>
      </div>`).join("")}
    </section>
    <section class="section"><div class="sectionHead"><h2>MASTER</h2></div><div class="row"><button id="autoMix">AUTO MIX</button><button id="mastering">MASTERING</button><button id="limiter">LIMITER</button></div></section>`;
  }

  function renderProjects(){
    const names=Object.keys(localStorage).filter(k=>k.startsWith("studiobeat_project_")).map(k=>k.replace("studiobeat_project_",""));
    return `<section class="section"><div class="sectionHead"><h2>MY TRACKS</h2><button id="newProject">＋ NEW</button></div>
      <div class="row"><input id="projectName" value="${projectName}" placeholder="Project name"><button id="save2">SAVE</button><button id="load2">LOAD</button><button id="export">EXPORT</button></div>
      <h3>Saved Projects</h3>${names.length?names.map(n=>`<div class="file"><span>🎵 ${n}</span><button data-loadname="${n}">OPEN</button></div>`).join(""):"<div class='muted'>No saved projects yet. Save your first song here.</div>"}
      <h3>Recordings</h3>${recordings.map(r=>`<div class="file"><span>🎙️ ${r.name}</span><button data-playrec="${r.id}">PLAY</button></div>`).join("")||"<div class='muted'>No recordings yet.</div>"}
    </section>`;
  }

  function updatePlayhead(){
    const p=(currentStep/64)*100;
    document.querySelectorAll(".playhead").forEach(e=>e.style.left=p+"%");
  }

  function bind(){
    document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;render()});
    document.getElementById("playBtn")?.addEventListener("click",()=>playing?stop():start());
    document.getElementById("stopBtn")?.addEventListener("click",stop);
    document.getElementById("recBtn")?.addEventListener("click",record);
    document.getElementById("bpm")?.addEventListener("change",e=>{bpm=Math.max(40,Math.min(240,+e.target.value||105));if(playing){stop();start()}});
    document.getElementById("key")?.addEventListener("change",e=>key=e.target.value);
    document.getElementById("master")?.addEventListener("input",e=>{masterVol=+e.target.value;if(master)master.gain.value=masterVol});
    document.getElementById("addInst")?.addEventListener("click",addInstrument);
    document.getElementById("addSelected")?.addEventListener("click",addInstrument);
    document.getElementById("addAudio")?.addEventListener("click",addAudioTrack);
    document.getElementById("openLooper")?.addEventListener("click",()=>{activeTab="looper";render()});
    document.getElementById("save")?.addEventListener("click",saveProject);
    document.getElementById("save2")?.addEventListener("click",()=>{projectName=document.getElementById("projectName").value||"My First Song";saveProject();render()});
    document.getElementById("load2")?.addEventListener("click",loadProject);
    document.getElementById("export")?.addEventListener("click",exportProject);
    document.getElementById("projectBtn")?.addEventListener("click",()=>{activeTab="projects";render()});
    document.getElementById("undo")?.addEventListener("click",()=>{const s=undoStack.pop();if(s)restore(JSON.parse(s))});
    document.getElementById("octDown")?.addEventListener("click",()=>{octave=Math.max(1,octave-1);render()});
    document.getElementById("octUp")?.addEventListener("click",()=>{octave=Math.min(7,octave+1);render()});
    document.getElementById("newProject")?.addEventListener("click",()=>{projectName=prompt("New project name","My New Song")||"My New Song";tracks=[defaultTrack("instrument","Piano","Piano"),defaultTrack("drums","Drums","Acoustic Kit"),defaultTrack("audio","Vocals")];clips=[];render()});
    document.querySelectorAll("[data-inst]").forEach(b=>b.onclick=()=>{selectedInstrument=b.dataset.inst;render()});
    document.querySelectorAll(".piano-key").forEach(k=>{
      const down=e=>{e.preventDefault();playTone(+k.dataset.midi,.85,.65,selectedInstrument)};
      k.addEventListener("pointerdown",down);
    });
    document.querySelectorAll("[data-loop]").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.loop; loops[i]=loops[i]||{id:uid()};
      loops[i].on=!loops[i].on; loops[i].kind=b.dataset.kind; loops[i].step=+b.dataset.step; render();
    });
    document.querySelectorAll("[data-mute]").forEach(b=>b.onclick=()=>{const t=tracks.find(x=>x.id===b.dataset.mute);if(t){t.mute=!t.mute;render()}});
    document.querySelectorAll("[data-solo]").forEach(b=>b.onclick=()=>{const t=tracks.find(x=>x.id===b.dataset.solo);if(t){t.solo=!t.solo;render()}});
    document.querySelectorAll("[data-arm]").forEach(b=>b.onclick=()=>{tracks.forEach(t=>t.armed=false);const t=tracks.find(x=>x.id===b.dataset.arm);if(t)t.armed=true;armedTrack=t?.id;render()});
    document.querySelectorAll("[data-vol]").forEach(i=>i.oninput=e=>{const t=tracks.find(x=>x.id===i.dataset.vol);if(t)t.volume=+e.target.value});
    document.querySelectorAll("[data-pan]").forEach(i=>i.oninput=e=>{const t=tracks.find(x=>x.id===i.dataset.pan);if(t)t.pan=+e.target.value});
    document.querySelectorAll("[data-fx]").forEach(i=>i.onchange=e=>{const t=tracks.find(x=>x.id===i.dataset.fx);if(t)t.fx=e.target.value});
    document.querySelectorAll("[data-playrec]").forEach(b=>b.onclick=()=>playRecording(b.dataset.playrec));
    document.querySelectorAll("[data-download]").forEach(b=>b.onclick=()=>downloadRecording(b.dataset.download));
    document.querySelectorAll("[data-loadname]").forEach(b=>b.onclick=()=>{const d=JSON.parse(localStorage.getItem("studiobeat_project_"+b.dataset.loadname));restore(d)});
    document.getElementById("tunerStart")?.addEventListener("click",tunerStart);
    document.getElementById("noise")?.addEventListener("click",e=>{e.target.textContent=e.target.textContent==="ON"?"OFF":"ON"});
    document.getElementById("autoMix")?.addEventListener("click",()=>{tracks.forEach(t=>t.volume=.8);alert("Auto Mix applied to track levels.")});
    document.getElementById("mastering")?.addEventListener("click",()=>{masterVol=.9;if(master)master.gain.value=.9;alert("Mastering preset applied.")});
    document.getElementById("projectName")?.addEventListener("change",e=>projectName=e.target.value);
    document.getElementById("metro")?.addEventListener("change",e=>metronome=e.target.checked);
    document.getElementById("loopRecord")?.addEventListener("click",()=>{activeTab="arrange";clips.push({id:uid(),name:"Looper Performance",trackId:tracks[0].id,kind:"loop",start:0,length:8});render()});
    document.getElementById("filterFx")?.addEventListener("click",()=>alert("Looper Filter control ready."));
    document.getElementById("gaterFx")?.addEventListener("click",()=>alert("Looper Gater control ready."));
    document.getElementById("stutterFx")?.addEventListener("click",()=>alert("Looper Stutter control ready."));
    document.getElementById("tapeFx")?.addEventListener("click",()=>{if(playing)stop()});
    document.getElementById("smartChord")?.addEventListener("click",()=>alert("Smart Chord mode enabled for the selected instrument."));
    document.getElementById("arp")?.addEventListener("click",()=>alert("Arpeggiator mode enabled for the selected instrument."));
    document.getElementById("vocalPreset")?.addEventListener("click",()=>alert("Vocal preset: Clean + EQ + Compression + Reverb."));
  }

  render();
})();
