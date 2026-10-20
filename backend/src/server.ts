import app from './app';
import { sequelize } from './config/databases';
import { hentikanPoller, mulaiPoller } from './services/antrian/poller';
import { mulaiPembersihCache } from './services/antrian/suaraNama';

const PORT = Number(process.env.PORT || 8000);

// Urutan penting: poller antripoli HANYA boleh jalan kalau port HTTP berhasil dibuka.
// Kalau tidak, proses kedua yang gagal membuka port tetap mengklaim baris antripoli dan
// mengumumkannya ke store miliknya sendiri yang tidak punya koneksi TV: panggilan hilang diam-diam.
// Semua kegagalan fatal -> process.exit(1), supaya nodemon/pm2/Docker merestart dan terlihat di log.
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database terhubung');
  } catch (error) {
    console.error('Database tidak terhubung:', (error as Error).message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    mulaiPoller();
    mulaiPembersihCache();
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} sudah dipakai proses lain. Backend ini berhenti supaya tidak ada dua poller antripoli.`);
    } else {
      console.error('Gagal membuka port:', err.message);
    }
    process.exit(1);
  });

  // Dimatikan rapi (Ctrl+C, systemd/docker stop): hentikan poller dulu, lalu tutup port.
  let sedangBerhenti = false;
  const berhenti = (sinyal: string) => {
    if (sedangBerhenti) return;
    sedangBerhenti = true;
    console.log(`Menerima ${sinyal}, backend berhenti`);
    hentikanPoller();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref(); // koneksi SSE yang masih terbuka jangan menahan
  };
  process.on('SIGINT', () => berhenti('SIGINT'));
  process.on('SIGTERM', () => berhenti('SIGTERM'));
}

startServer();
