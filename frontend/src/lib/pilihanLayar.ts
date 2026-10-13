// Mengingat layar yang dipilih untuk TV ini, di localStorage browser TV.
// Nilai yang disimpan adalah path layar tanpa garis miring depan, misalnya
// "display/U0003" (layar antrian poli) atau "info/bed" (layar informasi tempat tidur).
// Versi awal hanya menyimpan kd_poli ("U0003"); nilai lama itu tetap dikenali.
// Kalau localStorage tidak tersedia (mode privat, data dibersihkan), semua fungsi
// diam-diam gagal dan dashboard tampil seperti pertama kali.

const KUNCI = 'antrian.layar.kd_poli';

export function bacaPilihanLayar(): string | null {
  try {
    const nilai = window.localStorage.getItem(KUNCI);
    if (!nilai) return null;
    return nilai.includes('/') ? nilai : `display/${nilai}`;
  } catch {
    return null;
  }
}

export function simpanPilihanLayar(path: string): void {
  try {
    window.localStorage.setItem(KUNCI, path.replace(/^\//, ''));
  } catch {
    /* abaikan */
  }
}

export function hapusPilihanLayar(): void {
  try {
    window.localStorage.removeItem(KUNCI);
  } catch {
    /* abaikan */
  }
}
