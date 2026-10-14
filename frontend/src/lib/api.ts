// Alamat backend.
// - Kalau VITE_API_URL diisi (mis. di produksi), itu yang dipakai.
// - Kalau kosong, ditebak dari alamat halaman yang sedang dibuka: host yang sama, port 8000.
//   Dengan begitu TV yang membuka http://10.30.3.90:5173 otomatis memakai http://10.30.3.90:8000,
//   tanpa perlu mengubah .env tiap IP laptop/server berubah.

const PORT_BACKEND = 8000;

function tebakApiUrl(): string {
  const dariEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (dariEnv) return dariEnv.replace(/\/+$/, '');
  if (typeof window === 'undefined') return `http://localhost:${PORT_BACKEND}`;
  return `${window.location.protocol}//${window.location.hostname}:${PORT_BACKEND}`;
}

export const API_URL = tebakApiUrl();
