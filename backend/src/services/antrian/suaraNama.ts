import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Suara panggilan dibuat di SERVER (rencana B), supaya TV tidak bergantung pada TTS browser.
// Mesin: Google Translate TTS (gratis, suara Indonesia bagus, endpoint tidak resmi). Hanya teks kalimat
// yang dikirim ke Google, tanpa nomor RM atau data lain. Hasil MP3 dicache di SUARA_CACHE_DIR dengan nama
// file hash kalimatnya, lalu disajikan backend di /suara-nama/<hash>.mp3 untuk TV di jaringan lokal.
// Kalau internet server mati atau Google lambat (> BATAS_MS), panggilan tetap dikirim tanpa MP3;
// TV lalu mencoba TTS browser, dan kalau itu pun tidak ada, hanya bel.

export const SUARA_CACHE_DIR = process.env.SUARA_CACHE_DIR ?? path.resolve(process.cwd(), 'cache/suara');
const BATAS_MS = Number(process.env.SUARA_BATAS_MS ?? 3000);
const UMUR_CACHE_HARI = Number(process.env.SUARA_UMUR_CACHE_HARI ?? 30);
const AKTIF = (process.env.SUARA_SERVER ?? 'true') !== 'false';

const namaFile = (teks: string) => crypto.createHash('sha1').update(teks.trim().toLowerCase()).digest('hex') + '.mp3';

function urlGoogle(teks: string): string {
  const q = new URLSearchParams({ ie: 'UTF-8', tl: 'id', client: 'tw-ob', q: teks });
  return `https://translate.google.com/translate_tts?${q.toString()}`;
}

async function unduh(teks: string, tujuan: string): Promise<void> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), BATAS_MS);
  try {
    const res = await fetch(urlGoogle(teks), {
      signal: ctl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
    });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('audio')) {
      throw new Error(`jawaban ${res.status} ${res.headers.get('content-type') ?? ''}`);
    }
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length < 1000) throw new Error('berkas terlalu kecil');
    // Tulis ke file sementara dulu supaya tidak ada MP3 setengah jadi yang terbaca TV.
    const sementara = `${tujuan}.${process.pid}.tmp`;
    await fs.promises.writeFile(sementara, data);
    await fs.promises.rename(sementara, tujuan);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Mengembalikan path URL MP3 ("/suara-nama/<hash>.mp3") untuk kalimat ini, dari cache atau dibuat baru.
 * undefined kalau dinonaktifkan, gagal, atau melewati batas waktu. Tidak pernah melempar error.
 */
export async function buatSuara(teks: string): Promise<string | undefined> {
  if (!AKTIF || !teks.trim()) return undefined;
  const nama = namaFile(teks);
  const berkas = path.join(SUARA_CACHE_DIR, nama);
  try {
    await fs.promises.mkdir(SUARA_CACHE_DIR, { recursive: true });
    if (!fs.existsSync(berkas)) await unduh(teks, berkas);
    // Sentuh mtime supaya kalimat yang sering dipakai tidak kena pembersihan.
    const kini = new Date();
    fs.promises.utimes(berkas, kini, kini).catch(() => undefined);
    return `/suara-nama/${nama}`;
  } catch (err) {
    console.warn('[suara] gagal membuat MP3:', (err as Error).message, '| teks:', teks);
    return undefined;
  }
}

// Hapus MP3 yang tidak dipakai lebih dari UMUR_CACHE_HARI. Dipanggil saat backend menyala dan tiap 24 jam.
export async function bersihkanCacheSuara(): Promise<void> {
  try {
    const batas = Date.now() - UMUR_CACHE_HARI * 24 * 3600 * 1000;
    const daftar = await fs.promises.readdir(SUARA_CACHE_DIR).catch(() => [] as string[]);
    let dihapus = 0;
    for (const f of daftar) {
      const p = path.join(SUARA_CACHE_DIR, f);
      const st = await fs.promises.stat(p).catch(() => null);
      if (st && (st.mtimeMs < batas || f.endsWith('.tmp'))) { await fs.promises.unlink(p).catch(() => undefined); dihapus++; }
    }
    if (dihapus) console.log(`[suara] cache dibersihkan: ${dihapus} berkas`);
  } catch (err) {
    console.warn('[suara] pembersihan cache gagal:', (err as Error).message);
  }
}

export function mulaiPembersihCache(): void {
  void bersihkanCacheSuara();
  setInterval(() => void bersihkanCacheSuara(), 24 * 3600 * 1000).unref();
}
