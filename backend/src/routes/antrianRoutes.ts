import express, { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/databases';
import { displays, findDisplay } from '../config/displays';
import { antrianStore } from '../services/antrian/store';
import { Panggilan } from '../services/antrian/types';

const route = express.Router();

const ambilDisplay = (req: Request, res: Response) => {
  const id = Number(req.query.display ?? req.params.id);
  const d = findDisplay(id);
  if (!d) { res.status(404).json({ error: `display ${id} tidak dikenal` }); return null; }
  return d;
};

// Daftar layar dan polinya
route.get('/displays', (_req, res) => { res.json(displays); });
route.get('/displays/:id', (req, res) => { const d = ambilDisplay(req, res); if (d) res.json(d); });

// Keadaan saat ini: panggilan terakhir per poli + riwayat, untuk saat TV baru dibuka
route.get('/state', (req, res) => {
  const d = ambilDisplay(req, res); if (!d) return;
  res.json({ display: d, terakhir: antrianStore.terakhir(d.poli), riwayat: antrianStore.riwayatUntuk(d.poli) });
});

// Server-Sent Events: TV membuka satu koneksi dan menerima event "panggil"
route.get('/events', (req, res) => {
  const d = ambilDisplay(req, res); if (!d) return;
  const poliSet = new Set(d.poli);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const kirim = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  kirim('state', { display: d, terakhir: antrianStore.terakhir(d.poli) });

  const onPanggil = (p: Panggilan) => { if (poliSet.has(p.kd_poli)) kirim('panggil', p); };
  antrianStore.on('panggil', onPanggil);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 20000);

  req.on('close', () => {
    antrianStore.off('panggil', onPanggil);
    clearInterval(heartbeat);
  });
});

// Simulasi klik "Antrian Masuk Poli" di Khanza, untuk pengembangan tanpa membuka Khanza.
// Body: { kd_poli, kd_dokter?, no_rawat? }. Kalau no_rawat kosong, dipilih registrasi terbaru di poli itu.
route.post('/simulasi/panggil', async (req, res) => {
  const { kd_poli, kd_dokter, no_rawat } = req.body as { kd_poli?: string; kd_dokter?: string; no_rawat?: string };
  if (!kd_poli) { res.status(400).json({ error: 'kd_poli wajib' }); return; }
  try {
    let noRawat = no_rawat, kdDokter = kd_dokter;
    if (!noRawat || !kdDokter) {
      const [r] = await sequelize.query<{ no_rawat: string; kd_dokter: string }>(
        // JOIN pasien: dump madaniDev tidak lengkap, sebagian registrasi tidak punya data pasien.
        `SELECT r.no_rawat, r.kd_dokter FROM reg_periksa r
         JOIN pasien p ON p.no_rkm_medis = r.no_rkm_medis
         WHERE r.kd_poli = :kd_poli ${kdDokter ? 'AND r.kd_dokter = :kd_dokter' : ''}
         ORDER BY r.tgl_registrasi DESC, r.jam_reg DESC LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { kd_poli, kd_dokter: kdDokter } });
      if (!r) { res.status(404).json({ error: `tidak ada registrasi untuk poli ${kd_poli}` }); return; }
      noRawat = noRawat ?? r.no_rawat; kdDokter = kdDokter ?? r.kd_dokter;
    }
    // Persis seperti DlgKasirRalan.java
    await sequelize.query(`DELETE FROM antripoli WHERE kd_dokter = :kd_dokter AND kd_poli = :kd_poli`,
      { replacements: { kd_dokter: kdDokter, kd_poli } });
    await sequelize.query(`INSERT INTO antripoli (kd_dokter, kd_poli, status, no_rawat) VALUES (:kd_dokter, :kd_poli, '1', :no_rawat)`,
      { replacements: { kd_dokter: kdDokter, kd_poli, no_rawat: noRawat } });
    res.json({ ok: true, kd_poli, kd_dokter: kdDokter, no_rawat: noRawat });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'simulasi gagal', detail: (e as Error).message });
  }
});

export default route;
