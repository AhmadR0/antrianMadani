// Alamat backend, dipilih dari VITE_API_URL saat build:
// - "/"  (atau "same-origin"): backend di ORIGIN YANG SAMA dengan halaman, tanpa port tambahan.
//        Dipakai di produksi: nginx melayani frontend di satu port (mis. 8087) dan mem-proxy
//        /antrian, /info, /foto, /suara-nama, /health ke backend. API_URL jadi "" sehingga semua
//        permintaan relatif ("/antrian/events"), termasuk SSE dan URL foto/MP3 dari backend.
// - alamat penuh (mis. http://10.30.3.90:8000): backend di host/port lain.
// - kosong: ditebak dari host halaman yang dibuka, port 8000. Praktis saat dev dengan `vite --host`:
//        TV yang membuka http://10.30.3.90:5173 otomatis memakai http://10.30.3.90:8000.

const PORT_BACKEND = 8000;

function tebakApiUrl(): string {
  const dariEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';
  if (dariEnv === '/' || dariEnv.toLowerCase() === 'same-origin') return '';
  if (dariEnv) return dariEnv.replace(/\/+$/, '');
  if (typeof window === 'undefined') return `http://localhost:${PORT_BACKEND}`;
  return `${window.location.protocol}//${window.location.hostname}:${PORT_BACKEND}`;
}

// "" berarti origin yang sama; selalu dipakai sebagai awalan path: `${API_URL}/antrian/state`.
export const API_URL = tebakApiUrl();
