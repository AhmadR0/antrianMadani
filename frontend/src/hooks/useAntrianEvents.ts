import { useEffect, useRef, useState } from 'react';
import type { KeadaanAntrian, Panggilan } from '../types/antrian';
import { API_URL } from '../lib/api';

export type StatusKoneksi = 'menghubungkan' | 'terhubung' | 'terputus';

/**
 * Berlangganan panggilan satu poli lewat Server-Sent Events.
 * - `keadaan`: panggilan terakhir + riwayat poli, dikirim backend setiap koneksi (ulang) dibuka.
 * - `onPanggil`: dipanggil untuk tiap panggilan baru yang masuk.
 * EventSource otomatis menyambung ulang kalau koneksi putus; backend lalu mengirim `state` lagi,
 * sehingga panggilan yang terlewat selama putus tetap tampil (tanpa dibunyikan).
 */
export function useAntrianEvents(kd_poli: string, onPanggil: (p: Panggilan) => void) {
  const [keadaan, setKeadaan] = useState<KeadaanAntrian | null>(null);
  const [status, setStatus] = useState<StatusKoneksi>('menghubungkan');
  const onPanggilRef = useRef(onPanggil);
  onPanggilRef.current = onPanggil;

  useEffect(() => {
    const es = new EventSource(`${API_URL}/antrian/events?poli=${encodeURIComponent(kd_poli)}`);
    es.onopen = () => setStatus('terhubung');
    es.onerror = () => setStatus('terputus');
    es.addEventListener('state', (e) => {
      setKeadaan(JSON.parse((e as MessageEvent).data) as KeadaanAntrian);
    });
    es.addEventListener('panggil', (e) => {
      const p = JSON.parse((e as MessageEvent).data) as Panggilan;
      setKeadaan((k) => ({ kd_poli, terakhir: p, riwayat: [p, ...(k?.riwayat ?? [])].slice(0, 10) }));
      onPanggilRef.current(p);
    });
    return () => es.close();
  }, [kd_poli]);

  return { keadaan, status };
}
