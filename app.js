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

          <div class="brand">
            STUDIO<span>BEAT</span>
          </div>

          <div class="project-name">
            My First Song
          </div>

          <div class="transport">

            <button id="new">NEW</button>

            <button id="stop">
              ■
            </button>

            <button id="play">
              ${playing ? "❚❚" : "▶"}
            </button>

            <button id="record"
              class="${recording ? "recording" : ""}">
              ●
            </button>

            <label>
              BPM
              <input
                id="bpm"
                type="number"
                min="40"
                max="240"
                value="${bpm}">
            </label>

          </div>

        </header>

        <div class="studio-tabs">

          <button data-tab="arrange">
            ARRANGE
          </button>

          <button data-tab="sounds">
            SOUNDS
          </button>

          <button data-tab="piano">
            PIANO
          </button>

          <button data-tab="looper">
            LOOPER
          </button>

          <button data-tab="recording">
            RECORD
          </button>

          <button data-tab="mixer">
            MIXER
          </button>

          <button data-tab="tools">
            TOOLS
          </button>

        </div>

        <main>

          <section
            class="panel ${activeTab === "arrange" ? "show" : ""}">

            <div class="panel-title">

              <b>ARRANGEMENT</b>

              <span>
                ${bpm} BPM
              </span>

            </div>

            <div class="timeline-scroll">

              <div class="timeline">

                <div class="ruler">

                  <div class="track-name">
                    TRACKS
                  </div>

                  ${Array.from(
                    {length:32},
                    (_,i) =>
                    `<div>${i + 1}</div>`
                  ).join("")}

                </div>

                ${tracks.map(
                  (track,index) => `

                  <div class="track">

                    <div class="track-info">

                      <b>
                        ${track.name}
                      </b>

                      <small>
                        ${track.instrument}
                      </small>

                      <button>
                        M
                      </button>

                      <button>
                        S
                      </button>

                    </div>

                    <div class="lane">

                      ${Array.from(
                        {length:32},
                        () => `<i></i>`
                      ).join("")}

                      ${
                        clips
                        .filter(c => c.track === index)
                        .map(c => `
                          <div
                            class="clip"
                            style="
                              left:${c.start * 64}px;
                              width:${c.length * 64}px;
                            ">
                            ${c.name}
                          </div>
                        `)
                        .join("")
                      }

                    </div>

                  </div>

                `).join("")}

                <div
                  id="playhead"
                  style="
                    left:${130 + beat * 64}px;
                  ">
                </div>

              </div>

            </div>

            <div class="arrangement-buttons">

              <button id="addTrack">
                ＋ ADD TRACK
              </button>

              <button id="addRegion">
                ＋ ADD REGION
              </button>

              <button>
                UNDO
              </button>

              <button>
                REDO
              </button>

              <button>
                SNAP
              </button>

              <button>
                ZOOM
              </button>

            </div>

          </section>

          <section
            class="panel ${activeTab === "sounds" ? "show" : ""}">

            <div class="panel-title">

              <b>
                INSTRUMENTS
              </b>

              <span>
                ${instruments.length}
              </span>

            </div>

            <div class="categories">

              ${categories.map(c => `

                <button
                  data-category="${c}"
                  class="${category === c ? "selected" : ""}">

                  ${c.toUpperCase()}

                </button>

              `).join("")}

            </div>

            <div class="instrument-grid">

              ${filtered.map(item => `

                <button
                  class="instrument"
                  data-instrument="${item[0]}">

                  <b>
                    ${item[0]}
                  </b>

                  <small>
                    ${item[1]}
                  </small>

                </button>

              `).join("")}

            </div>

          </section>

          <section
            class="panel ${activeTab === "piano" ? "show" : ""}">

            <div class="panel-title">

              <b>PIANO</b>

              <span>
                ${selected}
              </span>

            </div>

            <div class="piano-tools">

              <button id="octDown">
                OCT −
              </button>

              <button id="octUp">
                OCT ＋
              </button>

              <button>
                SUSTAIN
              </button>

              <button>
                SMART CHORD
              </button>

              <button>
                ARPEGGIATOR
              </button>

            </div>

            <div class="keyboard-scroll">

              <div class="keyboard">

                ${whiteKeys()}

                ${blackKeys()}

              </div>

            </div>

          </section>

          <section
            class="panel ${activeTab === "looper" ? "show" : ""}">

            <div class="panel-title">

              <b>LOOPER</b>

              <span>
                PERFORMANCE GRID
              </span>

            </div>

            <div class="loop-packs">

              ${genres.map(g => `

                <button>
                  ${g}
                  <small>
                    PACK
                  </small>
                </button>

              `).join("")}

            </div>

            <div class="looper-grid">

              ${
                [
                  "Drums",
                  "Bass",
                  "Keys",
                  "Guitar",
                  "Percussion",
                  "Log Drum",
                  "Lead",
                  "Vocal",
                  "FX",
                  "Top Loop",
                  "Chord",
                  "Fill"
                ].map((name,i) => `

                  <button
                    class="loop-cell"
                    data-loop="${i}">

                    <b>
                      ${name}
                    </b>

                    <small>
                      LOOP ${i + 1}
                    </small>

                  </button>

                `).join("")
              }

            </div>

            <div class="fx-buttons">

              <button>
                GATER
              </button>

              <button>
                STUTTER
              </button>

              <button>
                TAPE STOP
              </button>

              <button>
                RECORD LOOP
              </button>

            </div>

          </section>

          <section
            class="panel ${activeTab === "recording" ? "show" : ""}">

            <div class="panel-title">

              <b>
                RECORDING STUDIO
              </b>

              <span>
                VOCAL / AUDIO
              </span>

            </div>

            <div class="recording-box">

              <button
                id="micRecord"
                class="big-record">

                ${recording
                  ? "STOP RECORDING"
                  : "START RECORDING"}

              </button>

              <div class="input-meter">
                <div id="meter"></div>
              </div>

              <div class="effects">

                <button>
                  NOISE REDUCTION
                </button>

                <button>
                  PITCH CORRECTION
                </button>

                <button>
                  VOCAL PRESET
                </button>

                <button>
                  EQ
                </button>

                <button>
                  COMPRESSION
                </button>

                <button>
                  REVERB
                </button>

                <button>
                  DELAY
                </button>

              </div>

              <div id="recordings"></div>

            </div>

          </section>

          <section
            class="panel ${activeTab === "mixer" ? "show" : ""}">

            <div class="panel-title">

              <b>MIXER</b>

              <span>
                TRACK MIXING
              </span>

            </div>

            <div class="mixer">

              ${tracks.map(track => `

                <div class="channel">

                  <b>
                    ${track.name}
                  </b>

                  <small>
                    ${track.instrument}
                  </small>

                  <label>
                    VOLUME
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="80">
                  </label>

                  <label>
                    PAN
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value="0">
                  </label>

                  <div>

                    <button>
                      MUTE
                    </button>

                    <button>
                      SOLO
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>

          </section>

          <section
            class="panel ${activeTab === "tools" ? "show" : ""}">

            <div class="panel-title">

              <b>
                STUDIO TOOLS
              </b>

            </div>

            <div class="tool-grid">

              <button>
                🎸 GUITAR TUNER
              </button>

              <button>
                METRONOME
              </button>

              <button>
                COUNT-IN
              </button>

              <button>
                MASTERING
              </button>

              <button>
                IMPORT AUDIO
              </button>

              <button>
                EXPORT SONG
              </button>

              <button>
                PROJECT SETTINGS
              </button>

              <button>
                MY TRACKS
              </button>

            </div>

          </section>

        </main>

        <nav class="bottom-nav">

          <button
            data-tab="arrange"
            class="${activeTab === "arrange" ? "active" : ""}">
            <b>⌁</b>
            <span>Arrange</span>
          </button>

          <button
            data-tab="sounds"
            class="${activeTab === "sounds" ? "active" : ""}">
            <b>♫</b>
            <span>Sounds</span>
          </button>

          <button
            data-tab="piano"
            class="${activeTab === "piano" ? "active" : ""}">
            <b>▥</b>
            <span>Piano</span>
          </button>

          <button
            data-tab="looper"
            class="${activeTab === "looper" ? "active" : ""}">
            <b>▦</b>
            <span>Looper</span>
          </button>

          <button
            data-tab="mixer"
            class="${activeTab === "mixer" ? "active" : ""}">
            <b>≋</b>
            <span>Mixer</span>
          </button>

        </nav>

      </div>
    `;

    bind();
  }

  function whiteKeys() {

    const notes = [
      60,62,64,65,67,69,71,
      72,74,76,77,79,81,83
    ];

    return notes.map(n => `
      <button
        class="white-key"
        data-midi="${n}">
      </button>
    `).join("");
  }

  function blackKeys() {

    const keys = [
      [61,31],[63,77],[66,169],
      [68,215],[70,261],[73,353],
      [75,399],[78,491],[80,537],[82,583]
    ];

    return keys.map(k => `
      <button
        class="black-key"
        style="left:${k[1]}px"
        data-midi="${k[0]}">
      </button>
    `).join("");
  }

  function bind() {

    document.querySelectorAll("[data-tab]")
      .forEach(button => {

        button.onclick = () => {

          activeTab = button.dataset.tab;

          render();

        };

      });

    document.querySelectorAll("[data-category]")
      .forEach(button => {

        button.onclick = () => {

          category = button.dataset.category;

          activeTab = "sounds";

          render();

        };

      });

    document.querySelectorAll("[data-instrument]")
      .forEach(button => {

        button.onclick = () => {

          selected = button.dataset.instrument;

          tracks[0].instrument = selected;

          activeTab = "piano";

          render();

        };

      });

    document.querySelectorAll("[data-midi]")
      .forEach(button => {

        button.onpointerdown = () => {

          const midi =
            Number(button.dataset.midi);

          playNote(midi);

        };

      });

    document.getElementById("bpm").onchange =
      event => {

        bpm = Math.max(
          40,
          Math.min(
            240,
            Number(event.target.value) || 105
          )
        );

      };

    document.getElementById("play").onclick =
      () => {

        audioStart();

        if (playing) return;

        playing = true;

        beat = 0;

        render();

        timer = setInterval(() => {

          beat++;

          if (beat >= 32) {
            beat = 0;
          }

          const playhead =
            document.getElementById("playhead");

          if (playhead) {

            playhead.style.left =
              (130 + beat * 64) + "px";

          }

        }, 60000 / bpm / 4);

      };

    document.getElementById("stop").onclick =
      () => {

        playing = false;

        clearInterval(timer);

        timer = null;

        beat = 0;

        render();

      };

    document.getElementById("record").onclick =
      () => {

        activeTab = "recording";

        render();

      };

    document.getElementById("new").onclick =
      () => {

        tracks = [
          {
            name:"Track 1",
            instrument:"Piano",
            type:"MIDI"
          }
        ];

        clips = [];

        selected = "Piano";

        render();

      };

    document.getElementById("addTrack").onclick =
      () => {

        tracks.push({

          name:
            "Track " +
            (tracks.length + 1),

          instrument:selected,

          type:"MIDI"

        });

        render();

      };

    document.getElementById("addRegion").onclick =
      () => {

        clips.push({

          track:0,

          start:
            clips.length * 4,

          length:4,

          name:
            selected + " Region"

        });

        render();

      };

    document.getElementById("octDown").onclick =
      () => {

        octave =
          Math.max(1, octave - 1);

        render();

      };

    document.getElementById("octUp").onclick =
      () => {

        octave =
          Math.min(7, octave + 1);

        render();

      };

    document.querySelectorAll("[data-loop]")
      .forEach(button => {

        button.onclick = () => {

          button.classList.toggle("active");

          audioStart();

          playNote(
            60 +
            Number(button.dataset.loop) * 2
          );

        };

      });

    document.getElementById("micRecord").onclick =
      startRecording;

  }

  async function startRecording() {

    if (recording) {

      if (recorder) {
        recorder.stop();
      }

      recording = false;

      render();

      return;

    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      alert(
        "Microphone recording is not available here."
      );

      return;

    }

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio:true
        });

      chunks = [];

      recorder =
        new MediaRecorder(stream);

      recorder.ondataavailable =
        event => {

          if (event.data.size) {
            chunks.push(event.data);
          }

        };

      recorder.onstop = () => {

        stream
          .getTracks()
          .forEach(track => track.stop());

        const blob =
          new Blob(
            chunks,
            {type:"audio/webm"}
          );

        const url =
          URL.createObjectURL(blob);

        const box =
          document.getElementById(
            "recordings"
          );

        if (box) {

          box.innerHTML += `
            <div class="recording-file">
              <audio
                controls
                src="${url}">
              </audio>
              <a
                href="${url}"
                download="StudioBeat-recording.webm">
                SAVE RECORDING
              </a>
            </div>
          `;

        }

      };

      recorder.start();

      recording = true;

      render();

    } catch (error) {

      alert(
        "Microphone permission is required."
      );

    }

  }

  render();

})();
