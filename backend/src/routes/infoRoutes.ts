import express, { Request, Response } from 'express';
import { ambilInfoBed } from '../services/info/bed';
import { ambilInfoJadwal } from '../services/info/jadwal';

// Layar informasi (bukan antrian): tempat tidur dan jadwal dokter.
// Hasil dicache sebentar di memori supaya banyak TV yang polling tidak membebani database Khanza.

const route = express.Router();

type Cache<T> = { data: T; kadaluarsa: number } | null;

// Membuat handler GET yang membungkus pengambil data dengan cache berumur `umurMs`.
function denganCache<T>(nama: string, umurMs: number, ambil: () => Promise<T>) {
  let cache: Cache<T> = null;
  return async (_req: Request, res: Response) => {
    try {
      if (!cache || Date.now() > cache.kadaluarsa) {
        cache = { data: await ambil(), kadaluarsa: Date.now() + umurMs };
      }
      res.json(cache.data);
    } catch (err) {
      console.error(`[info/${nama}]`, err);
      res.status(500).json({ error: `gagal mengambil data ${nama}` });
    }
  };
}

route.get('/bed', denganCache('bed', 10_000, ambilInfoBed));
route.get('/jadwal', denganCache('jadwal', 60_000, () => ambilInfoJadwal()));

export default route;
