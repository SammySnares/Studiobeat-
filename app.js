(() => {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  /* =========================================================
     STUDIOBEAT
     BandLab-inspired mobile music studio
     BLACK + WHITE ONLY
     ========================================================= */

  const state = {
    screen: "studio",
    showAddTrack: false,
    selectedInstrument: "Piano",
    octave: 4,
    bpm: 105,
    playing: false,
    recording: false,
    recordingUrl: null,
    tracks: [],
    clips: [],
    drumPattern: {},
    loops: [],
    selectedLoop: null,
    selectedTrack: null
  };

  const instruments = [
    ["Piano", "keys"],
    ["Grand Piano", "keys"],
    ["Bright Piano", "keys"],
    ["Electric Piano", "keys"],
    ["Warm EP", "keys"],
    ["Honky Piano", "keys"],
    ["Organ", "keys"],
    ["Jazz Organ", "keys"],
    ["Church Organ", "keys"],
    ["Clavinet", "keys"],
    ["R&B Keys", "keys"],
    ["Soul Keys", "keys"],
    ["Lo-fi Keys", "keys"],
    ["Trap Keys", "keys"],
    ["Afro Piano", "keys"],
    ["Drill Piano", "keys"],

    ["Acoustic Guitar", "guitar"],
    ["Nylon Guitar", "guitar"],
    ["Electric Guitar", "guitar"],
    ["Clean Guitar", "guitar"],

    ["Bass Guitar", "bass"],
    ["808 Bass", "bass"],
    ["Sub Bass", "bass"],
    ["Trap Bass", "bass"],
    ["Afro Bass", "bass"],

    ["Strings", "strings"],
    ["Violin", "strings"],
    ["Cello", "strings"],
    ["Orchestra", "strings"],

    ["Synth Lead", "synth"],
    ["Synth Pad", "synth"],
    ["Pluck", "synth"],
    ["Future Synth", "synth"],
    ["Afro Synth", "synth"],

    ["Flute", "wind"],
    ["Saxophone", "wind"],
    ["Trumpet", "wind"],
    ["Choir", "voice"]
  ];

  const addTrackItems = [
    ["Voice / Audio", "🎙"],
    ["Instruments", "🎹"],
    ["Drum Machine", "🥁"],
    ["Looper", "🔁"],
    ["Guitar / Bass", "🎸"],
    ["Sampler", "◼"],
    ["Import Audio", "♫"],
    ["Import MIDI", "MIDI"]
  ];

  let audioCtx = null;
  let mediaRecorder = null;
  let recordedChunks = [];

  /* =========================================================
     AUDIO
     ========================================================= */

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return audioCtx;
  }

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone(midi, duration = 0.7, type = "triangle") {
    const ctx = getAudioContext();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = midiToFrequency(midi);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.35,
      ctx.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.05);
  }

  function playDrum(type) {
    const ctx = getAudioContext();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "kick") {
      oscillator.frequency.setValueAtTime(120, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        45,
        ctx.currentTime + 0.12
      );
    }

    if (type === "snare") {
      oscillator.type = "square";
      oscillator.frequency.value = 180;
    }

    if (type === "hat") {
      oscillator.type = "square";
      oscillator.frequency.value = 7000;
    }

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.4,
      ctx.currentTime + 0.005
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.12
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  }

  /* =========================================================
     CSS
     ========================================================= */

  const css = `
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background: #000;
      color: #fff;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Arial,
        sans-serif;
    }

    body {
      overflow-x: hidden;
    }

    button,
    input {
      font: inherit;
    }

    button {
      color: #fff;
      background: #111;
      border: 1px solid #333;
      border-radius: 12px;
      cursor: pointer;
    }

    button:active {
      transform: scale(.97);
    }

    .sb-app {
      min-height: 100vh;
      background: #000;
      padding-bottom: 30px;
    }

    .sb-top {
      position: sticky;
      top: 0;
      z-index: 30;
      height: 62px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      background: #000;
      border-bottom: 1px solid #222;
    }

    .sb-logo {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -1px;
    }

    .sb-top-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      font-size: 20px;
      background: #111;
    }

    .sb-content {
      padding: 18px 15px 40px;
      max-width: 900px;
      margin: auto;
    }

    .project-title {
      font-size: 25px;
      font-weight: 800;
      margin: 8px 0 4px;
    }

    .project-subtitle {
      color: #999;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .transport {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 15px 0 22px;
    }

    .transport button {
      width: 48px;
      height: 42px;
    }

    .play-main {
      width: 58px !important;
      height: 58px !important;
      border-radius: 50% !important;
      background: #fff !important;
      color: #000 !important;
      border: none !important;
      font-size: 21px;
    }

    .bpm-box {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .bpm {
      padding: 8px 15px;
      border: 1px solid #333;
      border-radius: 20px;
      font-size: 13px;
    }

    .timeline {
      position: relative;
      min-height: 300px;
      border: 1px solid #222;
      border-radius: 18px;
      background:
        repeating-linear-gradient(
          to right,
          #000 0,
          #000 74px,
          #151515 75px
        );
      overflow: hidden;
      padding: 16px 0;
    }

    .timeline-ruler {
      height: 25px;
      display: flex;
      color: #666;
      font-size: 10px;
      padding-left: 12px;
      gap: 53px;
    }

    .track {
      height: 72px;
      margin: 7px 0;
      border-top: 1px solid #1d1d1d;
      border-bottom: 1px solid #1d1d1d;
      display: flex;
      align-items: center;
      padding-left: 12px;
      position: relative;
    }

    .track-name {
      width: 110px;
      flex-shrink: 0;
      font-size: 12px;
      color: #ddd;
    }

    .clip {
      height: 45px;
      min-width: 145px;
      background: #fff;
      color: #000;
      border-radius: 9px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 700;
      margin-left: 5px;
    }

    .empty-timeline {
      height: 160px;
      display: grid;
      place-items: center;
      color: #666;
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }

    .add-track-btn {
      width: 100%;
      height: 58px;
      margin-top: 16px;
      border: 1px solid #fff;
      background: #fff;
      color: #000;
      font-weight: 800;
      font-size: 16px;
      border-radius: 15px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 800;
      margin: 8px 0 15px;
    }

    .subtle {
      color: #888;
      font-size: 13px;
    }

    .back-btn {
      margin-bottom: 18px;
      padding: 10px 15px;
      background: #111;
    }

    .instrument-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .instrument-card {
      min-height: 72px;
      text-align: left;
      padding: 14px;
      background: #0c0c0c;
      border: 1px solid #262626;
      border-radius: 14px;
    }

    .instrument-card strong {
      display: block;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .instrument-card span {
      color: #777;
      font-size: 11px;
      text-transform: uppercase;
    }

    .instrument-card:active {
      background: #fff;
      color: #000;
    }

    .piano-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .octave-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .octave-controls button {
      width: 38px;
      height: 36px;
    }

    .octave-value {
      min-width: 45px;
      text-align: center;
      font-weight: 700;
    }

    .piano-wrap {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 15px;
    }

    .piano {
      position: relative;
      height: 260px;
      width: 980px;
      user-select: none;
      touch-action: none;
    }

    .white-keys {
      position: absolute;
      inset: 0;
      display: flex;
    }

    .white-key {
      flex: 1;
      min-width: 70px;
      height: 250px;
      background: #fff;
      color: #000;
      border: 1px solid #aaa;
      border-radius: 0 0 8px 8px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 15px;
      font-size: 11px;
      font-weight: 700;
    }

    .white-key:active {
      background: #ddd;
    }

    .black-keys {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 160px;
      pointer-events: none;
    }

    .black-key {
      position: absolute;
      width: 42px;
      height: 160px;
      background: #050505;
      border: 1px solid #444;
      border-radius: 0 0 7px 7px;
      z-index: 5;
      pointer-events: auto;
      touch-action: none;
      box-shadow: 0 3px 5px #000;
    }

    .black-key:active {
      background: #333;
    }

    .piano-tools {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 14px;
    }

    .tool-btn {
      padding: 13px 5px;
      font-size: 12px;
    }

    .tool-btn.active {
      background: #fff;
      color: #000;
    }

    .sheet-bg {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(0,0,0,.72);
      display: flex;
      align-items: flex-end;
    }

    .sheet {
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      background: #0a0a0a;
      border-radius: 24px 24px 0 0;
      padding: 20px 15px 30px;
      border-top: 1px solid #333;
    }

    .sheet-handle {
      width: 45px;
      height: 4px;
      background: #444;
      border-radius: 10px;
      margin: 0 auto 18px;
    }

    .sheet-title {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 15px;
    }

    .add-item {
      width: 100%;
      min-height: 58px;
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 14px;
      margin: 7px 0;
      text-align: left;
      background: #111;
      border: 1px solid #222;
    }

    .add-icon {
      width: 35px;
      text-align: center;
      font-size: 20px;
    }

    .drum-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
    }

    .drum-controls button {
      flex: 1;
      padding: 12px 5px;
    }

    .drum-grid {
      overflow-x: auto;
      border: 1px solid #222;
      border-radius: 15px;
      padding: 12px;
    }

    .drum-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      min-width: 700px;
    }

    .drum-name {
      width: 65px;
      font-size: 11px;
      color: #aaa;
      flex-shrink: 0;
    }

    .step {
      width: 31px;
      height: 38px;
      margin: 2px;
      border-radius: 6px;
      background: #111;
      border: 1px solid #2a2a2a;
    }

    .step.active {
      background: #fff;
      border-color: #fff;
    }

    .step.beat {
      border-color: #555;
    }

    .loop-grid,
    .sampler-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .loop-pad,
    .sample-pad {
      min-height: 110px;
      background: #101010;
      border: 1px solid #292929;
      border-radius: 16px;
      padding: 15px;
      text-align: left;
    }

    .loop-pad.active,
    .sample-pad:active {
      background: #fff;
      color: #000;
    }

    .loop-pad strong,
    .sample-pad strong {
      display: block;
      margin-bottom: 8px;
    }

    .record-card {
      border: 1px solid #292929;
      border-radius: 18px;
      padding: 20px;
      text-align: center;
    }

    .record-button {
      width: 85px;
      height: 85px;
      border-radius: 50%;
      background: #fff;
      color: #000;
      border: 8px solid #222;
      font-size: 12px;
      font-weight: 900;
      margin: 25px auto;
    }

    .record-button.recording {
      background: #000;
      color: #fff;
      border-color: #fff;
    }

    .file-box {
      border: 1px dashed #444;
      border-radius: 18px;
      padding: 30px 15px;
      text-align: center;
      margin-top: 15px;
    }

    .file-box input {
      display: none;
    }

    .file-label {
      display: inline-block;
      padding: 14px 20px;
      background: #fff;
      color: #000;
      border-radius: 12px;
      font-weight: 800;
      cursor: pointer;
    }

    .guitar-neck {
      border: 1px solid #333;
      border-radius: 15px;
      padding: 15px;
      background: #111;
      overflow-x: auto;
    }

    .string {
      min-width: 700px;
      height: 45px;
      border-bottom: 2px solid #555;
      display: flex;
      align-items: center;
    }

    .fret {
      min-width: 65px;
      height: 100%;
      border-right: 1px solid #333;
      display: grid;
      place-items: center;
      color: #666;
      font-size: 11px;
    }

    .fret:active {
      background: #fff;
      color: #000;
    }

    .empty-state {
      padding: 50px 20px;
      text-align: center;
      color: #666;
    }

    @media (min-width: 700px) {
      .instrument-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .loop-grid,
      .sampler-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `;

  function injectCSS() {
    if (document.getElementById("studiobeat-runtime-css")) return;

    const style = document.createElement("style");
    style.id = "studiobeat-runtime-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function go(screen) {
    state.screen = screen;
    state.showAddTrack = false;
    render();
  }

  function addTrack(name, type) {
    state.tracks.push({
      id: Date.now(),
      name,
      type
    });

    state.clips.push({
      id: Date.now() + 1,
      name: name + " Track"
    });
  }

  /* =========================================================
     TOP BAR
     ========================================================= */

  function topBar(back = false) {
    return `
      <div class="sb-top">

        <div>
          ${
            back
              ? `<button class="icon-btn" id="backBtn">‹</button>`
              : `<div class="sb-logo">STUDIOBEAT</div>`
          }
        </div>

        <div class="sb-top-right">
          <button class="icon-btn" id="saveBtn">✓</button>
          <button class="icon-btn" id="moreBtn">⋯</button>
        </div>

      </div>
    `;
  }

  /* =========================================================
     STUDIO / ARRANGEMENT
     ========================================================= */

  function studioScreen() {
    return `
      ${topBar(false)}

      <main class="sb-content">

        <div class="project-title">My Project</div>
        <div class="project-subtitle">
          StudioBeat project
        </div>

        <div class="transport">
          <button id="undoBtn">↶</button>

          <button
            class="play-main"
            id="playBtn"
          >
            ${state.playing ? "■" : "▶"}
          </button>

          <button id="stopBtn">■</button>
        </div>

        <div class="bpm-box">
          <div class="bpm">
            BPM ${state.bpm}
          </div>
        </div>

        <div class="timeline">

          <div class="timeline-ruler">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
          </div>

          ${
            state.tracks.length
              ? state.tracks.map((track, index) => `
                  <div class="track">

                    <div class="track-name">
                      ${escapeHTML(track.name)}
                    </div>

                    ${
                      state.clips[index]
                        ? `
                          <div class="clip">
                            ${escapeHTML(state.clips[index].name)}
                          </div>
                        `
                        : ""
                    }

                  </div>
                `).join("")
              : `
                <div class="empty-timeline">
                  <div>
                    <strong>No tracks yet</strong><br><br>
                    Tap + Add Track to start making music.
                  </div>
                </div>
              `
          }

        </div>

        <button
          class="add-track-btn"
          id="addTrackBtn"
        >
          ＋ Add Track
        </button>

      </main>
    `;
  }

  /* =========================================================
     ADD TRACK SHEET
     ========================================================= */

  function addTrackSheet() {
    return `
      <div class="sheet-bg" id="sheetBg">

        <div class="sheet">

          <div class="sheet-handle"></div>

          <div class="sheet-title">
            Add Track
          </div>

          ${addTrackItems.map(item => `
            <button
              class="add-item"
              data-add="${escapeHTML(item[0])}"
            >

              <span class="add-icon">
                ${item[1]}
              </span>

              <span>
                ${escapeHTML(item[0])}
              </span>

            </button>
          `).join("")}

        </div>
      </div>
    `;
  }

  /* =========================================================
     INSTRUMENT LIST
     ========================================================= */

  function instrumentScreen() {
    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Instruments
        </div>

        <div class="subtle">
          Choose an instrument
        </div>

        <br>

        <div class="instrument-grid">

          ${instruments.map(inst => `
            <button
              class="instrument-card"
              data-instrument="${escapeHTML(inst[0])}"
            >

              <strong>
                ${escapeHTML(inst[0])}
              </strong>

              <span>
                ${escapeHTML(inst[1])}
              </span>

            </button>
          `).join("")}

        </div>

      </main>
    `;
  }

  /* =========================================================
     PIANO
     ========================================================= */

  function pianoScreen() {
    const whiteNotes = [
      ["C", 0],
      ["D", 2],
      ["E", 4],
      ["F", 5],
      ["G", 7],
      ["A", 9],
      ["B", 11],
      ["C", 12],
      ["D", 14],
      ["E", 16],
      ["F", 17],
      ["G", 19],
      ["A", 21],
      ["B", 23]
    ];

    const blackNotes = [
      ["C#", 1, 42],
      ["D#", 3, 114],
      ["F#", 6, 257],
      ["G#", 8, 329],
      ["A#", 10, 401],
      ["C#", 13, 544],
      ["D#", 15, 616],
      ["F#", 18, 759],
      ["G#", 20, 831],
      ["A#", 22, 903]
    ];

    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="piano-header">

          <div>
            <div class="section-title">
              ${escapeHTML(state.selectedInstrument)}
            </div>

            <div class="subtle">
              Piano
            </div>
          </div>

          <div class="octave-controls">

            <button id="octDown">
              −
            </button>

            <div class="octave-value">
              Oct ${state.octave}
            </div>

            <button id="octUp">
              ＋
            </button>

          </div>

        </div>

        <div class="piano-wrap">

          <div class="piano">

            <div class="white-keys">

              ${whiteNotes.map(note => `
                <button
                  class="white-key"
                  data-midi="${60 + state.octave - 4 + note[1]}"
                >
                  ${note[0]}
                </button>
              `).join("")}

            </div>

            <div class="black-keys">

              ${blackNotes.map(note => `
                <button
                  class="black-key"
                  style="left:${note[2]}px"
                  data-midi="${61 + state.octave - 4 + note[1] - 1}"
                ></button>
              `).join("")}

            </div>

          </div>

        </div>

        <div class="piano-tools">

          <button class="tool-btn active">
            Keyboard
          </button>

          <button class="tool-btn">
            Chords
          </button>

          <button class="tool-btn">
            Arpeggio
          </button>

          <button class="tool-btn">
            Sustain
          </button>

          <button class="tool-btn">
            Scale
          </button>

          <button
            class="tool-btn"
            id="recordPianoBtn"
          >
            ${state.recording ? "Stop" : "Record"}
          </button>

        </div>

      </main>
    `;
  }

  /* =========================================================
     DRUM MACHINE
     ========================================================= */

  function drumScreen() {
    const rows = [
      ["Kick", "kick"],
      ["Snare", "snare"],
      ["Hi-Hat", "hat"],
      ["Perc", "perc"]
    ];

    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Drum Machine
        </div>

        <div class="subtle">
          Build your beat
        </div>

        <br>

        <div class="drum-controls">

          <button id="clearDrums">
            Clear
          </button>

          <button id="demoDrums">
            Demo Beat
          </button>

        </div>

        <div class="drum-grid">

          ${rows.map(row => `
            <div class="drum-row">

              <div class="drum-name">
                ${row[0]}
              </div>

              ${Array.from({ length: 16 }, (_, i) => {

                const key = row[1] + "_" + i;
                const active = !!state.drumPattern[key];

                return `
                  <button
                    class="step ${active ? "active" : ""} ${i % 4 === 0 ? "beat" : ""}"
                    data-drum="${row[1]}"
                    data-step="${i}"
                  ></button>
                `;

              }).join("")}

            </div>
          `).join("")}

        </div>

      </main>
    `;
  }

  /* =========================================================
     LOOPER
     ========================================================= */

  function looperScreen() {
    const loops = [
      ["Afro Groove", "Afro"],
      ["Amapiano", "Amapiano"],
      ["Trap Loop", "Trap"],
      ["Drill Loop", "Drill"],
      ["R&B Loop", "R&B"],
      ["House Loop", "House"],
      ["Percussion", "Perc"],
      ["Bass Loop", "Bass"]
    ];

    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Looper
        </div>

        <div class="subtle">
          Tap a loop to play it
        </div>

        <br>

        <div class="loop-grid">

          ${loops.map(loop => `
            <button
              class="loop-pad ${
                state.selectedLoop === loop[0] ? "active" : ""
              }"
              data-loop="${escapeHTML(loop[0])}"
            >

              <strong>
                ${escapeHTML(loop[0])}
              </strong>

              <span class="subtle">
                ${escapeHTML(loop[1])}
              </span>

            </button>
          `).join("")}

        </div>

      </main>
    `;
  }

  /* =========================================================
     VOICE / AUDIO
     ========================================================= */

  function voiceScreen() {
    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Voice / Audio
        </div>

        <div class="subtle">
          Record vocals or live audio
        </div>

        <br>

        <div class="record-card">

          <div>
            ${
              state.recording
                ? "Recording..."
                : "Ready to record"
            }
          </div>

          <button
            class="record-button ${
              state.recording ? "recording" : ""
            }"
            id="recordBtn"
          >
            ${state.recording ? "STOP" : "REC"}
          </button>

          <div class="subtle">
            Allow microphone access when requested.
          </div>

        </div>

        ${
          state.recordingUrl
            ? `
              <div style="margin-top:15px">
                <audio
                  controls
                  src="${state.recordingUrl}"
                  style="width:100%"
                ></audio>
              </div>
            `
            : ""
        }

      </main>
    `;
  }

  /* =========================================================
     SAMPLER
     ========================================================= */

  function samplerScreen() {
    const pads = [
      "Sample 1",
      "Sample 2",
      "Sample 3",
      "Sample 4",
      "Sample 5",
      "Sample 6",
      "Sample 7",
      "Sample 8"
    ];

    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Sampler
        </div>

        <div class="subtle">
          Load and trigger samples
        </div>

        <br>

        <div class="sampler-grid">

          ${pads.map((pad, index) => `
            <button
              class="sample-pad"
              data-sample="${index}"
            >

              <strong>
                ${pad}
              </strong>

              <span class="subtle">
                Tap to play
              </span>

            </button>
          `).join("")}

        </div>

        <div class="file-box">

          <label class="file-label">
            Load Sample

            <input
              id="sampleFile"
              type="file"
              accept="audio/*"
            >

          </label>

        </div>

      </main>
    `;
  }

  /* =========================================================
     IMPORT AUDIO
     ========================================================= */

  function importAudioScreen() {
    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Import Audio
        </div>

        <div class="subtle">
          Add an audio file to your project.
        </div>

        <div class="file-box">

          <label class="file-label">

            Choose Audio

            <input
              id="audioImport"
              type="file"
              accept="audio/*"
            >

          </label>

        </div>

      </main>
    `;
  }

  /* =========================================================
     IMPORT MIDI
     ========================================================= */

  function importMidiScreen() {
    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Import MIDI
        </div>

        <div class="subtle">
          Add a MIDI file to your project.
        </div>

        <div class="file-box">

          <label class="file-label">

            Choose MIDI

            <input
              id="midiImport"
              type="file"
              accept=".mid,.midi,audio/midi"
            >

          </label>

        </div>

      </main>
    `;
  }

  /* =========================================================
     GUITAR / BASS
     ========================================================= */

  function guitarScreen() {
    const strings = 6;

    return `
      ${topBar(true)}

      <main class="sb-content">

        <div class="section-title">
          Guitar / Bass
        </div>

        <div class="subtle">
          Play notes across the fretboard.
        </div>

        <br>

        <div class="guitar-neck">

          ${Array.from({ length: strings }, (_, stringIndex) => `
            <div class="string">

              ${Array.from({ length: 10 }, (_, fret) => `
                <button
                  class="fret"
                  data-fret="${fret}"
                  data-string="${stringIndex}"
                >
                  ${fret}
                </button>
              `).join("")}

            </div>
          `).join("")}

        </div>

      </main>
    `;
  }

  /* =========================================================
     SCREEN RENDERER
     ========================================================= */

  function render() {
    injectCSS();

    let html = `<div class="sb-app">`;

    if (state.screen === "studio") {
      html += studioScreen();
    }

    if (state.screen === "instruments") {
      html += instrumentScreen();
    }

    if (state.screen === "piano") {
      html += pianoScreen();
    }

    if (state.screen === "drums") {
      html += drumScreen();
    }

    if (state.screen === "looper") {
      html += looperScreen();
    }

    if (state.screen === "voice") {
      html += voiceScreen();
    }

    if (state.screen === "sampler") {
      html += samplerScreen();
    }

    if (state.screen === "importAudio") {
      html += importAudioScreen();
    }

    if (state.screen === "importMidi") {
      html += importMidiScreen();
    }

    if (state.screen === "guitar") {
      html += guitarScreen();
    }

    html += `</div>`;

    if (state.showAddTrack) {
      html += addTrackSheet();
    }

    app.innerHTML = html;

    bindEvents();
  }

  /* =========================================================
     RECORDING
     ========================================================= */

  async function startRecording() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      recordedChunks = [];

      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(
          recordedChunks,
          { type: "audio/webm" }
        );

        state.recordingUrl =
          URL.createObjectURL(blob);

        stream.getTracks().forEach(track => {
          track.stop();
        });

        render();
      };

      mediaRecorder.start();

      state.recording = true;

      render();

    } catch (error) {
      alert(
        "Microphone access was not allowed."
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

    state.recording = false;
    render();
  }

  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function bindEvents() {

    /* -------------------------
       BACK
       ------------------------- */

    const backBtn =
      document.getElementById("backBtn");

    if (backBtn) {
      backBtn.onclick = () => {
        go("studio");
      };
    }

    /* -------------------------
       ADD TRACK
       ------------------------- */

    const addTrackBtn =
      document.getElementById("addTrackBtn");

    if (addTrackBtn) {
      addTrackBtn.onclick = () => {
        state.showAddTrack = true;
        render();
      };
    }

    const sheetBg =
      document.getElementById("sheetBg");

    if (sheetBg) {
      sheetBg.onclick = event => {
        if (event.target === sheetBg) {
          state.showAddTrack = false;
          render();
        }
      };
    }

    document.querySelectorAll("[data-add]")
      .forEach(button => {

        button.onclick = () => {

          const type =
            button.dataset.add;

          state.showAddTrack = false;

          if (type === "Instruments") {
            go("instruments");
            return;
          }

          if (type === "Drum Machine") {
            addTrack("Drums", "drums");
            go("drums");
            return;
          }

          if (type === "Looper") {
            addTrack("Looper", "looper");
            go("looper");
            return;
          }

          if (type === "Voice / Audio") {
            addTrack("Voice", "voice");
            go("voice");
            return;
          }

          if (type === "Guitar / Bass") {
            addTrack("Guitar", "guitar");
            go("guitar");
            return;
          }

          if (type === "Sampler") {
            addTrack("Sampler", "sampler");
            go("sampler");
            return;
          }

          if (type === "Import Audio") {
            go("importAudio");
            return;
          }

          if (type === "Import MIDI") {
            go("importMidi");
            return;
          }
        };

      });

    /* -------------------------
       INSTRUMENTS
       ------------------------- */

    document.querySelectorAll(
      "[data-instrument]"
    ).forEach(button => {

      button.onclick = () => {

        state.selectedInstrument =
          button.dataset.instrument;

        addTrack(
          state.selectedInstrument,
          "instrument"
        );

        go("piano");
      };

    });

    /* -------------------------
       PIANO KEYS
       ------------------------- */

    document.querySelectorAll(
      ".white-key, .black-key"
    ).forEach(key => {

      const play = event => {

        event.preventDefault();

        const midi =
          Number(key.dataset.midi);

        playTone(
          midi,
          0.8,
          "triangle"
        );

      };

      key.addEventListener(
        "pointerdown",
        play
      );

    });

    /* -------------------------
       OCTAVE
       ------------------------- */

    const octDown =
      document.getElementById("octDown");

    const octUp =
      document.getElementById("octUp");

    if (octDown) {
      octDown.onclick = () => {

        if (state.octave > 1) {
          state.octave--;
          render();
        }

      };
    }

    if (octUp) {
      octUp.onclick = () => {

        if (state.octave < 7) {
          state.octave++;
          render();
        }

      };
    }

    /* -------------------------
       PIANO RECORD
       ------------------------- */

    const recordPianoBtn =
      document.getElementById(
        "recordPianoBtn"
      );

    if (recordPianoBtn) {

      recordPianoBtn.onclick = () => {

        if (state.recording) {
          stopRecording();
        } else {
          startRecording();
        }

      };

    }

    /* -------------------------
       DRUM STEPS
       ------------------------- */

    document.querySelectorAll(
      "[data-drum]"
    ).forEach(button => {

      button.onclick = () => {

        const drum =
          button.dataset.drum;

        const step =
          button.dataset.step;

        const key =
          drum + "_" + step;

        state.drumPattern[key] =
          !state.drumPattern[key];

        if (state.drumPattern[key]) {
          playDrum(drum);
        }

        render();
      };

    });

    /* -------------------------
       CLEAR DRUMS
       ------------------------- */

    const clearDrums =
      document.getElementById(
        "clearDrums"
      );

    if (clearDrums) {

      clearDrums.onclick = () => {

        state.drumPattern = {};

        render();

      };

    }

    /* -------------------------
       DEMO DRUMS
       ------------------------- */

    const demoDrums =
      document.getElementById(
        "demoDrums"
      );

    if (demoDrums) {

      demoDrums.onclick = () => {

        state.drumPattern = {};

        [0, 4, 8, 12].forEach(i => {
          state.drumPattern[
            "kick_" + i
          ] = true;
        });

        [4, 12].forEach(i => {
          state.drumPattern[
            "snare_" + i
          ] = true;
        });

        [2, 6, 10, 14].forEach(i => {
          state.drumPattern[
            "hat_" + i
          ] = true;
        });

        render();

      };

    }

    /* -------------------------
       LOOPS
       ------------------------- */

    document.querySelectorAll(
      "[data-loop]"
    ).forEach(button => {

      button.onclick = () => {

        state.selectedLoop =
          button.dataset.loop;

        playTone(
          48,
          0.7,
          "sawtooth"
        );

        render();

      };

    });

    /* -------------------------
       SAMPLE PADS
       ------------------------- */

    document.querySelectorAll(
      "[data-sample]"
    ).forEach(button => {

      button.onclick = () => {

        const index =
          Number(button.dataset.sample);

        playTone(
          48 + index * 3,
          0.4,
          "square"
        );

      };

    });

    /* -------------------------
       SAMPLE FILE
       ------------------------- */

    const sampleFile =
      document.getElementById(
        "sampleFile"
      );

    if (sampleFile) {

      sampleFile.onchange = event => {

        const file =
          event.target.files[0];

        if (file) {
          alert(
            file.name +
            " loaded into StudioBeat."
          );
        }

      };

    }

    /* -------------------------
       VOICE RECORD
       ------------------------- */

    const recordBtn =
      document.getElementById(
        "recordBtn"
      );

    if (recordBtn) {

      recordBtn.onclick = () => {

        if (state.recording) {
          stopRecording();
        } else {
          startRecording();
        }

      };

    }

    /* -------------------------
       AUDIO IMPORT
       ------------------------- */

    const audioImport =
      document.getElementById(
        "audioImport"
      );

    if (audioImport) {

      audioImport.onchange = event => {

        const file =
          event.target.files[0];

        if (!file) return;

        addTrack(
          file.name,
          "audio"
        );

        alert(
          file.name +
          " added to your project."
        );

        go("studio");

      };

    }

    /* -------------------------
       MIDI IMPORT
       ------------------------- */

    const midiImport =
      document.getElementById(
        "midiImport"
      );

    if (midiImport) {

      midiImport.onchange = event => {

        const file =
          event.target.files[0];

        if (!file) return;

        addTrack(
          file.name,
          "midi"
        );

        alert(
          file.name +
          " added to your project."
        );

        go("studio");

      };

    }

    /* -------------------------
       GUITAR / BASS
       ------------------------- */

    document.querySelectorAll(
      "[data-fret]"
    ).forEach(button => {

      button.onclick = () => {

        const fret =
          Number(button.dataset.fret);

        const string =
          Number(button.dataset.string);

        const base =
          40 + (5 - string) * 5;

        playTone(
          base + fret,
          0.7,
          "triangle"
        );

      };

    });

    /* -------------------------
       PLAY
       ------------------------- */

    const playBtn =
      document.getElementById(
        "playBtn"
      );

    if (playBtn) {

      playBtn.onclick = () => {

        state.playing =
          !state.playing;

        render();

      };

    }

    /* -------------------------
       STOP
       ------------------------- */

    const stopBtn =
      document.getElementById(
        "stopBtn"
      );

    if (stopBtn) {

      stopBtn.onclick = () => {

        state.playing = false;

        render();

      };

    }

    /* -------------------------
       UNDO
       ------------------------- */

    const undoBtn =
      document.getElementById(
        "undoBtn"
      );

    if (undoBtn) {

      undoBtn.onclick = () => {

        if (state.tracks.length) {
          state.tracks.pop();
        }

        if (state.clips.length) {
          state.clips.pop();
        }

        render();

      };

    }

    /* -------------------------
       SAVE
       ------------------------- */

    const saveBtn =
      document.getElementById(
        "saveBtn"
      );

    if (saveBtn) {

      saveBtn.onclick = () => {

        localStorage.setItem(
          "studiobeat_state",
          JSON.stringify({
            tracks: state.tracks,
            clips: state.clips,
            bpm: state.bpm
          })
        );

        alert(
          "StudioBeat project saved."
        );

      };

    }

    /* -------------------------
       MORE
       ------------------------- */

    const moreBtn =
      document.getElementById(
        "moreBtn"
      );

    if (moreBtn) {

      moreBtn.onclick = () => {

        alert(
          "StudioBeat\n\n" +
          "Project Settings\n" +
          "Tempo: " + state.bpm + " BPM\n" +
          "Tracks: " + state.tracks.length
        );

      };

    }
  }

  /* =========================================================
     LOAD SAVED PROJECT
     ========================================================= */

  try {

    const saved =
      localStorage.getItem(
        "studiobeat_state"
      );

    if (saved) {

      const data =
        JSON.parse(saved);

      if (Array.isArray(data.tracks)) {
        state.tracks = data.tracks;
      }

      if (Array.isArray(data.clips)) {
        state.clips = data.clips;
      }

      if (typeof data.bpm === "number") {
        state.bpm = data.bpm;
      }

    }

  } catch (error) {
    console.log(
      "No saved StudioBeat project."
    );
  }

  /* =========================================================
     START
     ========================================================= */

  render();

})();
