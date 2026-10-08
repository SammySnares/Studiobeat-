(() => {
  "use strict";

  const app = document.getElementById("app");

  if (!app) {
    throw new Error("StudioBeat: #app was not found.");
  }

  const instruments = [
    ["Piano","Keys"],["Grand Piano","Keys"],["Bright Piano","Keys"],
    ["Electric Piano","Keys"],["Warm EP","Keys"],["Honky Piano","Keys"],
    ["Organ","Keys"],["Jazz Organ","Keys"],["Church Organ","Keys"],
    ["Clavinet","Keys"],["R&B Keys","Keys"],["Soul Keys","Keys"],
    ["Lo-fi Keys","Keys"],["FM Keys","Keys"],["Trap Keys","Keys"],
    ["Afro Piano","Keys"],["Drill Piano","Keys"],

    ["Acoustic Guitar","Guitar"],["Nylon Guitar","Guitar"],
    ["Electric Guitar","Guitar"],["Clean Guitar","Guitar"],
    ["Muted Guitar","Guitar"],["Bass Guitar","Bass"],
    ["808 Bass","Bass"],["Sub Bass","Bass"],["Slap Bass","Bass"],
    ["Fretless Bass","Bass"],["Afro Bass","Bass"],["Drill 808","Bass"],
    ["Accordion Bass","Bass"],

    ["Violin","Strings"],["Viola","Strings"],["Cello","Strings"],
    ["Contrabass","Strings"],["String Ensemble","Strings"],
    ["Cinematic Strings","Strings"],["World Strings","Strings"],

    ["Trumpet","Brass"],["Trombone","Brass"],["Saxophone","Brass"],
    ["French Horn","Brass"],["Brass Section","Brass"],
    ["Cinematic Brass","Brass"],

    ["Flute","Woodwind"],["Clarinet","Woodwind"],["Oboe","Woodwind"],
    ["Recorder","Woodwind"],["Pan Flute","Woodwind"],["World Flute","Woodwind"],

    ["Marimba","Mallet"],["Vibraphone","Mallet"],["Xylophone","Mallet"],
    ["Kalimba","Mallet"],["Steel Drums","Mallet"],["Celesta","Mallet"],
    ["Music Box","Mallet"],["Glockenspiel","Mallet"],

    ["Acoustic Kit","Drums"],["Studio Kit","Drums"],["808 Kit","Drums"],
    ["Afro Kit","Drums"],["Percussion","Drums"],["Kick","Drums"],
    ["Deep Kick","Drums"],["Snare","Drums"],["Closed Hat","Drums"],
    ["Open Hat","Drums"],["Crash","Drums"],["Ride","Drums"],
    ["Tom","Drums"],["Floor Tom","Drums"],

    ["Talking Drum","African"],["Talking Drum High","African"],
    ["Talking Drum Low","African"],["Djembe","African"],
    ["Djembe High","African"],["Djembe Low","African"],
    ["Conga","African"],["Bongo","African"],["Shekere","African"],
    ["African Bell","African"],["African Percussion","African"],
    ["Amapiano Log Drum","African"],["Log Drum Deep","African"],
    ["Log Drum High","African"],

    ["Lead Saw","Synth"],["Lead Square","Synth"],["Lead Pulse","Synth"],
    ["Synth Brass","Synth"],["Synth Bass","Synth"],["Warm Pad","Synth"],
    ["Dark Pad","Synth"],["Choir Pad","Synth"],["Air Pad","Synth"],
    ["Dream Pad","Synth"],["Pluck","Synth"],["Digital Pluck","Synth"],
    ["Bell Pluck","Synth"],["Afro Pluck","Synth"],["Trap Pluck","Synth"],
    ["Synth Lead","Synth"],["Retro Lead","Synth"],["Vapor Lead","Synth"],
    ["House Lead","Synth"],["Amapiano Lead","Synth"],["Vintage Synth","Synth"],
    ["Analog Bass","Synth"],["Mono Synth","Synth"],["Poly Synth","Synth"],

    ["Choir","Vocal"],["Male Choir","Vocal"],["Female Choir","Vocal"],
    ["Vocal Ah","Vocal"],["Vocal Oo","Vocal"],["Digital Choir","Vocal"],

    ["Harp","Other"],["Acoustic Harp","Other"],["Banjo","Other"],
    ["Mandolin","Other"],["Ukulele","Other"],["Bell","Other"],
    ["Church Bells","Other"],["Crystal Bell","Other"],["Cowbell","Other"],
    ["Agogo","Other"],["Guiro","Other"],["Cabasa","Other"],
    ["Tambourine","Other"],["Woodblock","Other"],["Rimshot","Other"],
    ["Clap","Other"],["Snap","Other"],["Cajon","Other"],["Timbale","Other"],

    ["Breath","FX"],["Atmosphere","FX"],["Impact","FX"],
    ["Reverse FX","FX"],["Vinyl FX","FX"],["Tape Stop FX","FX"],
    ["Riser","FX"],["Downlifter","FX"],["Sub Drop","FX"]
  ];

  const genres = [
    "Afrobeats","Amapiano","Trap","Drill","Hip-Hop","R&B",
    "Pop","Dancehall","Reggae","Gospel","EDM","House","Lo-fi"
  ];

  const categories = [
    "All","Keys","Guitar","Bass","Strings","Brass","Woodwind",
    "Mallet","Drums","African","Synth","Vocal","Other","FX"
  ];

  let selectedCategory = "All";
  let selectedInstrument = "Piano";
  let bpm = 105;
  let playing = false;
  let timer = null;
  let audio = null;
  let masterGain = null;
  let recording = false;
  let mediaRecorder = null;
  let chunks = [];
  let trackNumber = 1;

  function startAudio() {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audio.createGain();
      masterGain.gain.value = 0.75;
      masterGain.connect(audio.destination);
    }

    if (audio.state === "suspended") {
      audio.resume();
    }
  }

  function playNote(frequency, duration = 0.7) {
    startAudio();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "triangle";
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(audio.currentTime + duration + 0.05);
  }

  function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function pianoKey(midi) {
    return `<button class="white-key" data-midi="${midi}"></button>`;
  }

  function renderPiano() {
    const whites = [60,62,64,65,67,69,71,72,74,76,77,79,81,83];

    let html = "";

    whites.forEach(midi => {
      html += pianoKey(midi);
    });

    const blackPositions = [
      [61,41],[63,101],[66,221],[68,281],[70,341],
      [73,461],[75,521],[78,641],[80,701],[82,761]
    ];

    blackPositions.forEach(([midi,left]) => {
      html += `
        <button
          class="black-key"
          style="left:${left}px"
          data-midi="${midi}">
        </button>
      `;
    });

    return html;
  }

  function renderInstruments() {
    const list = instruments.filter(item =>
      selectedCategory === "All" || item[1] === selectedCategory
    );

    return list.map(([name,type]) => `
      <button
        class="instrument"
        data-instrument="${name}"
        data-type="${type}">
        ${name}
      </button>
    `).join("");
  }

  function renderTracks() {
    return `
      <div class="track">
        <div class="track-info">
          <div class="track-name">Track 1</div>
          <div class="track-type">${selectedInstrument}</div>
        </div>

        <div class="track-lane">
          <div class="clip" style="left:20px;width:230px;">
            ${selectedInstrument} Region
          </div>
        </div>
      </div>
    `;
  }

  function renderMixer() {
    return Array.from({length:4}, (_,i) => `
      <div class="channel">
        <strong>Track ${i + 1}</strong>
        <br><br>

        <label>Volume</label>
        <input type="range" min="0" max="100" value="80">

        <br><br>

        <button>Mute</button>
        <button>Solo</button>
      </div>
    `).join("");
  }

  function render() {
    app.innerHTML = `
      <header class="topbar">

        <div class="logo">
          STUDIO<span>BEAT</span>
        </div>

        <div class="transport">
          <button id="stopBtn">■</button>
          <button id="playBtn">▶</button>
          <button id="recordBtn">●</button>

          <input
            id="bpm"
            class="bpm"
            type="number"
            min="40"
            max="240"
            value="${bpm}">
        </div>

      </header>

      <main class="workspace">

        <div class="toolbar">
          <button data-action="new">New</button>
          <button data-action="save">Save</button>
          <button data-action="undo">Undo</button>
          <button data-action="redo">Redo</button>
          <button data-action="metronome">Metronome</button>
          <button data-action="zoom">Zoom</button>
        </div>

        <section class="section panel active" id="arrange">

          <div class="section-title">
            ARRANGEMENT
          </div>

          <div class="arrangement">

            <div class="timeline">

              <div class="ruler">
                ${Array.from({length:12},(_,i)=>
                  `<div class="beat">${i + 1}</div>`
                ).join("")}
              </div>

              <div class="playhead"></div>

              ${renderTracks()}

            </div>

          </div>

        </section>

        <section class="section panel" id="sounds">

          <div class="section-title">
            INSTRUMENTS — ${instruments.length}
          </div>

          <div class="browser">

            <div class="categories">
              ${categories.map(category => `
                <button
                  class="${category === selectedCategory ? "active" : ""}"
                  data-category="${category}">
                  ${category}
                </button>
              `).join("")}
            </div>

            <div class="instrument-list">
              ${renderInstruments()}
            </div>

          </div>

        </section>

        <section class="section panel" id="piano">

          <div class="section-title">
            PIANO — ${selectedInstrument}
          </div>

          <div class="piano-wrap">
            <div class="piano">
              ${renderPiano()}
            </div>
          </div>

        </section>

        <section class="section panel" id="looper">

          <div class="section-title">
            LOOPER
          </div>

          <div class="looper-grid">

            ${[
              "Afro Drums",
              "Amapiano Groove",
              "Trap Drums",
              "Drill Groove",
              "Afro Bass",
              "Log Drum",
              "Piano Loop",
              "Guitar Loop",
              "Vocal Chop",
              "Percussion",
              "Synth Loop",
              "FX Loop"
            ].map(name => `
              <button class="loop-cell">
                ${name}
              </button>
            `).join("")}

          </div>

        </section>

        <section class="section panel" id="record">

          <div class="section-title">
            RECORDING STUDIO
          </div>

          <div style="padding:15px;">

            <button id="micRecord">
              Start Vocal Recording
            </button>

            <button>
              Noise Reduction
            </button>

            <button>
              Pitch Correction
            </button>

            <button>
              Vocal Presets
            </button>

            <br><br>

            <button>EQ</button>
            <button>Compression</button>
            <button>Reverb</button>
            <button>Delay</button>

            <div style="margin-top:20px;">
              Input Level
              <input type="range" min="0" max="100" value="70">
            </div>

          </div>

        </section>

        <section class="section panel" id="mixer">

          <div class="section-title">
            MIXER
          </div>

          <div class="mixer">
            ${renderMixer()}
          </div>

        </section>

        <section class="section panel" id="tools">

          <div class="section-title">
            TOOLS
          </div>

          <div style="padding:15px;">

            <button id="tuner">
              🎸 Guitar Tuner
            </button>

            <button>
              Smart Chords
            </button>

            <button>
              Arpeggiator
            </button>

            <button>
              Mastering
            </button>

            <button>
              Import Audio
            </button>

            <button>
              Export Song
            </button>

          </div>

        </section>

      </main>

      <nav class="bottom-nav">

        <button class="active" data-tab="arrange">
          Arrange
        </button>

        <button data-tab="sounds">
          Sounds
        </button>

        <button data-tab="piano">
          Piano
        </button>

        <button data-tab="looper">
          Looper
        </button>

        <button data-tab="mixer">
          Mixer
        </button>

      </nav>
    `;

    bind();
  }

  function bind() {

    document.querySelectorAll("[data-tab]").forEach(button => {

      button.addEventListener("click", () => {

        document.querySelectorAll(".panel")
          .forEach(panel => panel.classList.remove("active"));

        document.querySelectorAll("[data-tab]")
          .forEach(btn => btn.classList.remove("active"));

        const tab = button.dataset.tab;
        const panel = document.getElementById(tab);

        if (panel) {
          panel.classList.add("active");
          button.classList.add("active");
        }
      });

    });

    document.querySelectorAll("[data-category]").forEach(button => {

      button.addEventListener("click", () => {

        selectedCategory = button.dataset.category;

        render();
        document.querySelector('[data-tab="sounds"]')?.click();

      });

    });

    document.querySelectorAll("[data-instrument]").forEach(button => {

      button.addEventListener("click", () => {

        selectedInstrument = button.dataset.instrument;

        startAudio();

        render();

        document.querySelector('[data-tab="piano"]')?.click();

      });

    });

    document.querySelectorAll("[data-midi]").forEach(key => {

      key.addEventListener("pointerdown", () => {

        const midi = Number(key.dataset.midi);

        playNote(midiToHz(midi));

      });

    });

    document.querySelectorAll(".loop-cell").forEach(cell => {

      cell.addEventListener("click", () => {
        cell.classList.toggle("active");
      });

    });

    document.getElementById("bpm")?.addEventListener("change", e => {

      bpm = Math.max(40, Math.min(240, Number(e.target.value) || 105));

    });

    document.getElementById("playBtn")?.addEventListener("click", () => {

      startAudio();

      if (playing) return;

      playing = true;

      timer = setInterval(() => {

        document.querySelectorAll(".clip").forEach((clip,index) => {

          clip.style.transform =
            `translateX(${(Date.now() / 30) % 80}px)`;

        });

      }, 100);

    });

    document.getElementById("stopBtn")?.addEventListener("click", () => {

      playing = false;

      clearInterval(timer);

      document.querySelectorAll(".clip").forEach(clip => {
        clip.style.transform = "";
      });

    });

    document.getElementById("recordBtn")?.addEventListener("click", () => {

      recording = !recording;

      const button = document.getElementById("recordBtn");

      if (button) {
        button.classList.toggle("recording", recording);
      }

    });

    document.getElementById("micRecord")?.addEventListener("click", async () => {

      if (recording) {

        if (mediaRecorder) {
          mediaRecorder.stop();
        }

        recording = false;

        return;
      }

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true
          });

        chunks = [];

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
          if (event.data.size) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {

          stream.getTracks().forEach(track => track.stop());

          const blob = new Blob(chunks, {
            type: "audio/webm"
          });

          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");

          link.href = url;
          link.download = "StudioBeat-recording.webm";
          link.textContent = "Recording ready — tap to save";

          link.style.display = "block";
          link.style.marginTop = "15px";

          document.getElementById("record")?.querySelector("div")
            ?.appendChild(link);

        };

        mediaRecorder.start();

        recording = true;

      } catch (error) {

        alert(
          "Microphone permission is required for recording."
        );

      }

    });

    document.querySelectorAll("[data-action]").forEach(button => {

      button.addEventListener("click", () => {

        const action = button.dataset.action;

        if (action === "new") {
          location.reload();
        }

        if (action === "save") {
          localStorage.setItem(
            "StudioBeatProject",
            JSON.stringify({
              bpm,
              selectedInstrument,
              selectedCategory
            })
          );

          alert("Project saved.");
        }

        if (action === "metronome") {
          alert("Metronome enabled.");
        }

      });

    });

  }

  render();

})();
 
