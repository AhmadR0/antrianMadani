// DATA CONTOH untuk review tampilan layar antrian. Dihapus saat backend tersambung.
import type { Panggilan } from '../types/antrian';

export type DokterBertugas = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;   // "08:00:00"
  jam_selesai: string; // "14:30:59"
  foto?: string;       // URL foto; kosong = avatar inisial
};

export function contohDokter(kd_poli: string, nm_poli: string): DokterBertugas[] {
  void nm_poli;
  return [
    { kd_dokter: `${kd_poli}-A`, nm_dokter: 'dr. Gina Medika P, Sp.PD', jam_mulai: '08:00:00', jam_selesai: '14:30:59' },
    { kd_dokter: `${kd_poli}-B`, nm_dokter: 'dr. Stevani Andhika Tolabada, Sp.PD', jam_mulai: '14:30:00', jam_selesai: '20:00:00' },
  ];
}

const NAMA = ['JAELANTI', 'NI KADEK DARMANI', 'AL ZHIZI RUI ANUGRA', 'SITI AMINAH', 'BUDI SANTOSO', 'RINA WULANDARI'];
const SAPAAN = ['Tuan', 'Nyonya', 'Anak', 'Nona', 'Tuan', 'Nyonya'];

let urut = 18;
export function contohPanggilan(kd_poli: string, nm_poli: string, nm_dokter: string): Panggilan {
  urut += 1;
  const i = urut % NAMA.length;
  return {
    id: urut,
    waktu: new Date().toISOString(),
    kd_poli,
    nm_poli,
    kd_dokter: '-',
    nm_dokter,
    no_rawat: `2026/10/12/${String(urut).padStart(6, '0')}`,
    no_reg: String(urut).padStart(3, '0'),
    nm_pasien: `${SAPAAN[i]} ${NAMA[i]}`,
    tgl_registrasi: '2026-10-12',
  };
}

// Daftar video idle. Kosong = tampil panel pengganti.
export const CONTOH_PLAYLIST: string[] = [];
