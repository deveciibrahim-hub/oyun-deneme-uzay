// Dosyasız ses efektleri (WebAudio ile sentez). Gerçek sesler gelince değiştirilecek.
import { Save } from './save';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const last: Record<string, number> = {};

function ac(): AudioContext | null {
  if (!Save.data.sound) return null;
  try {
    if (!ctx) {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C() as AudioContext;
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function throttle(name: string, ms: number): boolean {
  const now = performance.now();
  if (last[name] && now - last[name] < ms) return false;
  last[name] = now;
  return true;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
  const a = ac();
  if (!a || !master) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(master);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

function noise(dur: number, vol: number, lowpass: number): void {
  const a = ac();
  if (!a || !master) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const Sfx = {
  unlock(): void { ac(); },
  shoot(): void { if (throttle('shoot', 70)) tone(880, 0.06, 'square', 0.05, 440); },
  hit(): void { if (throttle('hit', 40)) tone(300, 0.05, 'triangle', 0.08, 180); },
  explode(): void { if (throttle('explode', 50)) noise(0.25, 0.35, 1200); },
  big(): void { noise(0.8, 0.6, 600); tone(90, 0.7, 'sawtooth', 0.15, 40); },
  planetHit(): void { if (throttle('ph', 90)) { tone(120, 0.18, 'sawtooth', 0.12, 60); } },
  pickup(): void { tone(660, 0.08, 'sine', 0.15, 1320); },
  click(): void { tone(520, 0.05, 'sine', 0.12, 700); },
  card(): void { tone(440, 0.1, 'sine', 0.12, 880); setTimeout(() => tone(880, 0.12, 'sine', 0.1, 1320), 90); },
  missile(): void { if (throttle('missile', 120)) noise(0.12, 0.12, 2500); },
  win(): void { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.15), i * 110)); },
  lose(): void { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.15), i * 150)); }
};
