import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';

// Ketersediaan tempat tidur, dibaca langsung dari tabel Khanza `kamar` + `bangsal` (hanya SELECT).
// Status kamar di Khanza: ISI, KOSONG, DIBERSIHKAN, DIBOOKING.
// Kami laporkan tiga angka: terisi (ISI), kosong (KOSONG), lainnya (DIBERSIHKAN + DIBOOKING),
// sehingga terisi + kosong + lainnya = total.

export type HitunganBed = {
  total: number;
  terisi: number;
  kosong: number;
  lainnya: number;
};

export type KelasBed = HitunganBed & { kelas: string };

export type BangsalBed = HitunganBed & {
  kd_bangsal: string;
  nm_bangsal: string;
  kelas: KelasBed[];
};

export type InfoBed = {
  diperbarui: string;
  ringkasan: HitunganBed;
  bangsal: BangsalBed[];
};

type Baris = {
  kd_bangsal: string;
  nm_bangsal: string;
  kelas: string | null;
  total: number | string;
  terisi: number | string;
  kosong: number | string;
  lainnya: number | string;
};

const SQL = `
  SELECT
    b.kd_bangsal,
    b.nm_bangsal,
    k.kelas,
    COUNT(k.kd_kamar)                 AS total,
    SUM(k.status = 'ISI')             AS terisi,
    SUM(k.status = 'KOSONG')          AS kosong,
    SUM(k.status NOT IN ('ISI','KOSONG')) AS lainnya
  FROM kamar k
  JOIN bangsal b ON b.kd_bangsal = k.kd_bangsal
  WHERE k.statusdata = '1' AND b.status = '1'
  GROUP BY b.kd_bangsal, b.nm_bangsal, k.kelas
  ORDER BY b.nm_bangsal, k.kelas
`;

const hitunganKosong = (): HitunganBed => ({ total: 0, terisi: 0, kosong: 0, lainnya: 0 });

function tambah(ke: HitunganBed, dari: HitunganBed) {
  ke.total += dari.total;
  ke.terisi += dari.terisi;
  ke.kosong += dari.kosong;
  ke.lainnya += dari.lainnya;
}

export async function ambilInfoBed(): Promise<InfoBed> {
  const baris = await sequelize.query<Baris>(SQL, { type: QueryTypes.SELECT });

  const ringkasan = hitunganKosong();
  const perBangsal = new Map<string, BangsalBed>();

  for (const r of baris) {
    const kelas: KelasBed = {
      kelas: r.kelas ?? 'Tanpa Kelas',
      total: Number(r.total),
      terisi: Number(r.terisi),
      kosong: Number(r.kosong),
      lainnya: Number(r.lainnya),
    };

    let bangsal = perBangsal.get(r.kd_bangsal);
    if (!bangsal) {
      bangsal = { kd_bangsal: r.kd_bangsal, nm_bangsal: r.nm_bangsal.trim(), ...hitunganKosong(), kelas: [] };
      perBangsal.set(r.kd_bangsal, bangsal);
    }
    bangsal.kelas.push(kelas);
    tambah(bangsal, kelas);
    tambah(ringkasan, kelas);
  }

  return { diperbarui: new Date().toISOString(), ringkasan, bangsal: [...perBangsal.values()] };
}
