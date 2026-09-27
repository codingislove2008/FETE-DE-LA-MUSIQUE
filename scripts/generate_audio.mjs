import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Mp3Encoder } from "@breezystack/lamejs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "..", "assets", "audio");
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const SAMPLE_RATE = 44100;

function encodeMp3(floatSamples, outPath) {
  const int16Samples = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    let s = Math.max(-1, Math.min(1, floatSamples[i]));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const mp3encoder = new Mp3Encoder(1, SAMPLE_RATE, 128);
  const mp3Data = [];
  const chunkSize = 1152;

  for (let i = 0; i < int16Samples.length; i += chunkSize) {
    const chunk = int16Samples.subarray(i, i + chunkSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(Buffer.from(mp3buf));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(Buffer.from(endBuf));
  }

  const total = Buffer.concat(mp3Data);
  fs.writeFileSync(outPath, total);
  console.log(`Generated ${path.basename(outPath)} (${(total.length / 1024).toFixed(1)} KB)`);
}

function tone(freq, t, type = "sine") {
  const phase = 2 * Math.PI * freq * t;
  if (type === "sine") return Math.sin(phase);
  if (type === "triangle") return Math.asin(Math.sin(phase)) * (2 / Math.PI);
  if (type === "sawtooth") return 2 * ((freq * t) % 1) - 1;
  if (type === "square") return Math.sin(phase) >= 0 ? 0.8 : -0.8;
  return Math.sin(phase);
}

// 1. Festival Bed (Accordion / Swing jazz loop, 12 seconds, seamlessly loopable)
function generateFestivalBed() {
  const dur = 12.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const chords = [
    [261.63, 329.63, 392.00, 523.25], // C
    [220.00, 261.63, 329.63, 440.00], // Am
    [146.83, 220.00, 293.66, 349.23], // Dm
    [196.00, 246.94, 293.66, 349.23]  // G7
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const chordIdx = Math.floor((t / 3.0) % 4);
    const chord = chords[chordIdx];
    
    const vibrato = 1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t);
    let sample = 0;

    chord.forEach((freq) => {
      const f = freq * vibrato;
      sample += 0.08 * tone(f, t, "sawtooth");
      sample += 0.05 * tone(f * 1.002, t, "triangle");
    });

    const beatTime = (t * 2) % 1;
    const bassEnv = Math.exp(-beatTime * 6);
    sample += 0.18 * bassEnv * tone(chord[0] * 0.5, t, "sine");

    const melStep = Math.floor(t * 3) % 12;
    const melNotes = [523.25, 587.33, 659.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33, 523.25, 493.88];
    const melEnv = Math.exp(-((t * 3) % 1) * 4);
    sample += 0.12 * melEnv * tone(melNotes[melStep] * vibrato, t, "triangle");

    let env = 1.0;
    if (t < 0.1) env = t / 0.1;
    if (t > dur - 0.1) env = (dur - t) / 0.1;

    buffer[i] = sample * env * 0.7;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "festival-bed.mp3"));
}

// 2. Musician 1: Adam de la Halle — Jeu de Robin et Marion (c. 1240–1288)
function generateAdamDeLaHalle() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const melody = [
    { f: 293.66, d: 0.6 }, { f: 329.63, d: 0.6 }, { f: 349.23, d: 0.8 },
    { f: 392.00, d: 0.6 }, { f: 349.23, d: 0.4 }, { f: 329.63, d: 0.6 },
    { f: 293.66, d: 0.8 }, { f: 261.63, d: 0.4 }, { f: 293.66, d: 1.2 },
    { f: 349.23, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 440.00, d: 0.8 },
    { f: 392.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 293.66, d: 1.4 }
  ];

  let noteIdx = 0;
  let nextTime = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= nextTime && noteIdx < melody.length) {
      nextTime += melody[noteIdx].d;
      noteIdx++;
    }
    const curr = melody[Math.min(noteIdx, melody.length - 1)];
    const noteLocalT = t - (nextTime - curr.d);
    const env = Math.exp(-noteLocalT * 2.2);

    const drone = 0.08 * tone(146.83, t, "triangle") + 0.05 * tone(220.00, t, "sine");
    const flute = 0.28 * env * (tone(curr.f, t, "sine") + 0.3 * tone(curr.f * 2, t, "triangle"));
    buffer[i] = (drone + flute) * 0.8;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "adam_de_la_halle.mp3"));
}

// 3. Musician 2: Josquin des Prez — Missa Pange Lingua (c. 1450–1521)
function generateJosquin() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const tenor = [261.63, 261.63, 293.66, 261.63, 220.00, 246.94, 261.63];
  const soprano = [523.25, 523.25, 587.33, 523.25, 440.00, 493.88, 523.25];
  const bass = [130.81, 130.81, 146.83, 130.81, 110.00, 123.47, 130.81];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const step = Math.min(Math.floor(t / 1.4), 6);
    
    let sample = 0;
    sample += 0.18 * tone(tenor[step], t, "sine");
    sample += 0.14 * tone(tenor[step] * 1.003, t, "triangle");
    
    if (t > 1.2) {
      const sStep = Math.min(Math.floor((t - 1.2) / 1.4), 6);
      sample += 0.16 * tone(soprano[sStep], t, "sine");
    }

    sample += 0.16 * tone(bass[step], t, "sine");
    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "josquin_des_prez.mp3"));
}

// 4. Musician 3: Jean-Baptiste Lully — Armide (1632–1687)
function generateLully() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t % 1.0;
    const isShort = beat > 0.75;
    const step = Math.floor(t);
    const chords = [
      [220, 261.63, 329.63, 440],
      [196, 246.94, 293.66, 392],
      [174.61, 220, 261.63, 349.23],
      [164.81, 207.65, 246.94, 329.63]
    ];
    const ch = chords[step % 4];

    let sample = 0;
    const env = isShort ? Math.exp(-(beat - 0.75) * 8) : Math.exp(-beat * 4);
    
    ch.forEach((f) => {
      sample += 0.08 * env * tone(f, t, "sawtooth");
      sample += 0.05 * env * tone(f * 2, t, "square");
    });

    buffer[i] = sample * 0.7;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "jean_baptiste_lully.mp3"));
}

// 5. Musician 4: Hector Berlioz — Symphonie fantastique (1803–1869)
function generateBerlioz() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const marchBeat = (t * 1.8) % 1;
    const drumEnv = Math.exp(-marchBeat * 7);

    let sample = 0.25 * drumEnv * tone(49.0, t, "sine");
    sample += 0.15 * drumEnv * tone(73.42, t, "sine");

    const step = Math.floor(t * 1.8) % 8;
    const fanfare = [196, 185, 174.61, 164.81, 146.83, 130.81, 123.47, 98.0];
    const brassEnv = Math.exp(-marchBeat * 3);
    sample += 0.3 * brassEnv * tone(fanfare[step], t, "sawtooth");
    sample += 0.15 * brassEnv * tone(fanfare[step] * 2, t, "triangle");

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "hector_berlioz.mp3"));
}

// 6. Musician 5: Édith Piaf — La Vie en Rose (1915–1963)
function generatePiaf() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const melody = [
    { f: 392.00, d: 1.2 }, { f: 440.00, d: 0.8 }, { f: 493.88, d: 1.2 },
    { f: 392.00, d: 1.0 }, { f: 329.63, d: 1.8 }, { f: 349.23, d: 1.2 },
    { f: 392.00, d: 1.8 }, { f: 329.63, d: 1.0 }
  ];

  let noteIdx = 0;
  let nextTime = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= nextTime && noteIdx < melody.length) {
      nextTime += melody[noteIdx].d;
      noteIdx++;
    }
    const curr = melody[Math.min(noteIdx, melody.length - 1)];
    const localT = t - (nextTime - curr.d);
    
    const vibrato = 1 + 0.015 * Math.sin(2 * Math.PI * 6.0 * t);
    const env = Math.min(1.0, localT * 5) * Math.exp(-localT * 0.4);

    let sample = 0.32 * env * tone(curr.f * vibrato, t, "sawtooth");
    sample += 0.15 * env * tone(curr.f * 2 * vibrato, t, "triangle");

    const waltzBeat = (t * 2.2) % 3;
    const waltzStep = Math.floor(waltzBeat);
    const waltzEnv = Math.exp(-(waltzBeat % 1) * 5);
    if (waltzStep === 0) {
      sample += 0.2 * waltzEnv * tone(130.81, t, "sine");
    } else {
      sample += 0.12 * waltzEnv * (tone(261.63, t, "triangle") + tone(329.63, t, "triangle"));
    }

    buffer[i] = sample * 0.7;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "edith_piaf.mp3"));
}

// 7. Musician 6: Charles Trenet — La Mer (1913–2001)
function generateTrenet() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const notes = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63, 293.66, 329.63, 261.63];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const step = Math.floor(t * 1.2) % notes.length;
    const beat = (t * 1.2) % 1;
    const env = Math.exp(-beat * 2.5);

    let sample = 0.25 * env * tone(notes[step], t, "triangle");
    sample += 0.15 * env * tone(notes[step] * 1.002, t, "sine");

    const swell = 0.05 * Math.sin(2 * Math.PI * 0.3 * t) * (Math.random() * 2 - 1);
    sample += swell;

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "charles_trenet.mp3"));
}

// 8. Musician 7: Hugues Aufray — Santiano (1929–)
function generateAufray() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const melody = [
    196, 196, 196, 220, 246.94, 246.94, 246.94, 220,
    196, 220, 246.94, 293.66, 246.94, 220, 196
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const tempo = 2.4;
    const step = Math.floor(t * tempo) % melody.length;
    const beat = (t * tempo) % 1;
    const env = Math.exp(-beat * 3.5);

    let sample = 0.32 * env * tone(melody[step], t, "triangle");
    sample += 0.15 * env * tone(melody[step] * 2, t, "sine");

    const stomp = Math.exp(-((t * tempo) % 1) * 8);
    sample += 0.22 * stomp * tone(85, t, "sine");

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "hugues_aufray.mp3"));
}

// 9. Musician 8: Serge Gainsbourg — La Javanaise (1928–1991)
function generateGainsbourg() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const chords = [
    [174.61, 261.63, 329.63, 349.23],
    [164.81, 246.94, 311.13, 329.63],
    [146.83, 220.00, 261.63, 349.23],
    [130.81, 196.00, 261.63, 329.63]
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const bar = Math.floor(t / 2.5) % 4;
    const ch = chords[bar];
    const beat = (t * 2.0) % 3;
    const step = Math.floor(beat);
    const env = Math.exp(-(beat % 1) * 4);

    let sample = 0;
    if (step === 0) {
      sample += 0.3 * env * tone(ch[0] * 0.5, t, "sine");
    } else {
      ch.forEach((f) => {
        sample += 0.08 * env * tone(f, t, "triangle");
      });
    }

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "serge_gainsbourg.mp3"));
}

// 10. Musician 9: Daft Punk — One More Time (1993–2021)
function generateDaftPunk() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const riff = [293.66, 369.99, 440.00, 493.88, 440.00, 369.99, 293.66, 440.00];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const kickBeat = (t * 2.1) % 1;
    const kickEnv = Math.exp(-kickBeat * 10);
    const kickPitch = 130 * Math.exp(-kickBeat * 25) + 45;
    let sample = 0.38 * kickEnv * tone(kickPitch, t, "sine");

    const hatBeat = (t * 2.1 + 0.5) % 1;
    const hatEnv = Math.exp(-hatBeat * 16);
    sample += 0.12 * hatEnv * (Math.random() * 2 - 1);

    const riffStep = Math.floor(t * 4.2) % riff.length;
    const synthEnv = Math.exp(-((t * 4.2) % 1) * 2.8);
    const filterMod = 1 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
    
    sample += 0.22 * synthEnv * tone(riff[riffStep] * filterMod, t, "sawtooth");
    sample += 0.12 * synthEnv * tone(riff[riffStep] * 2, t, "square");

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "daft_punk.mp3"));
}

// 11. Musician 10: Stromae — Alors on danse (1985–)
function generateStromae() {
  const dur = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);

  const hook = [329.63, 392.00, 329.63, 493.88, 440.00, 392.00, 329.63, 293.66];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const tempo = 1.95;
    
    const kickBeat = (t * tempo) % 1;
    const kickEnv = Math.exp(-kickBeat * 12);
    const kickPitch = 120 * Math.exp(-kickBeat * 30) + 40;
    let sample = 0.4 * kickEnv * tone(kickPitch, t, "sine");

    const clapBeat = (t * tempo * 0.5) % 1;
    if (clapBeat > 0.48 && clapBeat < 0.6) {
      sample += 0.2 * (Math.random() * 2 - 1);
    }

    const hookStep = Math.floor(t * tempo * 2) % hook.length;
    const noteLocal = (t * tempo * 2) % 1;
    const hookEnv = noteLocal < 0.6 ? Math.exp(-noteLocal * 4) : 0;
    sample += 0.28 * hookEnv * tone(hook[hookStep], t, "sawtooth");
    sample += 0.15 * hookEnv * tone(hook[hookStep] * 1.005, t, "square");

    buffer[i] = sample * 0.75;
  }

  encodeMp3(buffer, path.join(AUDIO_DIR, "stromae.mp3"));
}

console.log("Synthesizing and encoding all MP3 audio snippets...");
generateFestivalBed();
generateAdamDeLaHalle();
generateJosquin();
generateLully();
generateBerlioz();
generatePiaf();
generateTrenet();
generateAufray();
generateGainsbourg();
generateDaftPunk();
generateStromae();
console.log("All audio generated successfully!");
