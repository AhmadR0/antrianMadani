import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';
import { antrianStore } from './store';
import { formatNamaPasien, kalimatPanggilan } from './format';
import { buatSuara } from './suaraNama';
import { Panggilan } from './types';

/*
  Cara Khanza memanggil pasien ke poli (DlgKasirRalan "Antrian Masuk Poli"):
    DELETE FROM antripoli WHERE kd_dokter=? AND kd_poli=?;
    INSERT INTO antripoli VALUES (kd_dokter, kd_poli, '1', no_rawat);
  Status '1' = panggilan baru yang belum dibunyikan. Layar bertugas mengembalikannya ke '0'.
  Poller ini adalah SATU-SATUNYA proses yang boleh menyentuh antripoli dari sisi web,
  supaya beberapa TV tidak saling berebut panggilan.
*/

type BarisAntripoli = {
  kd_dokter: string;
  kd_poli: string;
  no_rawat: string;
  no_reg: string | null;
  nm_pasien: string | null;
  nm_poli: string | null;
  nm_dokter: string | null;
  tgl_registrasi: string | null;
};

const SQL_PANGGILAN_BARU = `
  SELECT a.kd_dokter, a.kd_poli, a.no_rawat,
         r.no_reg, r.tgl_registrasi, p.nm_pasien, pk.nm_poli, d.nm_dokter
  FROM antripoli a
  LEFT JOIN reg_periksa r ON r.no_rawat = a.no_rawat
  LEFT JOIN pasien p      ON p.no_rkm_medis = r.no_rkm_medis
  LEFT JOIN poliklinik pk ON pk.kd_poli = a.kd_poli
  LEFT JOIN dokter d      ON d.kd_dokter = a.kd_dokter
  WHERE a.status = '1'`;

const SQL_TANDAI_SELESAI = `
  UPDATE antripoli SET status = '0'
  WHERE kd_dokter = :kd_dokter AND kd_poli = :kd_poli AND no_rawat = :no_rawat AND status = '1'`;

const POLL_MS = Number(process.env.ANTRIAN_POLL_MS ?? 1500);
// Hanya umumkan pasien yang terdaftar hari ini. Baris lama (mis. backend sempat mati)
// tetap ditandai selesai tapi tidak dibunyikan. Matikan di dev dengan ANTRIAN_HANYA_HARI_INI=false.
const HANYA_HARI_INI = (process.env.ANTRIAN_HANYA_HARI_INI ?? 'true') !== 'false';
// Poli yang nama pasiennya TIDAK boleh disebut/ditampilkan (SEMENTARA di .env; pindah ke tabel pengaturan di Langkah B).
const POLI_SAMARKAN = new Set((process.env.POLI_SAMARKAN_NAMA ?? 'U0006,U0008,U0009,U0014').split(',').map((k) => k.trim()).filter(Boolean));

let timer: NodeJS.Timeout | null = null;
let sedangJalan = false;
let sweepPertama = true;

const tanggalHariIni = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export async function pollSekali(): Promise<number> {
  const baris = await sequelize.query<BarisAntripoli>(SQL_PANGGILAN_BARU, { type: QueryTypes.SELECT });
  let diproses = 0;

  for (const b of baris) {
    // Klaim barisnya dulu. affectedRows 0 berarti sudah diambil proses lain / sudah berubah.
    const [, meta] = await sequelize.query(SQL_TANDAI_SELESAI, {
      replacements: { kd_dokter: b.kd_dokter, kd_poli: b.kd_poli, no_rawat: b.no_rawat },
    });
    const affected = (meta as { affectedRows?: number } | number) ;
    const n = typeof affected === 'number' ? affected : affected?.affectedRows ?? 0;
    if (n === 0) continue;

    const tgl = b.tgl_registrasi ? String(b.tgl_registrasi).slice(0, 10) : null;
    const hariIni = tgl === tanggalHariIni();
    // Baris yang sudah ada saat backend baru menyala dianggap sisa lama: dicatat, tidak dibunyikan.
    const umumkan = !sweepPertama && (!HANYA_HARI_INI || hariIni);

    const p: Panggilan = {
      id: antrianStore.nextId(),
      waktu: new Date().toISOString(),
      kd_poli: b.kd_poli,
      nm_poli: b.nm_poli ?? b.kd_poli,
      kd_dokter: b.kd_dokter,
      nm_dokter: b.nm_dokter ?? b.kd_dokter,
      no_rawat: b.no_rawat,
      no_reg: b.no_reg ?? '-',
      nm_pasien: formatNamaPasien(b.nm_pasien),
      tgl_registrasi: tgl,
    };
    // Suara kalimat panggilan dibuat di server (cache; menunggu paling lama ~3 detik). Hanya untuk yang diumumkan.
    if (umumkan) {
      p.suara_nama = await buatSuara(kalimatPanggilan(p.nm_pasien, p.nm_poli, !POLI_SAMARKAN.has(p.kd_poli), p.no_reg));
    }
    antrianStore.catat(p, umumkan);
    diproses++;
    console.log(`[antrian] ${umumkan ? 'PANGGIL' : 'lewati (lama)'} ${p.nm_poli} no ${p.no_reg} ${p.nm_pasien} (${p.no_rawat})${umumkan ? (p.suara_nama ? ' +mp3' : ' tanpa mp3') : ''}`);
  }

  sweepPertama = false;
  return diproses;
}

export function mulaiPoller() {
  if (timer) return;
  console.log(`[antrian] poller antripoli tiap ${POLL_MS} ms, hanya hari ini: ${HANYA_HARI_INI}`);
  timer = setInterval(async () => {
    if (sedangJalan) return; // jangan tumpuk kalau query lambat
    sedangJalan = true;
    try { await pollSekali(); }
    catch (e) { console.error('[antrian] poll gagal:', (e as Error).message); }
    finally { sedangJalan = false; }
  }, POLL_MS);
}

export function hentikanPoller() {
  if (timer) { clearInterval(timer); timer = null; }
}
