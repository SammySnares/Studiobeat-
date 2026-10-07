"use strict";

/* =========================================================
   STUDIOBEAT
   BandLab-style browser music studio
   MASTER VERSION
   ========================================================= */

const app = document.getElementById("app");

if (!app) {
  throw new Error('StudioBeat needs <div id="app"></div> in index.html');
}

/* =========================================================
   GLOBAL DATA
   ========================================================= */

const genres = [
  "Afrobeats",
  "Amapiano",
  "Trap",
  "Drill",
  "Hip-Hop",
  "R&B",
  "Pop",
  "Dancehall",
  "Reggae",
  "Gospel",
  "EDM",
  "House",
  "Lo-fi"
];

let audio = null;
let masterGain = null;
let masterFilter = null;
let compressor = null;
let delayNode = null;
let delayGain = null;
let reverbGain = null;

let bpm = 105;
let playing = false;
let step = 0;
let timer = null;

let masterVolume = 0.8;
let masterPreset = "Clean";

let selectedInstrument = "Grand Piano";
let selectedOctave = 4;

let recording = false;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let vocalURL = null;
let vocalAudio = null;

let sampleTracks = [];
let instrumentTracks = [];

let trackCounter = 1;

const trackSettings = {};

const patterns = {
  Kick: [0, 4, 8, 12],
  Snare: [4, 12],
  "Hi-Hat": [0, 2, 4, 6, 8, 10, 12, 14],
  Clap: [4, 12],
  Perc: [2, 6, 10, 14],
  Tom: [],
  Crash: [0],
  Ride: []
};

const drumTypes = {
  Kick: "kick",
  Snare: "snare",
  "Hi-Hat": "hat",
  Clap: "clap",
  Perc: "perc",
  Tom: "tom",
  Crash: "crash",
  Ride: "ride"
};

/* =========================================================
   150 INSTRUMENTS
   15 CATEGORIES × 10 = 150
   ========================================================= */

const instrumentGroups = {
  "Pianos": [
    "Grand Piano",
    "Bright Piano",
    "Studio Piano",
    "Soft Piano",
    "Upright Piano",
    "Honky Tonk Piano",
    "Electric Piano",
    "Stage Piano",
    "Felt Piano",
    "Dark Piano"
  ],

  "Organs": [
    "Church Organ",
    "Classic Organ",
    "Rock Organ",
    "Jazz Organ",
    "Gospel Organ",
    "Pipe Organ",
    "Rotary Organ",
    "Warm Organ",
    "Vintage Organ",
    "Digital Organ"
  ],

  "Guitars": [
    "Acoustic Guitar",
    "Nylon Guitar",
    "Steel Guitar",
    "Clean Electric Guitar",
    "Jazz Guitar",
    "Blues Guitar",
    "Rock Guitar",
    "Muted Guitar",
    "12 String Guitar",
    "Dream Guitar"
  ],

  "Basses": [
    "Electric Bass",
    "Finger Bass",
    "Picked Bass",
    "Slap Bass",
    "Sub Bass",
    "Deep Bass",
    "Synth Bass",
    "808 Bass",
    "Moog Bass",
    "Warm Bass"
  ],

  "Strings": [
    "Violin",
    "Viola",
    "Cello",
    "Double Bass",
    "String Ensemble",
    "Warm Strings",
    "Orchestral Strings",
    "Solo Strings",
    "Cinematic Strings",
    "Pizzicato Strings"
  ],

  "Brass": [
    "Trumpet",
    "Muted Trumpet",
    "Trombone",
    "French Horn",
    "Tuba",
    "Brass Ensemble",
    "Soft Brass",
    "Bright Brass",
    "Synth Brass",
    "Cinematic Brass"
  ],

  "Woodwinds": [
    "Flute",
    "Piccolo",
    "Clarinet",
    "Oboe",
    "Bassoon",
    "Saxophone",
    "Alto Sax",
    "Tenor Sax",
    "Pan Flute",
    "Woodwind Ensemble"
  ],

  "Synth Leads": [
    "Classic Lead",
    "Bright Lead",
    "Saw Lead",
    "Square Lead",
    "Digital Lead",
    "Vocal Lead",
    "Retro Lead",
    "Acid Lead",
    "Future Lead",
    "Hard Lead"
  ],

  "Synth Pads": [
    "Warm Pad",
    "Soft Pad",
    "Dream Pad",
    "Dark Pad",
    "Ambient Pad",
    "Choir Pad",
    "Analog Pad",
    "Space Pad",
    "Cinematic Pad",
    "Wide Pad"
  ],

  "Synth Plucks": [
    "Synth Pluck",
    "Bright Pluck",
    "Soft Pluck",
    "Bell Pluck",
    "Digital Pluck",
    "House Pluck",
    "Afro Pluck",
    "Amapiano Pluck",
    "Trap Pluck",
    "Future Pluck"
  ],

  "Mallets": [
    "Marimba",
    "Vibraphone",
    "Xylophone",
    "Glockenspiel",
    "Kalimba",
    "Celesta",
    "Wood Mallet",
    "Metal Mallet",
    "Soft Mallet",
    "Dream Mallet"
  ],

  "Bells": [
    "Church Bell",
    "Tubular Bell",
    "Soft Bell",
    "Crystal Bell",
    "Digital Bell",
    "Glass Bell",
    "Dream Bell",
    "Metal Bell",
    "Ambient Bell",
    "Fantasy Bell"
  ],

  "Choir": [
    "Choir",
    "Male Choir",
    "Female Choir",
    "Soft Choir",
    "Gospel Choir",
    "Angel Choir",
    "Dark Choir",
    "Epic Choir",
    "Vocal Pad",
    "Breathy Choir"
  ],

  "FX": [
    "Atmosphere",
    "Space FX",
    "Riser",
    "Impact",
    "Noise Sweep",
    "Reverse FX",
    "Digital FX",
    "Cinematic FX",
    "Glitch FX",
    "Dream FX"
  ],

  "World": [
    "African Kalimba",
    "African Pluck",
    "Afro Flute",
    "Talking Drum",
    "Kora",
    "Balafon",
    "Mbira",
    "World Bells",
    "Tribal Lead",
    "World Pad"
  ]
};

const instruments = [];

Object.keys(instrumentGroups).forEach(category => {
  instrumentGroups[category].forEach(name => {
    instruments.push({
      name,
      category
    });
  });
});

/* Safety check: must always be exactly 150 */
if (instruments.length !== 150) {
  throw new Error(
    "StudioBeat instrument library error: expected 150 instruments, found " +
    instruments.length
  );
}

/* =========================================================
   INSTRUMENT SOUND PROFILES
   ========================================================= */

function profileFor(instrument) {
  const category = instrument.category;
  const name = instrument.name.toLowerCase();

  let wave = "sine";
  let attack = 0.02;
  let release = 0.35;
  let filter = 4200;
  let detune = 0;

  if (category === "Pianos") {
    wave = "triangle";
    attack = 0.005;
    release = 1.0;
    filter = 5200;
  }

  if (category === "Organs") {
    wave = "sine";
    attack = 0.03;
    release = 0.6;
    filter = 4000;
  }

  if (category === "Guitars") {
    wave = "triangle";
    attack = 0.008;
    release = 0.7;
    filter = 3600;
  }

  if (category === "Basses") {
    wave = "sawtooth";
    attack = 0.01;
    release = 0.5;
    filter = 1100;
  }

  if (category === "Strings") {
    wave = "sawtooth";
    attack = 0.18;
    release = 1.2;
    filter = 3000;
  }

  if (category === "Brass") {
    wave = "sawtooth";
    attack = 0.08;
    release = 0.5;
    filter = 2600;
  }

  if (category === "Woodwinds") {
    wave = "sine";
    attack = 0.04;
    release = 0.5;
    filter = 3000;
  }

  if (category === "Synth Leads") {
    wave = name.includes("square") ? "square" : "sawtooth";
    attack = 0.01;
    release = 0.3;
    filter = 5000;
  }

  if (category === "Synth Pads") {
    wave = "sawtooth";
    attack = 0.5;
    release = 1.8;
    filter = 2400;
  }

  if (category === "Synth Plucks") {
    wave = "square";
    attack = 0.005;
    release = 0.25;
    filter = 4800;
  }

  if (category === "Mallets") {
    wave = "sine";
    attack = 0.002;
    release = 0.8;
    filter = 5000;
  }

  if (category === "Bells") {
    wave = "sine";
    attack = 0.002;
    release = 1.5;
    filter = 7000;
  }

  if (category === "Choir") {
    wave = "sine";
    attack = 0.25;
    release = 1.3;
    filter = 3500;
  }

  if (category === "FX") {
    wave = "sawtooth";
    attack = 0.1;
    release = 1.0;
    filter = 6000;
  }

  if (category === "World") {
    wave = "triangle";
    attack = 0.01;
    release = 0.7;
    filter = 4200;
  }

  if (name.includes("dark")) filter *= 0.55;
  if (name.includes("bright")) filter *= 1.25;
  if (name.includes("soft")) filter *= 0.75;
  if (name.includes("warm")) filter *= 0.8;
  if (name.includes("digital")) detune = 7;
  if (name.includes("dream")) detune = -5;

  return {
    wave,
    attack,
    release,
    filter,
    detune
  };
}

/* =========================================================
   AUDIO ENGINE
   ========================================================= */

function ctx() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audio.createGain();
    masterFilter = audio.createBiquadFilter();
    compressor = audio.createDynamicsCompressor();

    delayNode = audio.createDelay(1.5);
    delayGain = audio.createGain();
    reverbGain = audio.createGain();

    masterGain.gain.value = masterVolume;

    masterFilter.type = "lowpass";
    masterFilter.frequency.value = 16000;

    compressor.threshold.value = -10;
    compressor.knee.value = 12;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    delayNode.delayTime.value = 0.18;
    delayGain.gain.value = 0;

    reverbGain.gain.value = 0;

    masterGain
      .connect(masterFilter)
      .connect(compressor)
      .connect(audio.destination);
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  return audio;
}

/* =========================================================
   MASTER EFFECTS
   ========================================================= */

function applyMasterPreset(preset) {
  ctx();

  masterPreset = preset;

  if (preset === "Clean") {
    masterFilter.frequency.value = 16000;
    compressor.threshold.value = -10;
    compressor.ratio.value = 2.5;
    delayGain.gain.value = 0;
    reverbGain.gain.value = 0;
  }

  if (preset === "Punch") {
    masterFilter.frequency.value = 13000;
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    delayGain.gain.value = 0;
    reverbGain.gain.value = 0.02;
  }

  if (preset === "Warm") {
    masterFilter.frequency.value = 8500;
    compressor.threshold.value = -12;
    compressor.ratio.value = 2.8;
    delayGain.gain.value = 0.02;
    reverbGain.gain.value = 0.04;
  }

  if (preset === "Wide") {
    masterFilter.frequency.value = 15000;
    compressor.threshold.value = -11;
    compressor.ratio.value = 2.5;
    delayGain.gain.value = 0.04;
    reverbGain.gain.value = 0.06;
  }

  updateUI();
}

/* =========================================================
   PLAY INSTRUMENT
   ========================================================= */

function playInstrument(name, frequency, duration = 0.6) {
  const c = ctx();

  const instrument =
    instruments.find(x => x.name === name) || instruments[0];

  const p = profileFor(instrument);

  const now = c.currentTime;

  const gain = c.createGain();
  const filter = c.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = p.filter;
  filter.Q.value = 0.7;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    0.22 * masterVolume,
    now + p.attack
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + Math.max(duration, p.release)
  );

  gain.connect(filter).connect(masterGain);

  const osc1 = c.createOscillator();
  osc1.type = p.wave;
  osc1.frequency.value = frequency;
  osc1.detune.value = p.detune;

  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + Math.max(duration, p.release) + 0.05);

  if (
    p.wave === "sawtooth" ||
    p.wave === "square" ||
    instrument.category === "Pianos" ||
    instrument.category === "Strings"
  ) {
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();

    osc2.type = "sine";
    osc2.frequency.value = frequency * 2;
    gain2.gain.value = 0.12;

    osc2.connect(gain2).connect(gain);

    osc2.start(now);
    osc2.stop(now + Math.max(duration, p.release) + 0.05);
  }
}

/* =========================================================
   DRUM SOUNDS
   ========================================================= */

function noiseBuffer() {
  const c = ctx();
  const buffer = c.createBuffer(
    1,
    c.sampleRate * 1,
    c.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function drumHit(type) {
  const c = ctx();
  const now = c.currentTime;

  const gain = c.createGain();
  gain.connect(masterGain);

  if (type === "kick") {
    const osc = c.createOscillator();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);

    gain.gain.setValueAtTime(0.8 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.28);
    return;
  }

  if (type === "tom") {
    const osc = c.createOscillator();

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);

    gain.gain.setValueAtTime(0.5 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.38);
    return;
  }

  const source = c.createBufferSource();
  source.buffer = noiseBuffer();

  const filter = c.createBiquadFilter();

  if (type === "snare" || type === "clap") {
    filter.type = "bandpass";
    filter.frequency.value = 1800;
  } else if (type === "hat" || type === "ride") {
    filter.type = "highpass";
    filter.frequency.value = 5000;
  } else if (type === "crash") {
    filter.type = "highpass";
    filter.frequency.value = 3000;
  } else {
    filter.type = "bandpass";
    filter.frequency.value = 1000;
  }

  const length =
    type === "crash" ? 0.8 :
    type === "ride" ? 0.5 :
    type === "hat" ? 0.07 :
    type === "clap" ? 0.16 :
    0.22;

  gain.gain.setValueAtTime(
    (type === "crash" ? 0.32 : 0.4) * masterVolume,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + length
  );

  source.connect(filter).connect(gain);

  source.start(now);
  source.stop(now + length + 0.03);
}

/* =========================================================
   SEQUENCER
   ========================================================= */

function stepDuration() {
  return 60000 / bpm / 4;
}

function sequencerTick() {
  Object.keys(patterns).forEach(name => {
    if (patterns[name].includes(step)) {
      drumHit(drumTypes[name]);
    }
  });

  document.querySelectorAll(".seq-step").forEach(button => {
    button.classList.toggle(
      "current",
      Number(button.dataset.step) === step
    );
  });

  step = (step + 1) % 16;
}

function start() {
  if (playing) return;

  ctx();

  playing = true;
  step = 0;

  sequencerTick();

  timer = setInterval(
    sequencerTick,
    stepDuration()
  );

  updateUI();
}

function stop() {
  playing = false;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  step = 0;

  document.querySelectorAll(".seq-step").forEach(button => {
    button.classList.remove("current");
  });

  updateUI();
}

/* =========================================================
   VOCAL RECORDING
   ========================================================= */

async function recordVocals() {
  if (recording) {
    stopRecording();
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const types = [
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus"
    ];

    let selectedType = "";

    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported
    ) {
      selectedType =
        types.find(type =>
          MediaRecorder.isTypeSupported(type)
        ) || "";
    }

    mediaRecorder = selectedType
      ? new MediaRecorder(mediaStream, {
          mimeType: selectedType
        })
      : new MediaRecorder(mediaStream);

    recordedChunks = [];

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, {
        type: mediaRecorder.mimeType || "audio/mp4"
      });

      if (vocalURL) {
        URL.revokeObjectURL(vocalURL);
      }

      vocalURL = URL.createObjectURL(blob);

      vocalAudio = new Audio(vocalURL);
      vocalAudio.controls = true;

      mediaStream.getTracks().forEach(track => {
        track.stop();
      });

      mediaStream = null;

      render();
    };

    mediaRecorder.start();
    recording = true;

    updateUI();

  } catch (error) {
    alert(
      "Microphone permission is needed to record vocals."
    );
  }
}

function stopRecording() {
  if (
    mediaRecorder &&
    mediaRecorder.state !== "inactive"
  ) {
    mediaRecorder.stop();
  }

  recording = false;
  updateUI();
}

/* =========================================================
   SAMPLE IMPORT
   ========================================================= */

function importSample(file) {
  if (!file) return;

  const url = URL.createObjectURL(file);

  sampleTracks.push({
    id: "sample-" + Date.now(),
    name: file.name,
    url,
    volume: 0.8,
    muted: false
  });

  render();
}

/* =========================================================
   INSTRUMENT TRACKS
   ========================================================= */

function addInstrumentTrack(name) {
  instrumentTracks.push({
    id: "instrument-" + Date.now() + "-" + trackCounter++,
    name,
    volume: 0.8,
    muted: false
  });

  selectedInstrument = name;

  render();
}

function removeInstrumentTrack(id) {
  instrumentTracks =
    instrumentTracks.filter(track => track.id !== id);

  render();
}

function removeSample(id) {
  const track =
    sampleTracks.find(x => x.id === id);

  if (track) {
    URL.revokeObjectURL(track.url);
  }

  sampleTracks =
    sampleTracks.filter(x => x.id !== id);

  render();
}

/* =========================================================
   AUTO MIX
   ========================================================= */

function autoMix() {
  Object.keys(trackSettings).forEach(name => {
    trackSettings[name].volume = 0.75;
  });

  masterVolume = 0.78;

  instrumentTracks.forEach(track => {
    track.volume = 0.75;
  });

  sampleTracks.forEach(track => {
    track.volume = 0.75;
  });

  applyMasterPreset("Punch");
  render();

  alert("Auto Mix applied.");
}

/* =========================================================
   MASTER
   ========================================================= */

function masterProject() {
  applyMasterPreset("Clean");

  masterVolume = Math.min(
    0.9,
    Math.max(masterVolume, 0.8)
  );

  if (masterGain) {
    masterGain.gain.value = masterVolume;
  }

  render();

  alert("Mastering preset applied.");
}

/* =========================================================
   SAVE PROJECT
   ========================================================= */

function projectData() {
  const trackData = {};

  Object.keys(trackSettings).forEach(name => {
    trackData[name] = {
      volume: trackSettings[name].volume,
      muted: trackSettings[name].muted,
      pan: trackSettings[name].pan
    };
  });

  return {
    app: "StudioBeat",
    version: 2,
    bpm,
    genre:
      document.getElementById("genre")?.value ||
      "Afrobeats",
    masterVolume,
    masterPreset,
    selectedInstrument,
    selectedOctave,
    patterns,
    trackSettings: trackData,
    instrumentTracks: instrumentTracks.map(track => ({
      id: track.id,
      name: track.name,
      volume: track.volume,
      muted: track.muted
    })),
    savedAt: new Date().toISOString()
  };
}

function saveProject() {
  try {
    localStorage.setItem(
      "StudioBeatProject",
      JSON.stringify(projectData())
    );

    alert("Project saved on this device.");
  } catch (error) {
    alert("Could not save the project.");
  }
}

function loadProject() {
  try {
    const saved =
      localStorage.getItem("StudioBeatProject");

    if (!saved) {
      alert("No saved StudioBeat project found.");
      return;
    }

    const data = JSON.parse(saved);

    bpm = Number(data.bpm) || 105;
    masterVolume =
      Number(data.masterVolume) || 0.8;

    masterPreset =
      data.masterPreset || "Clean";

    selectedInstrument =
      data.selectedInstrument || "Grand Piano";

    selectedOctave =
      Number(data.selectedOctave) || 4;

    if (data.patterns) {
      Object.keys(patterns).forEach(name => {
        if (Array.isArray(data.patterns[name])) {
          patterns[name] = data.patterns[name];
        }
      });
    }

    if (data.trackSettings) {
      Object.keys(data.trackSettings).forEach(name => {
        trackSettings[name] = {
          volume:
            Number(data.trackSettings[name].volume) ||
            0.8,
          muted:
            !!data.trackSettings[name].muted,
          pan:
            Number(data.trackSettings[name].pan) || 0
        };
      });
    }

    if (data.instrumentTracks) {
      instrumentTracks =
        data.instrumentTracks.map(track => ({
          id: track.id,
          name: track.name,
          volume:
            Number(track.volume) || 0.8,
          muted: !!track.muted
        }));
    }

    if (masterGain) {
      masterGain.gain.value = masterVolume;
    }

    render();

    alert("Project loaded.");

  } catch (error) {
    alert("The saved project could not be loaded.");
  }
}

/* =========================================================
   EXPORT PROJECT JSON
   ========================================================= */

function exportProject() {
  const data =
    JSON.stringify(projectData(), null, 2);

  const blob = new Blob(
    [data],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "StudioBeat-Project.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* =========================================================
   KEYBOARD
   ========================================================= */

const pianoNotes = [
  ["C", 261.63],
  ["C#", 277.18],
  ["D", 293.66],
  ["D#", 311.13],
  ["E", 329.63],
  ["F", 349.23],
  ["F#", 369.99],
  ["G", 392.00],
  ["G#", 415.30],
  ["A", 440.00],
  ["A#", 466.16],
  ["B", 493.88]
];

function noteFrequency(base, octave) {
  return base * Math.pow(2, octave - 4);
}

/* =========================================================
   UI STYLES
   ========================================================= */

function ensureStyles() {
  if (document.getElementById("studiobeat-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "studiobeat-style";

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #080a10;
      color: #f4f6fb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button,
    select,
    input {
      font: inherit;
    }

    button {
      border: 0;
      cursor: pointer;
    }

    .sb-header {
      padding: 18px;
      background: linear-gradient(135deg,#111827,#090b12);
      border-bottom: 1px solid #252a38;
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .sb-brand {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
    }

    .sb-brand span {
      color: #8b5cf6;
    }

    .sb-sub {
      color: #8e96a8;
      font-size: 11px;
      margin-top: 4px;
    }

    .sb-wrap {
      max-width: 1100px;
      margin: auto;
      padding: 14px;
    }

    .sb-card {
      background: #11141d;
      border: 1px solid #252a38;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.18);
    }

    .sb-title {
      font-weight: 800;
      font-size: 15px;
      margin-bottom: 12px;
    }

    .sb-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 10px;
    }

    .sb-control {
      background: #0c0f17;
      border: 1px solid #242938;
      padding: 10px;
      border-radius: 12px;
    }

    .sb-control label {
      display: block;
      color: #9299a9;
      font-size: 11px;
      margin-bottom: 6px;
    }

    select,
    input[type="range"] {
      width: 100%;
    }

    select {
      background: #171b27;
      color: white;
      border: 1px solid #303648;
      border-radius: 9px;
      padding: 9px;
    }

    input[type="range"] {
      accent-color: #8b5cf6;
    }

    .sb-buttons {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 8px;
      margin-top: 10px;
    }

    .sb-btn {
      background: #202638;
      color: white;
      padding: 11px;
      border-radius: 10px;
      font-weight: 700;
    }

    .sb-btn.primary {
      background: #7c3aed;
    }

    .sb-btn.danger {
      background: #b4233b;
    }

    .sb-btn.success {
      background: #176b4d;
    }

    .sb-btn:active,
    .sb-step:active,
    .sb-pad:active,
    .piano-key:active {
      transform: scale(.97);
    }

    .seq-row {
      display: grid;
      grid-template-columns: 70px repeat(16,minmax(12px,1fr));
      gap: 4px;
      align-items: center;
      margin-bottom: 7px;
    }

    .seq-name {
      font-size: 10px;
      color: #aeb5c5;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .seq-step {
      height: 27px;
      background: #202534;
      border-radius: 5px;
      border: 1px solid #303649;
      padding: 0;
    }

    .seq-step.on {
      background: #8b5cf6;
      border-color: #a78bfa;
    }

    .seq-step.current {
      outline: 2px solid #fff;
      outline-offset: 1px;
    }

    .piano {
      display: grid;
      grid-template-columns: repeat(12,1fr);
      gap: 4px;
    }

    .piano-key {
      min-height: 90px;
      border-radius: 8px;
      background: #eee;
      color: #111;
      font-weight: 800;
      touch-action: manipulation;
    }

    .piano-key.black {
      background: #171923;
      color: white;
      min-height: 65px;
    }

    .instrument-current {
      background: #0b0e15;
      border: 1px solid #292f40;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 10px;
    }

    .instrument-current strong {
      color: #a78bfa;
    }

    .track {
      background: #0b0e15;
      border: 1px solid #252b3b;
      border-radius: 12px;
      padding: 11px;
      margin-bottom: 8px;
    }

    .track-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .track-name {
      font-weight: 800;
      font-size: 13px;
    }

    .track-tools {
      display: flex;
      gap: 5px;
    }

    .mini {
      padding: 6px 8px;
      border-radius: 7px;
      background: #202638;
      color: white;
      font-size: 10px;
    }

    .mini.active {
      background: #8b5cf6;
    }

    .library {
      max-height: 420px;
      overflow: auto;
      border: 1px solid #252a38;
      border-radius: 12px;
    }

    .library-group {
      padding: 8px 10px;
      color: #a78bfa;
      font-size: 11px;
      font-weight: 800;
      position: sticky;
      top: 0;
      background: #151824;
    }

    .library-item {
      width: 100%;
      text-align: left;
      padding: 10px;
      background: #0d1018;
      color: white;
      border-bottom: 1px solid #1d2230;
    }

    .library-item:hover {
      background: #1c2130;
    }

    .status {
      color: #8e96a8;
      font-size: 11px;
    }

    .recording {
      color: #ff5068;
      font-weight: 800;
    }

    .meter {
      height: 7px;
      background: #202534;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 8px;
    }

    .meter div {
      height: 100%;
      width: 60%;
      background: #8b5cf6;
    }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.78);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-box {
      width: min(700px,100%);
      max-height: 90vh;
      overflow: auto;
      background: #11141d;
      border: 1px solid #303648;
      border-radius: 18px;
      padding: 16px;
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .modal-close {
      background: #292f3e;
      color: white;
      border-radius: 8px;
      padding: 7px 10px;
    }

    audio {
      width: 100%;
      margin-top: 8px;
    }

    .footer {
      text-align: center;
      color: #6f7789;
      padding: 20px;
      font-size: 11px;
    }

    @media(max-width:650px) {
      .sb-grid {
        grid-template-columns: 1fr;
      }

      .seq-row {
        grid-template-columns: 52px repeat(16,minmax(11px,1fr));
        gap: 2px;
      }

      .seq-step {
        height: 25px;
      }

      .piano {
        grid-template-columns: repeat(6,1fr);
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {
  ensureStyles();

  const genre =
    document.getElementById("genre")?.value ||
    "Afrobeats";

  const instrumentGroupsHTML =
    Object.entries(instrumentGroups)
      .map(([category, names]) => `
        <div class="library-group">
          ${category}
        </div>

        ${names.map(name => `
          <button
            class="library-item"
            data-select-instrument="${name}">
            ${name}
          </button>
        `).join("")}
      `)
      .join("");

  const sequencerHTML =
    Object.keys(patterns)
      .map(name => `
        <div class="seq-row">
          <div class="seq-name">${name}</div>

          ${Array.from({length:16},(_,i) => `
            <button
              class="seq-step ${patterns[name].includes(i) ? "on" : ""}"
              data-drum="${name}"
              data-step="${i}">
            </button>
          `).join("")}
        </div>
      `)
      .join("");

  const pianoHTML =
    pianoNotes.map(([note, freq]) => {
      const black =
        note.includes("#") ? "black" : "";

      return `
        <button
          class="piano-key ${black}"
          data-note="${freq}">
          ${note}
        </button>
      `;
    }).join("");

  const instrumentTracksHTML =
    instrumentTracks.map(track => `
      <div class="track">
        <div class="track-head">
          <div class="track-name">
            🎹 ${track.name}
          </div>

          <div class="track-tools">
            <button
              class="mini ${track.muted ? "active" : ""}"
              data-track-mute="${track.id}">
              ${track.muted ? "UNMUTE" : "MUTE"}
            </button>

            <button
              class="mini"
              data-track-delete="${track.id}">
              DELETE
            </button>
          </div>
        </div>

        <label class="status">
          Volume
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value="${Math.round(track.volume * 100)}"
          data-track-volume="${track.id}">
      </div>
    `).join("");

  const sampleTracksHTML =
    sampleTracks.map(track => `
      <div class="track">
        <div class="track-head">
          <div class="track-name">
            🎵 ${track.name}
          </div>

          <div class="track-tools">
            <button
              class="mini"
              data-sample-play="${track.id}">
              PLAY
            </button>

            <button
              class="mini"
              data-sample-delete="${track.id}">
              DELETE
            </button>
          </div>
        </div>

        <label class="status">
          Volume
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value="${Math.round(track.volume * 100)}"
          data-sample-volume="${track.id}">
      </div>
    `).join("");

  const vocalHTML = vocalURL
    ? `
      <div class="track">
        <div class="track-name">
          🎙️ Vocal Recording
        </div>

        <audio
          controls
          src="${vocalURL}">
        </audio>
      </div>
    `
    : "";

  app.innerHTML = `
    <header class="sb-header">
      <div class="sb-brand">
        STUDIO<span>BEAT</span>
      </div>

      <div class="sb-sub">
        BANDLAB-STYLE MUSIC STUDIO
      </div>
    </header>

    <div class="sb-wrap">

      <!-- TRANSPORT -->
      <section class="sb-card">

        <div class="sb-title">
          🎚️ PROJECT
        </div>

        <div class="sb-grid">

          <div class="sb-control">
            <label>GENRE</label>

            <select id="genre">
              ${genres.map(g => `
                <option
                  ${g === genre ? "selected" : ""}>
                  ${g}
                </option>
              `).join("")}
            </select>
          </div>

          <div class="sb-control">
            <label>
              BPM <strong>${bpm}</strong>
            </label>

            <input
              id="bpm"
              type="range"
              min="60"
              max="180"
              value="${bpm}">
          </div>

        </div>

        <div class="sb-buttons">

          <button
            id="play"
            class="sb-btn primary">
            ${playing ? "⏹ STOP" : "▶ PLAY"}
          </button>

          <button
            id="record"
            class="sb-btn ${recording ? "danger" : ""}">
            ${recording ? "⏹ STOP RECORDING" : "🎙️ RECORD VOCALS"}
          </button>

        </div>

      </section>

      <!-- MASTER -->
      <section class="sb-card">

        <div class="sb-title">
          🔊 MASTER
        </div>

        <div class="sb-control">

          <label>
            Master Volume
            <strong>
              ${Math.round(masterVolume * 100)}%
            </strong>
          </label>

          <input
            id="master"
            type="range"
            min="0"
            max="100"
            value="${masterVolume * 100}">

        </div>

        <div class="sb-grid" style="margin-top:10px">

          <div class="sb-control">

            <label>
              Master Preset
            </label>

            <select id="masterPreset">

              ${["Clean","Punch","Warm","Wide"]
                .map(p => `
                  <option
                    ${masterPreset === p ? "selected" : ""}>
                    ${p}
                  </option>
                `).join("")}

            </select>

          </div>

          <div class="sb-control">

            <label>
              Studio Status
            </label>

            <div class="status">
              ${playing
                ? "Playing beat"
                : "Ready"}
            </div>

            <div class="meter">
              <div></div>
            </div>

          </div>

        </div>

        <div class="sb-buttons">

          <button
            id="autoMix"
            class="sb-btn">
            ✨ AUTO MIX
          </button>

          <button
            id="masterBtn"
            class="sb-btn success">
            🎚️ MASTER
          </button>

        </div>

      </section>

      <!-- DRUM SEQUENCER -->
      <section class="sb-card">

        <div class="sb-title">
          🥁 DRUM SEQUENCER
        </div>

        <div class="status">
          ${genre} • 16-step pattern
        </div>

        <div style="margin-top:14px">
          ${sequencerHTML}
        </div>

      </section>

      <!-- INSTRUMENT -->
      <section class="sb-card">

        <div class="sb-title">
          🎹 VIRTUAL INSTRUMENT
        </div>

        <div class="instrument-current">
          Selected:
          <strong>${selectedInstrument}</strong>
          <br>
          <span class="status">
            Octave ${selectedOctave}
          </span>
        </div>

        <div class="sb-buttons">

          <button
            id="instrumentBrowser"
            class="sb-btn primary">
            🎛️ CHOOSE INSTRUMENT
          </button>

          <button
            id="addInstrument"
            class="sb-btn">
            ＋ ADD TRACK
          </button>

        </div>

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:8px;
            margin-top:8px;
          ">

          <button
            id="octaveDown"
            class="sb-btn">
            OCTAVE −
          </button>

          <button
            id="octaveUp"
            class="sb-btn">
            OCTAVE ＋
          </button>

        </div>

        <div
          class="piano"
          style="margin-top:12px">
          ${pianoHTML}
        </div>

      </section>

      <!-- TRACKS -->
      <section class="sb-card">

        <div class="sb-title">
          🎚️ TRACKS & MIXER
        </div>

        ${instrumentTracksHTML}

        ${vocalHTML}

        ${sampleTracksHTML}

        ${
          !instrumentTracks.length &&
          !vocalURL &&
          !sampleTracks.length
            ? `
              <div class="status">
                No extra tracks yet.
                Add an instrument, record vocals,
                or import an audio sample.
              </div>
            `
            : ""
        }

      </section>

      <!-- PROJECT -->
      <section class="sb-card">

        <div class="sb-title">
          💾 PROJECT
        </div>

        <div class="sb-buttons">

          <button
            id="saveProject"
            class="sb-btn success">
            💾 SAVE
          </button>

          <button
            id="loadProject"
            class="sb-btn">
            📂 LOAD
          </button>

          <button
            id="exportProject"
            class="sb-btn">
            📤 EXPORT
          </button>

          <button
            id="importSample"
            class="sb-btn">
            🎵 IMPORT AUDIO
          </button>

        </div>

        <input
          id="sampleInput"
          type="file"
          accept="audio/*"
          hidden>

      </section>

      <!-- LIBRARY -->
      <div id="instrumentModal" class="modal" style="display:none">

        <div class="modal-box">

          <div class="modal-head">

            <strong>
              🎹 150 INSTRUMENTS
            </strong>

            <button
              id="closeInstrument"
              class="modal-close">
              CLOSE
            </button>

          </div>

          <div class="status" style="margin-bottom:10px">
            Choose an instrument for the virtual keyboard.
          </div>

          <div class="library">
            ${instrumentGroupsHTML}
          </div>

        </div>

      </div>

    </div>

    <div class="footer">
      StudioBeat • Create • Record • Mix • Master
      <br>
      150 virtual instruments
    </div>
  `;

  bindEvents();
}

/* =========================================================
   EVENT HANDLERS
   ========================================================= */

function bindEvents() {

  /* PLAY */
  const play = document.getElementById("play");

  if (play) {
    play.onclick = () => {
      if (playing) {
        stop();
      } else {
        start();
      }
    };
  }

  /* BPM */
  const bpmInput = document.getElementById("bpm");

  if (bpmInput) {
    bpmInput.oninput = event => {
      bpm = Number(event.target.value);

      if (playing) {
        clearInterval(timer);

        timer = setInterval(
          sequencerTick,
          stepDuration()
        );
      }

      const bpmText =
        event.target.parentElement.querySelector("strong");

      if (bpmText) {
        bpmText.textContent = bpm;
      }
    };
  }

  /* GENRE */
  const genre = document.getElementById("genre");

  if (genre) {
    genre.onchange = () => {
      render();
    };
  }

  /* MASTER */
  const master = document.getElementById("master");

  if (master) {
    master.oninput = event => {
      masterVolume =
        Number(event.target.value) / 100;

      ctx();

      masterGain.gain.value =
        masterVolume;
    };
  }

  /* MASTER PRESET */
  const preset =
    document.getElementById("masterPreset");

  if (preset) {
    preset.onchange = event => {
      applyMasterPreset(event.target.value);
    };
  }

  /* AUTO MIX */
  const autoMixButton =
    document.getElementById("autoMix");

  if (autoMixButton) {
    autoMixButton.onclick = autoMix;
  }

  /* MASTER */
  const masterButton =
    document.getElementById("masterBtn");

  if (masterButton) {
    masterButton.onclick = masterProject;
  }

  /* RECORD */
  const record =
    document.getElementById("record");

  if (record) {
    record.onclick = recordVocals;
  }

  /* DRUM STEPS */
  document.querySelectorAll(".seq-step")
    .forEach(button => {

      button.onclick = () => {

        const drum =
          button.dataset.drum;

        const stepNumber =
          Number(button.dataset.step);

        if (
          patterns[drum].includes(stepNumber)
        ) {
          patterns[drum] =
            patterns[drum].filter(
              x => x !== stepNumber
            );

          button.classList.remove("on");

        } else {

          patterns[drum].push(stepNumber);

          patterns[drum].sort(
            (a,b) => a-b
          );

          button.classList.add("on");
        }

        drumHit(drumTypes[drum]);
      };
    });

  /* INSTRUMENT BROWSER */
  const browser =
    document.getElementById("instrumentBrowser");

  const modal =
    document.getElementById("instrumentModal");

  if (browser && modal) {
    browser.onclick = () => {
      modal.style.display = "flex";
    };
  }

  /* CLOSE LIBRARY */
  const close =
    document.getElementById("closeInstrument");

  if (close && modal) {
    close.onclick = () => {
      modal.style.display = "none";
    };
  }

  /* SELECT INSTRUMENT */
  document.querySelectorAll(
    "[data-select-instrument]"
  ).forEach(button => {

    button.onclick = () => {

      selectedInstrument =
        button.dataset.selectInstrument;

      if (modal) {
        modal.style.display = "none";
      }

      render();
    };
  });

  /* ADD INSTRUMENT */
  const add =
    document.getElementById("addInstrument");

  if (add) {
    add.onclick = () => {
      addInstrumentTrack(
        selectedInstrument
      );
    };
  }

  /* OCTAVE DOWN */
  const octaveDown =
    document.getElementById("octaveDown");

  if (octaveDown) {
    octaveDown.onclick = () => {
      selectedOctave =
        Math.max(1, selectedOctave - 1);

      render();
    };
  }

  /* OCTAVE UP */
  const octaveUp =
    document.getElementById("octaveUp");

  if (octaveUp) {
    octaveUp.onclick = () => {
      selectedOctave =
        Math.min(8, selectedOctave + 1);

      render();
    };
  }

  /* PIANO */
  document.querySelectorAll(
    ".piano-key"
  ).forEach(key => {

    key.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();

        const baseFrequency =
          Number(key.dataset.note);

        const frequency =
          noteFrequency(
            baseFrequency,
            selectedOctave
          );

        playInstrument(
          selectedInstrument,
          frequency
        );
      }
    );
  });

  /* TRACK MUTE */
  document.querySelectorAll(
    "[data-track-mute]"
  ).forEach(button => {

    button.onclick = () => {

      const id =
        button.dataset.trackMute;

      const track =
        instrumentTracks.find(
          x => x.id === id
        );

      if (track) {
        track.muted = !track.muted;
        render();
      }
    };
  });

  /* TRACK DELETE */
  document.querySelectorAll(
    "[data-track-delete]"
  ).forEach(button => {

    button.onclick = () => {

      removeInstrumentTrack(
        button.dataset.trackDelete
      );
    };
  });

  /* TRACK VOLUME */
  document.querySelectorAll(
    "[data-track-volume]"
  ).forEach(input => {

    input.oninput = () => {

      const id =
        input.dataset.trackVolume;

      const track =
        instrumentTracks.find(
          x => x.id === id
        );

      if (track) {
        track.volume =
          Number(input.value) / 100;
      }
    };
  });

  /* SAMPLE DELETE */
  document.querySelectorAll(
    "[data-sample-delete]"
  ).forEach(button => {

    button.onclick = () => {
      removeSample(
        button.dataset.sampleDelete
      );
    };
  });

  /* SAMPLE PLAY */
  document.querySelectorAll(
    "[data-sample-play]"
  ).forEach(button => {

    button.onclick = () => {

      const track =
        sampleTracks.find(
          x => x.id ===
            button.dataset.samplePlay
        );

      if (!track) return;

      const audioElement =
        new Audio(track.url);

      audioElement.volume =
        track.volume;

      audioElement.play();
    };
  });

  /* SAMPLE VOLUME */
  document.querySelectorAll(
    "[data-sample-volume]"
  ).forEach(input => {

    input.oninput = () => {

      const track =
        sampleTracks.find(
          x => x.id ===
            input.dataset.sampleVolume
        );

      if (track) {
        track.volume =
          Number(input.value) / 100;
      }
    };
  });

  /* IMPORT SAMPLE */
  const importButton =
    document.getElementById("importSample");

  const sampleInput =
    document.getElementById("sampleInput");

  if (importButton && sampleInput) {

    importButton.onclick = () => {
      sampleInput.click();
    };

    sampleInput.onchange = event => {

      const file =
        event.target.files[0];

      importSample(file);

      event.target.value = "";
    };
  }

  /* SAVE */
  const save =
    document.getElementById("saveProject");

  if (save) {
    save.onclick = saveProject;
  }

  /* LOAD */
  const load =
    document.getElementById("loadProject");

  if (load) {
    load.onclick = loadProject;
  }

  /* EXPORT */
  const exportButton =
    document.getElementById("exportProject");

  if (exportButton) {
    exportButton.onclick =
      exportProject;
  }
}

/* =========================================================
   UPDATE UI WITHOUT REBUILDING EVERYTHING
   ========================================================= */

function updateUI() {

  const play =
    document.getElementById("play");

  if (play) {
    play.textContent =
      playing ? "⏹ STOP" : "▶ PLAY";
  }

  const record =
    document.getElementById("record");

  if (record) {
    record.textContent =
      recording
        ? "⏹ STOP RECORDING"
        : "🎙️ RECORD VOCALS";
  }

  document.querySelectorAll(
    ".seq-step"
  ).forEach(button => {

    button.classList.toggle(
      "current",
      Number(button.dataset.step) === step &&
      playing
    );
  });
}

/* =========================================================
   START APP
   ========================================================= */

ensureStyles();
render();

/* =========================================================
   END STUDIOBEAT
   ========================================================= */
