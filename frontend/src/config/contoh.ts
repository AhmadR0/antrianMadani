// DATA CONTOH untuk review tampilan layar antrian. Dihapus saat backend tersambung.
import type { Panggilan } from '../types/antrian';

export type DokterBertugas = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;   // "08:00:00"
  jam_selesai: string; // "14:30:59"
  foto?: string;       // URL foto; kosong = avatar inisial
};

const CONTOH_NAMA_DOKTER = [
  'dr. Gina Medika P, Sp.PD',
  'dr. Stevani Andhika Tolabada, Sp.PD',
  'dr. Roberthy D. Maelissa, Sp.B',
  'dr. I Made Wirka, Sp.B',
  'dr. Karmilayanti, Sp.N',
];

// jumlah: berapa dokter contoh (1..5), untuk menguji layout 1, 2, 3, atau lebih kartu.
export function contohDokter(kd_poli: string, nm_poli: string, jumlah = 2): DokterBertugas[] {
  void nm_poli;
  const n = Math.min(Math.max(jumlah, 1), CONTOH_NAMA_DOKTER.length);
  return CONTOH_NAMA_DOKTER.slice(0, n).map((nm, i) => ({
    kd_dokter: `${kd_poli}-${i}`,
    nm_dokter: nm,
    jam_mulai: i === 1 ? '14:30:00' : '08:00:00',
    jam_selesai: i === 1 ? '20:00:00' : '14:30:59',
  }));
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
