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
  suara_nama?: string; // path MP3 kalimat panggilan buatan server, relatif ke backend
};

export type DokterBertugas = {
  kd_dokter: string;
  nm_dokter: string;
  jam_mulai: string;   // "08:00:00"
  jam_selesai: string; // "14:30:59"
  foto?: string;       // path relatif ke backend, mis. "/foto/alfrida.jpg"; kosong = avatar inisial
};

// Keadaan satu poli, dikirim backend lewat event SSE "state" dan GET /antrian/state
export type KeadaanPoli = {
  kd_poli: string;
  terakhir: Panggilan | null;
  riwayat: Panggilan[]; // terbaru dulu, termasuk `terakhir`
};
export type KeadaanAntrian = { poli: KeadaanPoli[] };

// GET /antrian/dokter?poli=a,b
export type DokterPerPoli = { poli: { kd_poli: string; dokter: DokterBertugas[] }[] };

// ---------- Farmasi ----------
export type ResepTunggu = {
  no_resep: string;
  kode: string;           // 4 digit terakhir
  nm_pasien: string;      // nama asli; disamarkan di layar
  nm_poli: string;
  jam_peresepan: string;
  disiapkan: boolean;     // sudah divalidasi apoteker
  menit_menunggu: number;
};
export type AntrianFarmasi = { tanggal: string; diperbarui: string; nonRacikan: ResepTunggu[]; racikan: ResepTunggu[] };
