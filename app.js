(() => {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  const instruments = [
    ["Piano","keys"],["Grand Piano","keys"],["Bright Piano","keys"],
    ["Electric Piano","keys"],["Warm EP","keys"],["Honky Piano","keys"],
    ["Organ","keys"],["Jazz Organ","keys"],["Church Organ","keys"],
    ["Clavinet","keys"],["R&B Keys","keys"],["Soul Keys","keys"],
    ["Lo-fi Keys","keys"],["Trap Keys","keys"],["Afro Piano","keys"],
    ["Drill Piano","keys"],

    ["Acoustic Guitar","guitar"],["Nylon Guitar","guitar"],
    ["Electric Guitar","guitar"],["Clean Guitar","guitar"],
    ["Muted Guitar","guitar"],["Bass Guitar","bass"],["808 Bass","bass"],
    ["Sub Bass","bass"],["Slap Bass","bass"],["Fretless Bass","bass"],
    ["Afro Bass","bass"],["Drill 808","bass"],

    ["Violin","strings"],["Viola","strings"],["Cello","strings"],
    ["Contrabass","strings"],["String Ensemble","strings"],
    ["Cinematic Strings","strings"],

    ["Trumpet","brass"],["Trombone","brass"],["Saxophone","brass"],
    ["French Horn","brass"],["Brass Section","brass"],

    ["Flute","woodwind"],["Clarinet","woodwind"],["Oboe","woodwind"],
    ["Recorder","woodwind"],["Pan Flute","woodwind"],

    ["Marimba","mallet"],["Vibraphone","mallet"],["Xylophone","mallet"],
    ["Kalimba","mallet"],["Steel Drums","mallet"],["Celesta","mallet"],
    ["Music Box","mallet"],["Glockenspiel","mallet"],

    ["Acoustic Kit","drums"],["Studio Kit","drums"],["808 Kit","drums"],
    ["Afro Kit","drums"],["Percussion","drums"],["Kick","drums"],
    ["Deep Kick","drums"],["Snare","drums"],["Closed Hat","drums"],
    ["Open Hat","drums"],["Crash","drums"],["Ride","drums"],
    ["Tom","drums"],["Floor Tom","drums"],

    ["Talking Drum","african"],["Talking Drum High","african"],
    ["Talking Drum Low","african"],["Djembe","african"],
    ["Djembe High","african"],["Djembe Low","african"],
    ["Conga","african"],["Bongo","african"],["Shekere","african"],
    ["African Bell","african"],["African Percussion","african"],
    ["Amapiano Log Drum","african"],["Log Drum Deep","african"],
    ["Log Drum High","african"],

    ["Lead Saw","synth"],["Lead Square","synth"],["Lead Pulse","synth"],
    ["Synth Brass","synth"],["Synth Bass","synth"],["Warm Pad","synth"],
    ["Dark Pad","synth"],["Choir Pad","synth"],["Air Pad","synth"],
    ["Dream Pad","synth"],["Pluck","synth"],["Digital Pluck","synth"],
    ["Bell Pluck","synth"],["Afro Pluck","synth"],["Trap Pluck","synth"],
    ["Synth Lead","synth"],["Retro Lead","synth"],["Vapor Lead","synth"],
    ["House Lead","synth"],["Amapiano Lead","synth"],["Vintage Synth","synth"],
    ["Analog Bass","synth"],["Mono Synth","synth"],["Poly Synth","synth"],

    ["Choir","vocal"],["Male Choir","vocal"],["Female Choir","vocal"],
    ["Vocal Ah","vocal"],["Vocal Oo","vocal"],

    ["Harp","other"],["Acoustic Harp","other"],["Banjo","other"],
    ["Mandolin","other"],["Ukulele","other"],["Bell","other"],
    ["Church Bells","other"],["Crystal Bell","other"],["Cowbell","other"],
    ["Agogo","other"],["Guiro","other"],["Cabasa","other"],
    ["Tambourine","other"],["Woodblock","other"],["Rimshot","other"],
    ["Clap","other"],["Snap","other"],["Cajon","other"],["Timbale","other"],

    ["Breath","fx"],["Atmosphere","fx"],["Impact","fx"],["Reverse FX","fx"],
    ["Vinyl FX","fx"],["Tape Stop FX","fx"],["Riser","fx"],
    ["Downlifter","fx"],["Sub Drop","fx"]
  ];

  const categories = [
    "all","keys","guitar","bass","strings","brass","woodwind",
    "mallet","drums","african","synth","vocal","other","fx"
  ];

  const genres = [
    "Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B",
    "Pop","Dancehall","Reggae","Gospel","EDM","House","Lo-fi"
  ];

  let audio = null;
  let master = null;

  let bpm = 105;
  let playing = false;
  let timer = null;
  let beat = 0;

  let selected = "Piano";
  let category = "all";
  let activeTab = "arrange";
  let octave = 4;

  let tracks = [
    {
      name: "Track 1",
      instrument: "Piano",
      type: "MIDI"
    }
  ];

  let clips = [];

  let recorder = null;
  let recording = false;
  let chunks = [];

  function audioStart() {
    if (!audio) {
      audio = new (window.AudioContext ||
        window.webkitAudioContext)();

      master = audio.createGain();
      master.gain.value = 0.8;
      master.connect(audio.destination);
    }

    if (audio.state === "suspended") {
      audio.resume();
    }
  }

  function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playNote(midi, type = "triangle") {
    audioStart();

    const now = audio.currentTime;

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = type;
    osc.frequency.value = midiToHz(midi);

    gain.gain.setValueAtTime(0.0001, now);

    gain.gain.exponentialRampToValueAtTime(
      0.25,
      now + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.7
    );

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  function render() {
    const filtered = instruments.filter(item =>
      category === "all" || item[1] === category
    );

    app.innerHTML = `
      <div class="sb">
        <header class="sb-top">
          <div class="brand">STUDIO<span>BEAT</span></div>
          <div class="project-name">My First Song</div>
          <div class="transport">
            <button id="new">NEW</button>
            <button id="stop">■</button>
            <button id="play">${playing ? "❚❚" : "▶"}</button>
            <button id="record" class="${recording ? "recording" : ""}">●</button>
            <label>
              BPM
              <input id="bpm" type="number" min="40" max="240" value="${bpm}">
            </label>
          </div>
        </header>

        <div class="studio-tabs">
          <button data-tab="arrange">ARRANGE</button>
          <button data-tab="sounds">SOUNDS</button>
          <button data-tab="piano">PIANO</button>
          <button data-tab="looper">LOOPER</button>
          <button data-tab="recording">RECORD</button>
          <button data-tab="mixer">MIXER</button>
          <button data-tab="tools">TOOLS</button>
        </div>

        <main>

          <section class="panel ${activeTab === "arrange" ? "show
