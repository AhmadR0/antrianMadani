import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';
import { antrianStore } from '../antrian/store';
import { formatNamaPasien, kalimatPanggilanFarmasi } from '../antrian/format';
import { buatSuara } from '../antrian/suaraNama';
import { Panggilan } from '../antrian/types';

/*
  Cara Khanza memanggil pasien ke loket penyerahan obat (DlgDaftarPermintaanResep, tombol "Penyerahan"):
    DELETE FROM antriapotek3;
    INSERT INTO antriapotek3 VALUES (no_resep, '1', no_rawat);
  Pola yang sama dengan antripoli. Poller ini mengklaim baris status '1' -> '0' lalu mengumumkannya
  ke store yang sama dengan antrian poli, dengan kd_poli khusus KD_FARMASI, sehingga layar farmasi
  berlangganan lewat SSE /antrian/events?poli=FARMASI seperti layar poli.
*/

export const KD_FARMASI = 'FARMASI';

type Baris = {
  no_resep: string;
  no_rawat: string;
  kd_poli: string | null;
  nm_poli: string | null;
  kd_dokter: string | null;
  nm_dokter: string | null;
  nm_pasien: string | null;
  tgl_registrasi: string | null;
};

const SQL_BARU = `
  SELECT a.no_resep, a.no_rawat, g.kd_poli, pk.nm_poli, g.kd_dokter, d.nm_dokter, p.nm_pasien, g.tgl_registrasi
  FROM antriapotek3 a
  LEFT JOIN reg_periksa g ON g.no_rawat = a.no_rawat
  LEFT JOIN pasien p      ON p.no_rkm_medis = g.no_rkm_medis
  LEFT JOIN poliklinik pk ON pk.kd_poli = g.kd_poli
  LEFT JOIN dokter d      ON d.kd_dokter = g.kd_dokter
  WHERE a.status = '1'`;

const SQL_KLAIM = `
  UPDATE antriapotek3 SET status = '0'
  WHERE no_resep = :no_resep AND no_rawat = :no_rawat AND status = '1'`;

const POLL_MS = Number(process.env.ANTRIAN_POLL_MS ?? 1500);
const HANYA_HARI_INI = (process.env.ANTRIAN_HANYA_HARI_INI ?? 'true') !== 'false';

let timer: NodeJS.Timeout | null = null;
let sedangJalan = false;
let sweepPertama = true;

const tanggalHariIni = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export async function pollFarmasiSekali(): Promise<number> {
  const baris = await sequelize.query<Baris>(SQL_BARU, { type: QueryTypes.SELECT });
  let diproses = 0;

  for (const b of baris) {
    const [, meta] = await sequelize.query(SQL_KLAIM, { replacements: { no_resep: b.no_resep, no_rawat: b.no_rawat } });
    const affected = meta as { affectedRows?: number } | number;
    const n = typeof affected === 'number' ? affected : affected?.affectedRows ?? 0;
    if (n === 0) continue;

    const tgl = b.tgl_registrasi ? String(b.tgl_registrasi).slice(0, 10) : null;
    const umumkan = !sweepPertama && (!HANYA_HARI_INI || tgl === tanggalHariIni());

    const p: Panggilan = {
      id: antrianStore.nextId(),
      waktu: new Date().toISOString(),
      kd_poli: KD_FARMASI,
      nm_poli: (b.nm_poli ?? '').replace(/\s+/g, ' ').trim(), // poli ASAL pasien, ditampilkan kecil di layar
      kd_dokter: b.kd_dokter ?? '-',
      nm_dokter: b.nm_dokter ?? '-',
      no_rawat: b.no_rawat,
      no_reg: b.no_resep.slice(-4),                              // 4 digit terakhir nomor resep
      nm_pasien: formatNamaPasien(b.nm_pasien),
      tgl_registrasi: tgl,
    };
    if (umumkan) p.suara_nama = await buatSuara(kalimatPanggilanFarmasi(p.nm_pasien));
    antrianStore.catat(p, umumkan);
    diproses++;
    console.log(`[farmasi] ${umumkan ? 'PANGGIL' : 'lewati (lama)'} resep ${p.no_reg} ${p.nm_pasien} (${p.no_rawat})${umumkan ? (p.suara_nama ? ' +mp3' : ' tanpa mp3') : ''}`);
  }

  sweepPertama = false;
  return diproses;
}

export function mulaiPollerFarmasi() {
  if (timer) return;
  console.log(`[farmasi] poller antriapotek3 tiap ${POLL_MS} ms`);
  timer = setInterval(async () => {
    if (sedangJalan) return;
    sedangJalan = true;
    try { await pollFarmasiSekali(); }
    catch (e) { console.error('[farmasi] poll gagal:', (e as Error).message); }
    finally { sedangJalan = false; }
  }, POLL_MS);
}

export function hentikanPollerFarmasi() {
  if (timer) { clearInterval(timer); timer = null; }
}
