import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

const JEDA_POLLING_MS = 30_000;

export type HitunganBed = { total: number; terisi: number; kosong: number; lainnya: number };
export type KelasBed = HitunganBed & { kelas: string };
export type BangsalBed = HitunganBed & { kd_bangsal: string; nm_bangsal: string; kelas: KelasBed[] };
export type InfoBed = { diperbarui: string; ringkasan: HitunganBed; bangsal: BangsalBed[] };

type Status = 'memuat' | 'siap' | 'gagal';

/**
 * Mengambil ketersediaan tempat tidur dari backend dan memperbaruinya tiap 30 detik.
 * Kalau satu permintaan gagal, data terakhir tetap dipakai dan status jadi "gagal"
 * supaya layar bisa memberi tanda kecil, bukan kosong.
 */
export function useInfoBed() {
  const [data, setData] = useState<InfoBed | null>(null);
  const [status, setStatus] = useState<Status>('memuat');

  useEffect(() => {
    let hidup = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const ambil = async () => {
      try {
        const res = await fetch(`${API_URL}/info/bed`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as InfoBed;
        if (!hidup) return;
        setData(json);
        setStatus('siap');
      } catch (err) {
        if (!hidup) return;
        console.error('[info/bed]', err);
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
  }, []);

  return { data, status };
}
