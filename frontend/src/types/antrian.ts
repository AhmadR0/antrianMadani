// Bentuk data dari backend antrianMadani (lihat backend/src/services/antrian/types.ts dan dokter.ts).

export type Panggilan = {
  id: number;
  waktu: string;
  kd_poli: string;
  nm_poli: string;
  kd_dokter: string;
  nm_dokter: string;
  no_rawat: string;
  no_reg: string;
  nm_pasien: string;
  tgl_registrasi: string | null;
};

export type DokterBertugas = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;   // "08:00:00"
  jam_selesai: string; // "14:30:59"
  foto?: string;       // path relatif ke backend, mis. "/foto/alfrida.jpg"; kosong = avatar inisial
};

// Dikirim backend lewat event SSE "state" dan GET /antrian/state
export type KeadaanAntrian = {
  kd_poli: string;
  terakhir: Panggilan | null;
  riwayat: Panggilan[]; // terbaru dulu, termasuk `terakhir`
};
