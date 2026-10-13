import { useEffect, useState } from 'react';
import type { DokterBertugas } from '../types/antrian';

const API_URL = import.meta.env.VITE_API_URL;
const JEDA_POLLING_MS = 5 * 60_000;

/**
 * Dokter yang bertugas hari ini di satu poli, dari GET /antrian/dokter?poli=.
 * Diperbarui tiap 5 menit supaya perubahan jadwal di Khanza dan pergantian hari ikut terbaca.
 * URL foto dari backend bersifat relatif ("/foto/x.jpg"); di sini dilengkapi dengan alamat backend.
 */
export function useDokterBertugas(kd_poli: string) {
  const [dokter, setDokter] = useState<DokterBertugas[]>([]);

  useEffect(() => {
    let hidup = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const ambil = async () => {
      try {
        const res = await fetch(`${API_URL}/antrian/dokter?poli=${encodeURIComponent(kd_poli)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DokterBertugas[];
        if (!hidup) return;
        setDokter(json.map((d) => (d.foto ? { ...d, foto: `${API_URL}${d.foto}` } : d)));
      } catch (err) {
        console.error('[antrian/dokter]', err);
      } finally {
        if (hidup) timer = setTimeout(ambil, JEDA_POLLING_MS);
      }
    };

    ambil();
    return () => {
      hidup = false;
      if (timer) clearTimeout(timer);
    };
  }, [kd_poli]);

  return dokter;
}
