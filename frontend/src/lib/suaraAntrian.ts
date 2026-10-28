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
    hentikanUcapan();
  }

  get generasiSekarang() { return this.generasi; }

  // Memutar satu MP3 dari URL (kalimat panggilan buatan server). Tidak menghentikan yang sedang jalan,
  // karena dipanggil setelah klip selesai. Resolve setelah selesai diputar; melempar kalau gagal dimuat.
  async putarUrl(url: string): Promise<void> {
    await this.siapkan();
    const gen = this.generasi;
    if (this.ctx) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
      if (gen !== this.generasi) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
      const s = this.ctx.createBufferSource();
      s.buffer = buffer;
      s.connect(this.ctx.destination);
      s.start();
      this.sumberAktif.push(s);
      await new Promise<void>((r) => setTimeout(r, Math.round(buffer.duration * 1000) + 100));
      return;
    }
    await new Promise<void>((selesai, gagal) => {
      const a = new Audio(url);
      this.elemenAktif = a;
      a.onended = () => selesai();
      a.onerror = () => gagal(new Error('audio gagal dimuat'));
      a.play().catch(gagal);
    });
  }

  // Memutar klip berurutan. Mengembalikan perkiraan durasi total (ms) segera, tanpa menunggu selesai.
  async putar(klip: string[], lanjutan = false): Promise<number> {
    await this.siapkan();
    if (!lanjutan) this.hentikan();
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

// ---------- Ucapan nama lewat TTS bawaan browser (Web Speech API) ----------
// Nama pasien tidak bisa direkam sebelumnya, jadi diucapkan mesin TTS perangkat kalau ada.
// Kalau tidak ada (browser TV tanpa speechSynthesis / tanpa suara Indonesia), fungsi ini diam saja.

const BATAS_UCAPAN_MS = 15_000; // pengaman: beberapa mesin tidak pernah memicu event end

export const ttsTersedia = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export const daftarSuara = (): SpeechSynthesisVoice[] => (ttsTersedia() ? window.speechSynthesis.getVoices() : []);

// Suara Indonesia, yang lokal (tanpa internet) didahulukan dari yang online (mis. "Google Bahasa Indonesia" di Chrome desktop).
export const daftarSuaraIndonesia = (): SpeechSynthesisVoice[] =>
  daftarSuara()
    .filter((v) => v.lang.toLowerCase().startsWith('id'))
    .sort((a, b) => Number(b.localService) - Number(a.localService));

// Daftar suara dimuat asinkron di beberapa browser. Dipanggil saat modul dimuat dan lagi dari gestur pengguna.
export function siapkanTts(): void {
  if (!ttsTersedia()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
if (typeof window !== 'undefined') siapkanTts();

// Menunggu daftar suara terisi, paling lama `batasMs`. Tidak semua browser mengisi daftar ini.
function tungguSuara(batasMs = 1500): Promise<void> {
  return new Promise((selesai) => {
    if (!ttsTersedia() || daftarSuara().length > 0) { selesai(); return; }
    const t = setTimeout(() => { window.speechSynthesis.onvoiceschanged = null; selesai(); }, batasMs);
    window.speechSynthesis.onvoiceschanged = () => { clearTimeout(t); selesai(); };
  });
}

export function hentikanUcapan(): void {
  if (ttsTersedia()) { try { window.speechSynthesis.cancel(); } catch { /* abaikan */ } }
}

// Huruf kapital semua ("SITI AMINAH") kadang dieja per huruf oleh mesin TTS; ubah ke Kapital Tiap Kata.
export const teksUcapNama = (nama: string): string =>
  nama.toLowerCase().replace(/(^|\s)(\S)/g, (_m, spasi: string, h: string) => spasi + h.toUpperCase());

// Mengucapkan teks; selesai (resolve) saat ucapan berakhir, gagal, atau melewati batas waktu.
export async function ucapkan(teks: string): Promise<void> {
  if (!ttsTersedia() || !teks.trim()) return;
  await tungguSuara();
  return new Promise((selesai) => {
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = 'id-ID';
    u.rate = 0.9;
    const suara = daftarSuaraIndonesia()[0];
    if (suara) u.voice = suara;
    let beres = false;
    const akhiri = () => { if (!beres) { beres = true; clearTimeout(t); selesai(); } };
    const t = setTimeout(() => { hentikanUcapan(); akhiri(); }, BATAS_UCAPAN_MS);
    u.onend = akhiri;
    u.onerror = (e) => {
      const petunjuk = e.error === 'not-allowed'
        ? '(browser menolak: halaman belum pernah diklik; buka lewat tombol "Mulai Tampilan", bukan ?mulai=1)'
        : e.error === 'synthesis-failed'
          ? '(mesin TTS perangkat gagal; di Linux cek speech-dispatcher)'
          : '';
      console.warn('[tts] gagal:', e.error, petunjuk, '| suara:', suara?.name ?? 'default');
      akhiri();
    };
    try {
      console.info('[tts] ucap:', teks, '| suara:', suara ? `${suara.name} (${suara.localService ? 'lokal' : 'online'})` : 'default', '| total suara:', daftarSuara().length);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      akhiri();
    }
  });
}

// ---------- Pintasan ----------
export const siapkanSuara = () => { siapkanTts(); return pemutarSuara.siapkan(); };

const tidur = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Satu panggilan utuh: klip (notif + nomor), lalu ucapan nama kalau diberikan.
// Resolve setelah semuanya selesai, atau lebih awal kalau dibatalkan oleh panggilan berikutnya.
// Nama poli untuk diucapkan: "KLINIK BEDAH" -> "Poli Bedah", "KLINIK KULIT & KELAMIN" -> "Poli Kulit dan Kelamin".
export const teksUcapPoli = (nm_poli: string) =>
  'Poli ' + teksUcapNama(nm_poli.replace(/^\s*(klinik|poli)\s+/i, '').trim()).replace(/\s*&\s*/g, ' dan ');

const ULANG_PANGGILAN = 2;      // kalimat panggilan dibunyikan dua kali
const JEDA_ULANG_MS = 2500;     // jeda antara ulangan

// Satu panggilan utuh. Kebijakan RS: pasien dipanggil dengan NAMA, bukan nomor urut, dan diulang ULANG_PANGGILAN kali:
//   bel -> "Atas nama <nama>, silakan menuju Poli <poli>" -> jeda -> kalimat lagi
// Kalau nama tidak boleh disebut (poli yang disamarkan), nomor urut dipakai sebagai pengganti. Supaya suaranya
// satu (konsisten), MP3 server sudah berisi "Nomor urut 90, silakan menuju Poli Jiwa"; klip angka Khanza hanya
// dipakai kalau MP3 server tidak ada:  bel -> klip "nomor urut <angka>" -> TTS "Silakan menuju Poli <poli>".
// Kalimatnya diutamakan dari MP3 buatan server (suaraUrl); kalau tidak ada / gagal, TTS browser; kalau itu pun tidak ada, diam.
// Resolve setelah semuanya selesai, atau lebih awal kalau dibatalkan oleh panggilan berikutnya.
export async function bunyikanPanggilan(opsi: { nama?: string; no_reg: string; nm_poli: string; suaraUrl?: string; kalimatCadangan?: string }): Promise<void> {
  const klipNomor = opsi.nama || opsi.suaraUrl ? [] : urutanKlipPanggilan(opsi.no_reg).filter((k) => k !== 'notif');
  const durasiAwal = await pemutarSuara.putar(['notif', ...klipNomor]);
  const gen = pemutarSuara.generasiSekarang;
  const masihAktif = () => gen === pemutarSuara.generasiSekarang;
  await tidur(durasiAwal + 200);
  if (!masihAktif()) return; // sudah ada panggilan baru

  const kalimat = async () => {
    if (opsi.suaraUrl) {
      try {
        console.info('[suara] mp3 server:', opsi.suaraUrl);
        await pemutarSuara.putarUrl(opsi.suaraUrl);
        return;
      } catch (err) {
        console.warn('[suara] mp3 server gagal, pakai TTS browser:', (err as Error).message);
        if (!masihAktif()) return;
      }
    }
    if (opsi.kalimatCadangan) { await ucapkan(opsi.kalimatCadangan); return; }
    const tujuan = teksUcapPoli(opsi.nm_poli);
    if (opsi.nama) await ucapkan(`Atas nama ${teksUcapNama(opsi.nama)}, silakan menuju ${tujuan}.`);
    else await ucapkan(`Silakan menuju ${tujuan}.`);
  };

  for (let ke = 1; ke <= ULANG_PANGGILAN; ke++) {
    if (ke > 1) {
      await tidur(JEDA_ULANG_MS);
      if (!masihAktif()) return;
      if (klipNomor.length) {
        const d = await pemutarSuara.putar(klipNomor, true);
        await tidur(d + 200);
        if (!masihAktif()) return;
      }
    }
    await kalimat();
    if (!masihAktif()) return;
  }
}
