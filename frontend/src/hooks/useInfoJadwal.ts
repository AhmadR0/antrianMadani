import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

const JEDA_POLLING_MS = 60_000;

export type DokterJadwal = {
  kd_dokter: string;
  nm_dokter: string;
  nm_sps: string | null;
  foto?: string;       // URL foto lengkap, kosong = avatar inisial
  jam_mulai: string;   // "08:00"
  jam_selesai: string; // "14:30"
  jam_diatur: boolean;
};
export type PoliJadwal = { kd_poli: string; nm_poli: string; dokter: DokterJadwal[] };
export type InfoJadwal = {
  hari: string;
  tanggal: string;
  diperbarui: string;
  jumlah_dokter: number;
  poli: PoliJadwal[];
};

type Status = 'memuat' | 'siap' | 'gagal';

/** Jadwal dokter hari ini dari backend, diperbarui tiap 60 detik. Data terakhir dipertahankan kalau gagal. */
export function useInfoJadwal() {
  const [data, setData] = useState<InfoJadwal | null>(null);
  const [status, setStatus] = useState<Status>('memuat');

  useEffect(() => {
    let hidup = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const ambil = async () => {
      try {
        const res = await fetch(`${API_URL}/info/jadwal`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as InfoJadwal;
        if (!hidup) return;
        // URL foto dari backend relatif ("/foto/x.jpg"); lengkapi dengan alamat backend.
        setData({
          ...json,
          poli: json.poli.map((p) => ({
            ...p,
            dokter: p.dokter.map((d) => (d.foto ? { ...d, foto: `${API_URL}${d.foto}` } : d)),
          })),
        });
        setStatus('siap');
      } catch (err) {
        if (!hidup) return;
        console.error('[info/jadwal]', err);
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
