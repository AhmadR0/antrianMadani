import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import dokteRoutes from '../src/routes/dokterRoutes'
import tesApiRoutes from '../src/routes/tesORMRoutes'
import antrianRoutes from './routes/antrianRoutes'
import infoRoutes from './routes/infoRoutes'
import { FOTO_PEGAWAI_DIR } from './services/antrian/dokter'
import { sequelize } from './config/databases'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.use("/getDokter",dokteRoutes)
app.use('/tesApi',tesApiRoutes)
app.use('/antrian', antrianRoutes)
app.use('/info', infoRoutes)
// Untuk healthcheck Docker / pemantauan: 200 kalau proses hidup dan database bisa dijawab.
app.get('/health', async (_req, res) => {
  try {
    await sequelize.query('SELECT 1')
    res.json({ status: 'ok', waktu: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'database tidak terjangkau' })
  }
})
// Foto pegawai Khanza (folder diatur lewat FOTO_PEGAWAI_DIR di .env), hanya dibaca
app.use('/foto', express.static(FOTO_PEGAWAI_DIR, { maxAge: '1h', index: false }))

export default app;