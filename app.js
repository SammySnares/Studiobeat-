const app=document.getElementById("app");
const genres=["Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B","Pop","Dancehall","Reggae","Gospel","EDM","House","Lo-fi"];
const sounds={Kick:[90,.18],Snare:[180,.1],"Hi-Hat":[600,.05],Perc:[330,.07],Bass:[55,.3],Piano:[261.63,.5]};
let audio=null,bpm=105,playing=false,step=0,timer=null,recording=false,media=null,chunks=[];
let patterns={Kick:[0,4,8,12],Snare:[4,12],"Hi-Hat":[0,2,4,6,8,10,12,14],Perc:[2,6,10,14]};
function ctx(){if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)(); if(audio.state==="suspended")audio.resume();return audio}
function hit(n){let c=ctx(),s=sounds[n],o=c.createOscillator(),g=c.createGain();o.type=n==="Hi-Hat"?"square":n==="Snare"?"triangle":"sine";o.frequency.value=s[0];g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(n==="Kick"?.8:.3,c.currentTime+.005);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+s[1]);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+s[1]+.02)}
function render(){
app.innerHTML=`<header><b>STUDIO<span>BEAT</span></b><small>FREE MUSIC STUDIO</small></header>
<main><section class="controls"><h2>Beat Lab</h2><label>Genre</label><select id="genre">${genres.map(x=>`<option>${x}</option>`).join("")}</select>
<label>BPM <strong id="bpmv">${bpm}</strong></label><input id="bpm" type="range" min="60" max="180" value="${bpm}">
<button id="play">▶ ${playing?"STOP":"PLAY BEAT"}</button><button id="rec" class="${recording?"red":""}">● ${recording?"STOP RECORDING":"RECORD VOCALS"}</button>
<hr><h3>Sound</h3><label>Noise Reduction</label><input type="range" value="70"><label>Studio Master</label><input type="range" value="75">
<button>✨ AUTO MIX</button><button>🔊 MASTER</button></section>
<section class="studio"><h1>My First Song</h1><p class="sub">Tap pads or program your beat</p>
<div class="card"><div class="title">DRUM SEQUENCER <span id="glabel">Afrobeats</span></div>
${Object.keys(patterns).map(n=>`<div class="row"><b>${n}</b>${Array.from({length:16},(_,i)=>`<button class="step ${patterns[n].includes(i)?"on":""}" data-n="${n}" data-i="${i}"></button>`).join("")}</div>`).join("")}</div>
<div class="card"><div class="title">INSTRUMENT PADS <span>Tap to play</span></div><div class="pads">${Object.keys(sounds).map(n=>`<button class="pad" data-pad="${n}">${n}</button>`).join("")}</div></div>
<div class="card"><div class="title">TRACKS <span>Coming next</span></div><div class="track">🥁 Beat <i></i></div><div class="track">🎙️ Vocal <i></i></div><div class="track">🎹 Instrument <i></i></div></div>
<div class="actions"><button>＋ INSTRUMENT</button><button>＋ SAMPLE</button><button>🎤 VOCAL PRESET</button></div>
</section></main><footer>StudioBeat • Beat making • Recording • Mixing • Noise reduction • Mastering</footer>`;
document.getElementById("bpm").oninput=e=>{bpm=+e.target.value;document.getElementById("bpmv").textContent=bpm;if(playing){clearInterval(timer);start()}}
document.getElementById("play").onclick=()=>{playing?stop():start();render()};
document.getElementById("rec").onclick=record;
document.querySelectorAll(".pad").forEach(x=>x.onclick=()=>hit(x.dataset.pad));
document.querySelectorAll(".step").forEach(x=>x.onclick=()=>{let n=x.dataset.n,i=+x.dataset.i;patterns[n]=patterns[n].includes(i)?patterns[n].filter(v=>v!==i):[...patterns[n],i].sort((a,b)=>a-b);hit(n);render()});
document.getElementById("genre").onchange=e=>{document.getElementById("glabel").textContent=e.target.value};
}
function start(){ctx();playing=true;step=0;let tick=()=>{let s=step++%16;Object.keys(patterns).forEach(n=>patterns[n].includes(s)&&hit(n));};tick();timer=setInterval(tick,60000/bpm/4)}
function stop(){clearInterval(timer);playing=false}
async function record(){if(recording){media.stop();return}try{let stream=await navigator.mediaDevices.getUserMedia({audio:true});media=new MediaRecorder(stream);chunks=[];media.ondataavailable=e=>chunks.push(e.data);media.onstop=()=>{let a=document.createElement("a");a.href=URL.createObjectURL(new Blob(chunks,{type:"audio/webm"}));a.download="StudioBeat-vocal.webm";a.click();stream.getTracks().forEach(t=>t.stop());recording=false;render()};media.start();recording=true;render()}catch(e){alert("Microphone permission is required.")}}
render();