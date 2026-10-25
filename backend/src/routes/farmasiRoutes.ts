import express from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/databases';
import { ambilAntrianFarmasi, type AntrianFarmasi } from '../services/farmasi/antrian';

// Layar farmasi. Panggilan datang lewat SSE /antrian/events?poli=FARMASI (lihat services/farmasi/poller.ts);
// di sini hanya daftar tunggu dan simulasi untuk pengembangan.

const route = express.Router();
const UMUR_CACHE_MS = 5_000;
const produksi = () => process.env.NODE_ENV === 'production';

let cache: { kunci: string; data: AntrianFarmasi; kadaluarsa: number } | null = null;

// Daftar tunggu hari ini. Di luar produksi boleh ?tanggal=YYYY-MM-DD untuk mencoba dengan data lama.
route.get('/antrian', async (req, res) => {
  const tanggal = !produksi() && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.tanggal ?? '')) ? String(req.query.tanggal) : undefined;
  const kunci = tanggal ?? 'hari-ini';
  try {
    if (!cache || cache.kunci !== kunci || Date.now() > cache.kadaluarsa) {
      cache = { kunci, data: await ambilAntrianFarmasi(tanggal), kadaluarsa: Date.now() + UMUR_CACHE_MS };
    }
    res.json(cache.data);
  } catch (e) {
    console.error('[farmasi/antrian]', e);
    res.status(500).json({ error: 'gagal mengambil antrian farmasi' });
  }
});

// Simulasi tombol "Penyerahan" di Khanza: menulis antriapotek3 persis seperti DlgDaftarPermintaanResep.
// Body: { no_resep? , tanggal? }. Tanpa no_resep: dipilih resep ralan terbaru (pada tanggal itu kalau diberi).
// HANYA di luar produksi.
route.post('/simulasi/panggil', async (req, res) => {
  if (produksi()) { res.status(404).json({ error: 'tidak tersedia di produksi' }); return; }
  const { no_resep, tanggal } = req.body as { no_resep?: string; tanggal?: string };
  try {
    const [r] = await sequelize.query<{ no_resep: string; no_rawat: string }>(
      `SELECT r.no_resep, r.no_rawat FROM resep_obat r
       JOIN reg_periksa g ON g.no_rawat = r.no_rawat
       JOIN pasien p ON p.no_rkm_medis = g.no_rkm_medis
       WHERE r.status = 'ralan'
         ${no_resep ? 'AND r.no_resep = :no_resep' : ''}
         ${tanggal ? 'AND r.tgl_peresepan = :tanggal' : ''}
       ORDER BY r.tgl_peresepan DESC, r.jam_peresepan DESC LIMIT 1`,
      { type: QueryTypes.SELECT, replacements: { no_resep, tanggal } });
    if (!r) { res.status(404).json({ error: 'tidak ada resep yang cocok' }); return; }
    await sequelize.query('DELETE FROM antriapotek3');
    await sequelize.query('INSERT INTO antriapotek3 (no_resep, status, no_rawat) VALUES (:no_resep, \'1\', :no_rawat)',
      { replacements: { no_resep: r.no_resep, no_rawat: r.no_rawat } });
    res.json({ ok: true, ...r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'simulasi gagal', detail: (e as Error).message });
  }
});

export default route;
