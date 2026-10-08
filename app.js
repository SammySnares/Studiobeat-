
  (() => {
  const app = document.getElementById("app");
  if (!app) return;

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

  const genres = [
    "Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B","Pop",
    "Dancehall","Reggae","Gospel","EDM","House","Lo-fi"
  ];

  const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  let audio = null;
  let master = null;
  let analyser = null;

  let bpm = 105;
  let key = "C";
  let playing = false;
  let playTimer = null;
  let currentStep = 0;

  let masterVol = .8;
  let selectedInstrument = "Piano";
  let octave = 4;

  let tracks = [];
  let loops = [];
  let clips = [];
  let recordings = [];

  let armedTrack = null;
  let activeTab = "arrange";

  let tunerStream = null;
  let tunerRAF = null;

  let recorder = null;
  let recChunks = [];
  let recording = false;
  let recordStart = 0;

  let projectName = "My First Song";
  let metronome = true;
  let countIn = false;

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

    if (audio.state === "suspended") {
      audio.resume();
    }
  }

  function hz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

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
      fx
