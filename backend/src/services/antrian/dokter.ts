import fs from 'fs';
import path from 'path';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/databases';
import { hariIni } from '../info/jadwal';

// Dokter yang bertugas HARI INI di satu poli, dari tabel Khanza `jadwal` (hanya SELECT).
// Foto diambil dari tabel `pegawai` (kolom photo, mis. "pages/pegawai/photo/alfrida.jpg");
// file-nya ada di folder foto Khanza (FOTO_PEGAWAI_DIR di .env) dan disajikan backend lewat /foto/<nama file>.
// Kalau file-nya tidak ada di disk, foto tidak dikirim supaya TV menampilkan avatar inisial, bukan gambar rusak.

export type DokterBertugas = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;   // "08:00:00"
  jam_selesai: string; // "14:30:59"
  foto?: string;       // path URL relatif ke backend, mis. "/foto/alfrida.jpg"
};

// Folder foto pegawai Khanza: webapps/penggajian/pages/pegawai/photo
export const FOTO_PEGAWAI_DIR =
  process.env.FOTO_PEGAWAI_DIR ?? path.resolve(process.cwd(), '../../../Dekstop/KhanzaHMSLinux20240201/webapps/penggajian/pages/pegawai/photo');

type Baris = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;
  jam_selesai: string | null;
  photo: string | null;
};

const SQL = `
  SELECT d.kd_dokter, d.nm_dokter, j.jam_mulai, j.jam_selesai, pg.photo
  FROM jadwal j
  JOIN dokter d ON d.kd_dokter = j.kd_dokter AND d.status = '1'
  LEFT JOIN pegawai pg ON pg.nik = d.kd_dokter
  WHERE j.kd_poli = :kd_poli AND j.hari_kerja = :hari
  ORDER BY j.jam_mulai, d.nm_dokter
`;

function urlFoto(photo: string | null): string | undefined {
  const nama = path.basename((photo ?? '').trim());
  if (!nama || nama === '.' || nama === 'photo') return undefined;
  try {
    if (!fs.existsSync(path.join(FOTO_PEGAWAI_DIR, nama))) return undefined;
  } catch {
    return undefined;
  }
  return `/foto/${encodeURIComponent(nama)}`;
}

export async function ambilDokterBertugas(kd_poli: string, now = new Date()): Promise<DokterBertugas[]> {
  const baris = await sequelize.query<Baris>(SQL, {
    type: QueryTypes.SELECT,
    replacements: { kd_poli, hari: hariIni(now) },
  });
  return baris.map((b) => ({
    kd_dokter: b.kd_dokter,
    nm_dokter: b.nm_dokter.replace(/\s+/g, ' ').trim(),
    jam_mulai: b.jam_mulai,
    jam_selesai: b.jam_selesai ?? '00:00:00',
    foto: urlFoto(b.photo),
  }));
}
