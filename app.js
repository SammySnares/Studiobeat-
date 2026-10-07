const app=document.getElementById("app");

const genres=[
  "Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B",
  "Pop","Dancehall","Reggae","Gospel","EDM","House","Lo-fi"
];

const sounds={
  Kick:[90,.18],
  Snare:[180,.1],
  "Hi-Hat":[600,.05],
  Perc:[330,.07],
  Bass:[55,.3],
  Piano:[261.63,.5]
};

let audio=null;
let bpm=105;
let playing=false;
let step=0;
let timer=null;
let recording=false;
let media=null;
let chunks=[];

let masterVolume=0.8;

let volumes={
  Kick:0.8,
  Snare:0.8,
  "Hi-Hat":0.7,
  Perc:0.7,
  Bass:0.8,
  Piano:0.7
};

let muted={
  Kick:false,
  Snare:false,
  "Hi-Hat":false,
  Perc:false,
  Bass:false,
  Piano:false
};

let patterns={
  Kick:[0,4,8,12],
  Snare:[4,12],
  "Hi-Hat":[0,2,4,6,8,10,12,14],
  Perc:[2,6,10,14]
};

function ctx(){
  if(!audio){
    audio=new(window.AudioContext||window.webkitAudioContext)();
  }

  if(audio.state==="suspended") audio.resume();

  return audio;
}

function hit(n){
  if(muted[n]) return;

  let c=ctx();
  let s=sounds[n];

  let o=c.createOscillator();
  let g=c.createGain();

  o.type=
    n==="Hi-Hat" ? "square" :
    n==="Snare" ? "triangle" :
    "sine";

  o.frequency.value=s[0];

  let volume=volumes[n]*masterVolume;

  g.gain.setValueAtTime(.0001,c.currentTime);

  g.gain.exponentialRampToValueAtTime(
    Math.max(.001,volume),
    c.currentTime+.005
  );

  g.gain.exponentialRampToValueAtTime(
    .0001,
    c.currentTime+s[1]
  );

  o.connect(g).connect(c.destination);

  o.start();
  o.stop(c.currentTime+s[1]+.02);
}

function render(){

app.innerHTML=`

<header>
  <b>STUDIO<span>BEAT</span></b>
  <small>FREE MUSIC STUDIO</small>
</header>

<main>

<section class="controls">

<h2>Beat Lab</h2>

<label>Genre</label>

<select id="genre">
${genres.map(x=>`<option>${x}</option>`).join("")}
</select>

<label>
BPM <strong id="bpmv">${bpm}</strong>
</label>

<input
 id="bpm"
 type="range"
 min="60"
 max="180"
 value="${bpm}"
>

<button id="play">
${playing?"⏹ STOP":"▶ PLAY BEAT"}
</button>

<button id="rec" class="${recording?"red":""}">
● ${recording?"STOP RECORDING":"RECORD VOCALS"}
</button>

<hr>

<h3>MASTER</h3>

<label>
Master Volume
<strong id="masterv">${Math.round(masterVolume*100)}%</strong>
</label>

<input
 id="master"
 type="range"
 min="0"
 max="100"
 value="${masterVolume*100}"
>

<button id="auto">✨ AUTO MIX</button>

<button id="masterBtn">🔊 MASTER</button>

</section>

<section class="studio">

<h1>My First Song</h1>

<p class="sub">
Tap pads or program your beat
</p>

<div class="card">

<div class="title">
DRUM SEQUENCER
<span id="glabel">Afrobeats</span>
</div>

${Object.keys(patterns).map(n=>`

<div class="row">

<b>${n}</b>

${Array.from(
{length:16},
(_,i)=>`

<button
class="step ${patterns[n].includes(i)?"on":""}"
data-n="${n}"
data-i="${i}">
</button>

`
).join("")}

</div>

`).join("")}

</div>

<div class="card">

<div class="title">
INSTRUMENT PADS
<span>Tap to play</span>
</div>

<div class="pads">

${Object.keys(sounds).map(n=>`

<button
class="pad"
data-pad="${n}">
${n}
</button>

`).join("")}

</div>

</div>

<div class="card">

<div class="title">
MIXER
<span>Track Volume</span>
</div>

${Object.keys(sounds).map(n=>`

<div class="mixerRow">

<div class="mixerName">
<b>${n}</b>

<button
class="mute ${muted[n]?"muted":""}"
data-mute="${n}">
${muted[n]?"UNMUTE":"MUTE"}
</button>

</div>

<input
class="volume"
data-volume="${n}"
type="range"
min="0"
max="100"
value="${volumes[n]*100}"
>

<span class="volumeValue" id="vol-${n}">
${Math.round(volumes[n]*100)}%
</span>

</div>

`).join("")}

</div>

<div class="card">

<div class="title">
TRACKS
<span>Studio</span>
</div>

<div class="track">
🥁 Beat
<i></i>
</div>

<div class="track">
🎙️ Vocal
<i></i>
</div>

<div class="track">
🎹 Instrument
<i></i>
</div>

</div>

<div class="actions">

<button>＋ INSTRUMENT</button>

<button>＋ SAMPLE</button>

<button>🎤 VOCAL PRESET</button>

</div>

</section>

</main>

<footer>
StudioBeat • Beat making • Recording • Mixing • Mastering
</footer>
`;

document.getElementById("bpm").oninput=e=>{

  bpm=+e.target.value;

  document.getElementById("bpmv").textContent=bpm;

  if(playing){
    clearInterval(timer);
    start();
  }

};

document.getElementById("master").oninput=e=>{

  masterVolume=+e.target.value/100;

  document.getElementById("masterv").textContent=
    Math.round(masterVolume*100)+"%";

};

document.getElementById("play").onclick=()=>{

  if(playing){
    stop();
  }else{
    start();
  }

  render();

};

document.getElementById("rec").onclick=record;

document.getElementById("genre").onchange=e=>{

  document.getElementById("glabel").textContent=
    e.target.value;

};

document.getElementById("auto").onclick=()=>{

  Object.keys(volumes).forEach(n=>{
    volumes[n]=
      n==="Kick"?0.85:
      n==="Snare"?0.75:
      n==="Bass"?0.75:
      0.65;
  });

  render();

  alert("Auto Mix applied!");

};

document.getElementById("masterBtn").onclick=()=>{

  masterVolume=0.85;

  render();

  alert("Mastering applied!");

};

document.querySelectorAll(".pad").forEach(x=>{

  x.onclick=()=>hit(x.dataset.pad);

});

document.querySelectorAll(".step").forEach(x=>{

  x.onclick=()=>{

    let n=x.dataset.n;
    let i=+x.dataset.i;

    patterns[n]=patterns[n].includes(i)
      ?patterns[n].filter(v=>v!==i)
      :[...patterns[n],i].sort((a,b)=>a-b);

    hit(n);

    render();

  };

});

document.querySelectorAll(".volume").forEach(x=>{

  x.oninput=()=>{

    let n=x.dataset.volume;

    volumes[n]=+x.value/100;

    document.getElementById(
      "vol-"+n
    ).textContent=
      Math.round(volumes[n]*100)+"%";

  };

});

document.querySelectorAll(".mute").forEach(x=>{

  x.onclick=()=>{

    let n=x.dataset.mute;

    muted[n]=!muted[n];

    render();

  };

});

}

function start(){

  ctx();

  playing=true;

  step=0;

  let tick=()=>{

    let s=step++%16;

    Object.keys(patterns).forEach(n=>{

      if(patterns[n].includes(s)){
        hit(n);
      }

    });

  };

  tick();

  timer=setInterval(
    tick,
    60000/bpm/4
  );

}

function stop(){

  clearInterval(timer);

  playing=false;

}

async function record(){

  if(recording){

    media.stop();

    return;

  }

  try{

    let stream=
      await navigator.mediaDevices
      .getUserMedia({audio:true});

    media=new MediaRecorder(stream);

    chunks=[];

    media.ondataavailable=e=>{
      chunks.push(e.data);
    };

    media.onstop=()=>{

      let blob=new Blob(
        chunks,
        {type:"audio/webm"}
      );

      let a=document.createElement("a");

      a.href=URL.createObjectURL(blob);

      a.download="StudioBeat-vocal.webm";

      a.click();

      stream.getTracks().forEach(
        t=>t.stop()
      );

      recording=false;

      render();

    };

    media.start();

    recording=true;

    render();

  }catch(e){

    alert(
      "Microphone permission is required."
    );

  }

}

render();
