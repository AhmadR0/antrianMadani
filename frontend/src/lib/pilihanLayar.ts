// Mengingat poli yang dipilih untuk TV ini, di localStorage browser TV.
// Kalau localStorage tidak tersedia (mode privat, data dibersihkan), semua fungsi
// diam-diam gagal dan dashboard tampil seperti pertama kali.

const KUNCI = 'antrian.layar.kd_poli';

export function bacaPilihanLayar(): string | null {
  try {
    return window.localStorage.getItem(KUNCI);
  } catch {
    return null;
  }
}

export function simpanPilihanLayar(kd_poli: string): void {
  try {
    window.localStorage.setItem(KUNCI, kd_poli);
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
