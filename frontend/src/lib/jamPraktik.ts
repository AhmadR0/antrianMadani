// Pembantu jam praktik, dipakai layar antrian poli dan layar jadwal dokter.
// Semua jam berupa string "HH:MM" atau "HH:MM:SS" dari Khanza; dibandingkan sebagai teks.
//
// Zona waktu RS dipaksa WITA: jam di layar dan penanda "sedang praktik" tidak boleh ikut
// pengaturan zona waktu perangkat (smart TV sering terset WIB).

export const ZONA_WAKTU_RS = 'Asia/Makassar'; // WITA

const fmtJamDetik = new Intl.DateTimeFormat('en-GB', { timeZone: ZONA_WAKTU_RS, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const fmtTanggal = new Intl.DateTimeFormat('id-ID', { timeZone: ZONA_WAKTU_RS, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// "08:05:09" menurut WITA
export const jamDetikRS = (d: Date): string => fmtJamDetik.format(d);
// "08:05" menurut WITA
export const jamMenitRS = (d: Date): string => jamDetikRS(d).slice(0, 5);
// "Kamis, 29 Oktober 2026" menurut WITA
export const tanggalPanjangRS = (d: Date): string => fmtTanggal.format(d);

// "08:00:00" -> "08:00"
export const jamPendek = (j: string) => j.slice(0, 5);

// Apakah `now` berada di antara jam_mulai dan jam_selesai (inklusif).
export function sedangPraktik(jam_mulai: string, jam_selesai: string, now: Date): boolean {
  const hhmm = jamDetikRS(now);
  return hhmm >= jam_mulai && hhmm <= jam_selesai;
}

// Inisial untuk avatar: buang gelar depan "dr."/"drg." dan gelar belakang setelah koma.
export function inisialDokter(nama: string): string {
  const kata = nama.replace(/^drg?\.?\s*/i, '').replace(/,.*$/, '').trim().split(/\s+/);
  return kata.slice(0, 2).map((k) => k[0]?.toUpperCase() ?? '').join('');
}
