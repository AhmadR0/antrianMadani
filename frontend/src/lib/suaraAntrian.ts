// Suara panggilan antrian dari klip MP3 lokal (public/suara), tanpa TTS dan tanpa internet.
// Klip angka berasal dari folder suara/ SIMRS Khanza; notif.mp3 dari aplikasi antrian lama.
// Urutan satu panggilan: notif -> "nomor urut" -> angka (mis. 022 -> dua puluh dua).
//
// Browser hanya mengizinkan audio setelah ada interaksi pengguna, jadi `siapkanSuara()` harus
// dipanggil dari handler klik (tombol "Mulai Tampilan"). Setelah itu panggilan boleh dibunyikan kapan saja.

const DASAR = '/suara';
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const SEMUA_KLIP = [
  'notif', 'nomor-urut', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
  'sepuluh', 'sebelas', 'belas', 'puluh', 'ratus', 'seratus',
];

// Terbilang 1..999 memakai nama klip yang tersedia.
function terbilang(n: number): string[] {
  if (n <= 0) return [];
  if (n < 10) return [SATUAN[n]];
  if (n === 10) return ['sepuluh'];
  if (n === 11) return ['sebelas'];
  if (n < 20) return [SATUAN[n - 10], 'belas'];
  if (n < 100) return [SATUAN[Math.floor(n / 10)], 'puluh', ...terbilang(n % 10)];
  if (n < 200) return ['seratus', ...terbilang(n % 100)];
  if (n < 1000) return [SATUAN[Math.floor(n / 100)], 'ratus', ...terbilang(n % 100)];
  return terbilang(n % 1000); // di luar jangkauan klip: bacakan tiga digit terakhir
}

// "022" -> ["notif", "nomor-urut", "dua", "puluh", "dua"]. Nomor tanpa angka -> hanya notif.
export function urutanKlipPanggilan(no_reg: string): string[] {
  const digit = (no_reg ?? '').replace(/\D/g, '');
  const n = digit ? parseInt(digit, 10) : 0;
  return n > 0 ? ['notif', 'nomor-urut', ...terbilang(n)] : ['notif'];
}

type JendelaAudio = Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

class PemutarSuara {
  private ctx: AudioContext | null = null;
  private buffer = new Map<string, AudioBuffer>();
  private elemen = new Map<string, HTMLAudioElement>(); // fallback tanpa Web Audio
  private pemuatan: Promise<void> | null = null;
  private sumberAktif: AudioBufferSourceNode[] = [];
  private elemenAktif: HTMLAudioElement | null = null;
  private generasi = 0; // naik tiap putar/hentikan, untuk membatalkan urutan fallback yang lama

  // Dipanggil dari handler klik. Membuka AudioContext dan memuat semua klip ke memori.
  siapkan(): Promise<void> {
    if (this.pemuatan) return this.pemuatan;
    const AC = (window as JendelaAudio).AudioContext ?? (window as JendelaAudio).webkitAudioContext;
    if (AC) {
      try { this.ctx = new AC(); } catch { this.ctx = null; }
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => undefined);

    this.pemuatan = (async () => {
      await Promise.all(SEMUA_KLIP.map(async (nama) => {
        const url = `${DASAR}/${nama}.mp3`;
        if (this.ctx) {
          try {
            const res = await fetch(url);
            const data = await res.arrayBuffer();
            this.buffer.set(nama, await this.ctx.decodeAudioData(data));
            return;
          } catch (err) {
            console.warn('[suara] gagal decode', nama, err);
          }
        }
        const a = new Audio(url);
        a.preload = 'auto';
        this.elemen.set(nama, a);
      }));
    })();
    return this.pemuatan;
  }

  hentikan() {
    this.generasi += 1;
    for (const s of this.sumberAktif) { try { s.stop(); } catch { /* sudah selesai */ } }
    this.sumberAktif = [];
    if (this.elemenAktif) { this.elemenAktif.pause(); this.elemenAktif = null; }
  }

  // Memutar klip berurutan. Mengembalikan perkiraan durasi total (ms) segera, tanpa menunggu selesai.
  async putar(klip: string[]): Promise<number> {
    await this.siapkan();
    this.hentikan();
    const gen = this.generasi;

    if (this.ctx) {
      // Jangan di-await: kalau browser masih menahan audio (belum ada gestur), promise resume
      // menggantung sampai ada gestur. Sumber tetap dijadwalkan dan berbunyi begitu konteks jalan.
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
      let t = this.ctx.currentTime + 0.05;
      const awal = t;
      for (const nama of klip) {
        const b = this.buffer.get(nama);
        if (!b) continue;
        const s = this.ctx.createBufferSource();
        s.buffer = b;
        s.connect(this.ctx.destination);
        s.start(t);
        this.sumberAktif.push(s);
        t += b.duration;
      }
      return Math.round((t - awal) * 1000);
    }

    // Fallback: elemen <audio> dimainkan berantai lewat onended.
    const daftar = klip.map((n) => this.elemen.get(n)).filter((a): a is HTMLAudioElement => !!a);
    let durasi = 0;
    for (const a of daftar) durasi += Number.isFinite(a.duration) ? a.duration : 1;
    const mainkan = (i: number) => {
      if (gen !== this.generasi || i >= daftar.length) return;
      const a = daftar[i];
      this.elemenAktif = a;
      a.currentTime = 0;
      a.onended = () => mainkan(i + 1);
      a.play().catch(() => mainkan(i + 1));
    };
    mainkan(0);
    return Math.round(durasi * 1000);
  }
}

export const pemutarSuara = new PemutarSuara();

// Pintasan: siapkan dari gestur pengguna, bunyikan satu panggilan.
export const siapkanSuara = () => pemutarSuara.siapkan();
export const bunyikanPanggilan = (no_reg: string) => pemutarSuara.putar(urutanKlipPanggilan(no_reg));
