import { useEffect, useState } from 'react';
import type { AntrianFarmasi } from '../types/antrian';
import { API_URL } from '../lib/api';

const JEDA_POLLING_MS = 5_000;

type Status = 'memuat' | 'siap' | 'gagal';

/**
 * Daftar tunggu farmasi (non racikan & racikan) dari GET /farmasi/antrian, diperbarui tiap 5 detik.
 * `tanggal` hanya untuk pengembangan (backend mengabaikannya di produksi).
 */
export function useAntrianFarmasi(tanggal?: string) {
  const [data, setData] = useState<AntrianFarmasi | null>(null);
  const [status, setStatus] = useState<Status>('memuat');

  useEffect(() => {
    let hidup = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = `${API_URL}/farmasi/antrian${tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : ''}`;

    const ambil = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as AntrianFarmasi;
        if (!hidup) return;
        setData(json);
        setStatus('siap');
      } catch (err) {
        if (!hidup) return;
        console.error('[farmasi/antrian]', err);
        setStatus('gagal');
      } finally {
        if (hidup) timer = setTimeout(ambil, JEDA_POLLING_MS);
      }
    };

    ambil();
    return () => {
      hidup = false;
      if (timer) clearTimeout(timer);
    };
  }, [tanggal]);

  return { data, status };
}
