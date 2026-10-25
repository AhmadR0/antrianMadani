import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';

// Daftar tunggu farmasi rawat jalan hari ini, dari tabel Khanza `resep_obat` (hanya SELECT).
// Resep dianggap masih menunggu kalau belum diserahkan (jam_penyerahan 00:00:00).
// Status "Sedang disiapkan" = resep sudah divalidasi apoteker (resep_obat.jam terisi); sebelum itu "Menunggu".
// Racikan ditentukan dari resep_dokter_racikan, seperti aplikasi lama.

export type ResepTunggu = {
  no_resep: string;       // nomor lengkap, mis. 202606120445
  kode: string;           // 4 digit terakhir yang dibaca pasien, mis. 0445
  nm_pasien: string;      // nama ASLI; penyamaran dilakukan di layar
  nm_poli: string;
  jam_peresepan: string;  // "07:32"
  disiapkan: boolean;     // sudah divalidasi
  menit_menunggu: number; // sejak jam peresepan
};

export type AntrianFarmasi = {
  tanggal: string;
  diperbarui: string;
  nonRacikan: ResepTunggu[];
  racikan: ResepTunggu[];
};

type Baris = {
  no_resep: string;
  jam_peresepan: string;
  jam: string;
  nm_pasien: string | null;
  nm_poli: string | null;
  racikan: number;
};

const SQL = `
  SELECT r.no_resep, r.jam_peresepan, r.jam, p.nm_pasien, pk.nm_poli,
         EXISTS(SELECT 1 FROM resep_dokter_racikan k WHERE k.no_resep = r.no_resep) AS racikan
  FROM resep_obat r
  JOIN reg_periksa g ON g.no_rawat = r.no_rawat
  LEFT JOIN pasien p     ON p.no_rkm_medis = g.no_rkm_medis
  LEFT JOIN poliklinik pk ON pk.kd_poli = g.kd_poli
  WHERE r.status = 'ralan'
    AND r.tgl_peresepan = :tanggal
    AND r.jam_peresepan <> '00:00:00'
    AND r.jam_penyerahan = '00:00:00'
  ORDER BY r.jam_peresepan ASC
`;

const tanggalLokal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const menitSejak = (tanggal: string, jam: string, now: Date) => {
  const t = new Date(`${tanggal}T${jam}`);
  return Math.max(0, Math.round((now.getTime() - t.getTime()) / 60000));
};

export async function ambilAntrianFarmasi(tanggal?: string, now = new Date()): Promise<AntrianFarmasi> {
  const tgl = tanggal ?? tanggalLokal(now);
  const baris = await sequelize.query<Baris>(SQL, { type: QueryTypes.SELECT, replacements: { tanggal: tgl } });

  const nonRacikan: ResepTunggu[] = [];
  const racikan: ResepTunggu[] = [];
  for (const b of baris) {
    const item: ResepTunggu = {
      no_resep: b.no_resep,
      kode: b.no_resep.slice(-4),
      nm_pasien: (b.nm_pasien ?? '-').replace(/\s+/g, ' ').trim(),
      nm_poli: (b.nm_poli ?? '').replace(/\s+/g, ' ').trim(),
      jam_peresepan: b.jam_peresepan.slice(0, 5),
      disiapkan: b.jam !== '00:00:00',
      menit_menunggu: menitSejak(tgl, b.jam_peresepan, now),
    };
    (Number(b.racikan) ? racikan : nonRacikan).push(item);
  }
  return { tanggal: tgl, diperbarui: now.toISOString(), nonRacikan, racikan };
}
