export type Panggilan = {
  id: number;            // urutan internal, naik terus selama backend hidup
  waktu: string;         // ISO
  kd_poli: string;
  nm_poli: string;
  kd_dokter: string;
  nm_dokter: string;
  no_rawat: string;
  no_reg: string;        // nomor antrian Khanza (unik per hari per dokter/poli)
  nm_pasien: string;     // sudah diformat untuk display/suara (Tn. -> Tuan, dst.)
  tgl_registrasi: string | null;
};
