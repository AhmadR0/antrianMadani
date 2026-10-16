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

// ---------- Pengaturan per TV (sementara di localStorage; nanti pindah ke halaman admin) ----------
// video: tampilkan kolom video & iklan. suaraVideo: video bersuara (false = bisu, mis. dua TV berhadapan).

export type PengaturanTv = { video: boolean; suaraVideo: boolean };

const KUNCI_TV = 'antrian.layar.tv';
const BAWAAN_TV: PengaturanTv = { video: true, suaraVideo: true };

export function bacaPengaturanTv(): PengaturanTv {
  try {
    const mentah = window.localStorage.getItem(KUNCI_TV);
    if (!mentah) return { ...BAWAAN_TV };
    const obj = JSON.parse(mentah) as Partial<PengaturanTv>;
    return { video: obj.video ?? true, suaraVideo: obj.suaraVideo ?? true };
  } catch {
    return { ...BAWAAN_TV };
  }
}

export function simpanPengaturanTv(p: PengaturanTv): void {
  try {
    window.localStorage.setItem(KUNCI_TV, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}
