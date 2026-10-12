// Konfigurasi layar TV. Satu layar bisa melayani beberapa poli.
// Daftar poli diambil dari aplikasi lama (antrian1..4); jangan ada poli yang muncul di dua layar.
export type DisplayConfig = {
  id: number;
  nama: string;
  poli: string[]; // kd_poli
};

export const displays: DisplayConfig[] = [
  { id: 1, nama: 'Antrian 1', poli: ['U0001', 'U0003', 'U0004', 'U0008'] },
  { id: 2, nama: 'Antrian 2', poli: ['U0009'] },
  { id: 3, nama: 'Antrian 3', poli: ['U0007', 'U0011', 'U0006', 'U0012'] },
  { id: 4, nama: 'Antrian 4', poli: ['U0005', 'U0002', 'U0010'] },
];

export const findDisplay = (id: number) => displays.find((d) => d.id === id);
