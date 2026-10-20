import { useEffect, useState } from 'react';
import type { DokterBertugas, DokterPerPoli } from '../types/antrian';
import { API_URL } from '../lib/api';

const JEDA_POLLING_MS = 5 * 60_000;

/**
 * Dokter yang bertugas hari ini di satu atau beberapa poli, dari GET /antrian/dokter?poli=a,b.
 * Hasil diindeks per kd_poli. Diperbarui tiap 5 menit supaya perubahan jadwal di Khanza dan
 * pergantian hari ikut terbaca. URL foto dari backend relatif ("/foto/x.jpg"); dilengkapi di sini.
 */
export function useDokterBertugas(daftarPoli: string[]) {
  const [dokter, setDokter] = useState<Record<string, DokterBertugas[]>>({});
  const kunci = daftarPoli.join(',');

  useEffect(() => {
    let hidup = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const ambil = async () => {
      try {
        const res = await fetch(`${API_URL}/antrian/dokter?poli=${encodeURIComponent(kunci)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as DokterPerPoli;
        if (!hidup) return;
        setDokter(Object.fromEntries(json.poli.map((p) => [
          p.kd_poli,
          p.dokter.map((d) => (d.foto ? { ...d, foto: `${API_URL}${d.foto}` } : d)),
        ])));
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
  }, [kunci]);

  return dokter;
}
