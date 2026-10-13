// Pembantu jam praktik, dipakai layar antrian poli dan layar jadwal dokter.
// Semua jam berupa string "HH:MM" atau "HH:MM:SS" dari Khanza; dibandingkan sebagai teks.

// "08:00:00" -> "08:00"
export const jamPendek = (j: string) => j.slice(0, 5);

// Apakah `now` berada di antara jam_mulai dan jam_selesai (inklusif).
export function sedangPraktik(jam_mulai: string, jam_selesai: string, now: Date): boolean {
  const hhmm = now.toTimeString().slice(0, 8);
  return hhmm >= jam_mulai && hhmm <= jam_selesai;
}

// Inisial untuk avatar: buang gelar depan "dr."/"drg." dan gelar belakang setelah koma.
export function inisialDokter(nama: string): string {
  const kata = nama.replace(/^drg?\.?\s*/i, '').replace(/,.*$/, '').trim().split(/\s+/);
  return kata.slice(0, 2).map((k) => k[0]?.toUpperCase() ?? '').join('');
}
