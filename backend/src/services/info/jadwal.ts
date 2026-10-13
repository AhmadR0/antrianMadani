import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';

// Jadwal dokter hari ini untuk semua poli, dibaca dari tabel Khanza `jadwal` (hanya SELECT).
// Hari dihitung di server. Minggu di Khanza disebut 'AKHAD'.

export const NAMA_HARI = ['AKHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const;
export type Hari = (typeof NAMA_HARI)[number];

export type DokterJadwal = {
  kd_dokter: string;
  nm_dokter: string;
  nm_sps: string | null;   // null kalau spesialis kosong atau '-'
  jam_mulai: string;       // "08:00"
  jam_selesai: string;     // "14:30"
  jam_diatur: boolean;     // false kalau 00:00–00:00 (belum diisi di Khanza)
};

export type PoliJadwal = {
  kd_poli: string;
  nm_poli: string;
  dokter: DokterJadwal[];
};

export type InfoJadwal = {
  hari: Hari;
  tanggal: string; // "2026-10-13"
  diperbarui: string;
  jumlah_dokter: number;
  poli: PoliJadwal[];
};

type Baris = {
  kd_poli: string;
  nm_poli: string;
  kd_dokter: string;
  nm_dokter: string;
  nm_sps: string | null;
  jam_mulai: string;
  jam_selesai: string | null;
};

const SQL = `
  SELECT
    p.kd_poli, p.nm_poli,
    d.kd_dokter, d.nm_dokter, s.nm_sps,
    j.jam_mulai, j.jam_selesai
  FROM jadwal j
  JOIN dokter d     ON d.kd_dokter = j.kd_dokter AND d.status = '1'
  JOIN poliklinik p ON p.kd_poli  = j.kd_poli   AND p.status = '1'
  LEFT JOIN spesialis s ON s.kd_sps = d.kd_sps
  WHERE j.hari_kerja = ?
  ORDER BY p.nm_poli, j.jam_mulai, d.nm_dokter
`;

export function hariIni(now = new Date()): Hari {
  return NAMA_HARI[now.getDay()];
}

function tanggalLokal(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const jamPendek = (j: string | null) => (j ?? '00:00:00').slice(0, 5);

// Nama poli di Khanza kadang punya spasi ganda ("KLINIK  ANAK").
const rapikan = (s: string) => s.replace(/\s+/g, ' ').trim();

export async function ambilInfoJadwal(now = new Date()): Promise<InfoJadwal> {
  const hari = hariIni(now);
  const baris = await sequelize.query<Baris>(SQL, { type: QueryTypes.SELECT, replacements: [hari] });

  const perPoli = new Map<string, PoliJadwal>();
  let jumlahDokter = 0;

  for (const r of baris) {
    const mulai = jamPendek(r.jam_mulai);
    const selesai = jamPendek(r.jam_selesai);
    const sps = r.nm_sps?.trim();
    const dokter: DokterJadwal = {
      kd_dokter: r.kd_dokter,
      nm_dokter: rapikan(r.nm_dokter),
      nm_sps: sps && sps !== '-' ? sps : null,
      jam_mulai: mulai,
      jam_selesai: selesai,
      jam_diatur: !(mulai === '00:00' && selesai === '00:00'),
    };

    let poli = perPoli.get(r.kd_poli);
    if (!poli) {
      poli = { kd_poli: r.kd_poli, nm_poli: rapikan(r.nm_poli), dokter: [] };
      perPoli.set(r.kd_poli, poli);
    }
    poli.dokter.push(dokter);
    jumlahDokter += 1;
  }

  return {
    hari,
    tanggal: tanggalLokal(now),
    diperbarui: now.toISOString(),
    jumlah_dokter: jumlahDokter,
    poli: [...perPoli.values()],
  };
}
