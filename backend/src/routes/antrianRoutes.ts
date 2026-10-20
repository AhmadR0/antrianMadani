import express, { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/databases';
import { antrianStore } from '../services/antrian/store';
import { ambilDokterBertugas } from '../services/antrian/dokter';
import { Panggilan } from '../services/antrian/types';

// Satu layar TV melayani satu atau beberapa poli (layar koridor, maks MAKS_POLI).
// Semua endpoint di sini menerima ?poli=U0003 atau ?poli=U0004,U0005,U0011.

const route = express.Router();
const POLA_KD_POLI = /^[A-Za-z0-9]{1,5}$/;
const MAKS_POLI = 3;

const ambilDaftarPoli = (req: Request, res: Response): string[] | null => {
  const daftar = [...new Set(String(req.query.poli ?? '').split(',').map((k) => k.trim()).filter(Boolean))];
  if (daftar.length === 0 || daftar.some((k) => !POLA_KD_POLI.test(k))) {
    res.status(400).json({ error: 'parameter poli (kd_poli, boleh beberapa dipisah koma) wajib' }); return null;
  }
  if (daftar.length > MAKS_POLI) { res.status(400).json({ error: `maksimal ${MAKS_POLI} poli per layar` }); return null; }
  return daftar;
};

const keadaanPoli = (kd_poli: string) => ({
  kd_poli,
  terakhir: antrianStore.terakhir(kd_poli),
  riwayat: antrianStore.riwayatUntuk(kd_poli),
});
const keadaan = (daftar: string[]) => ({ poli: daftar.map(keadaanPoli) });

// Keadaan saat ini: panggilan terakhir + riwayat tiap poli, untuk saat TV baru dibuka
route.get('/state', (req, res) => {
  const daftar = ambilDaftarPoli(req, res); if (!daftar) return;
  res.json(keadaan(daftar));
});

// Dokter yang bertugas hari ini di tiap poli (jadwal Khanza + foto pegawai)
route.get('/dokter', async (req, res) => {
  const daftar = ambilDaftarPoli(req, res); if (!daftar) return;
  try {
    const hasil = await Promise.all(daftar.map(async (kd_poli) => ({ kd_poli, dokter: await ambilDokterBertugas(kd_poli) })));
    res.json({ poli: hasil });
  } catch (e) {
    console.error('[antrian/dokter]', e);
    res.status(500).json({ error: 'gagal mengambil dokter bertugas' });
  }
});

// Server-Sent Events: TV membuka satu koneksi dan menerima event "state" lalu "panggil"
route.get('/events', (req, res) => {
  const daftar = ambilDaftarPoli(req, res); if (!daftar) return;
  const poliSet = new Set(daftar);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const kirim = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  kirim('state', keadaan(daftar));

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
// HANYA di luar produksi: endpoint ini MENULIS ke antripoli Khanza. Di NODE_ENV=production dijawab 404.
route.post('/simulasi/panggil', async (req, res) => {
  if (process.env.NODE_ENV === 'production') { res.status(404).json({ error: 'tidak tersedia di produksi' }); return; }
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
