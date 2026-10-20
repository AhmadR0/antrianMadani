import { useEffect, useRef, useState } from 'react';
import type { KeadaanAntrian, KeadaanPoli, Panggilan } from '../types/antrian';
import { API_URL } from '../lib/api';

export type StatusKoneksi = 'menghubungkan' | 'terhubung' | 'terputus';

/**
 * Berlangganan panggilan satu atau beberapa poli lewat Server-Sent Events.
 * - `keadaan`: per kd_poli, panggilan terakhir + riwayat; dikirim backend setiap koneksi (ulang) dibuka.
 * - `onPanggil`: dipanggil untuk tiap panggilan baru yang masuk (poli mana pun dalam daftar).
 * EventSource otomatis menyambung ulang kalau koneksi putus; backend lalu mengirim `state` lagi,
 * sehingga panggilan yang terlewat selama putus tetap tampil (tanpa dibunyikan).
 */
export function useAntrianEvents(daftarPoli: string[], onPanggil: (p: Panggilan) => void) {
  const [keadaan, setKeadaan] = useState<Record<string, KeadaanPoli>>({});
  const [status, setStatus] = useState<StatusKoneksi>('menghubungkan');
  const onPanggilRef = useRef(onPanggil);
  onPanggilRef.current = onPanggil;
  const kunci = daftarPoli.join(','); // dependensi effect: string, bukan array baru tiap render

  useEffect(() => {
    const es = new EventSource(`${API_URL}/antrian/events?poli=${encodeURIComponent(kunci)}`);
    es.onopen = () => setStatus('terhubung');
    es.onerror = () => setStatus('terputus');
    es.addEventListener('state', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as KeadaanAntrian;
      setKeadaan(Object.fromEntries(data.poli.map((k) => [k.kd_poli, k])));
    });
    es.addEventListener('panggil', (e) => {
      const p = JSON.parse((e as MessageEvent).data) as Panggilan;
      setKeadaan((k) => {
        const lama = k[p.kd_poli];
        return { ...k, [p.kd_poli]: { kd_poli: p.kd_poli, terakhir: p, riwayat: [p, ...(lama?.riwayat ?? [])].slice(0, 10) } };
      });
      onPanggilRef.current(p);
    });
    return () => es.close();
  }, [kunci]);

  return { keadaan, status };
}
