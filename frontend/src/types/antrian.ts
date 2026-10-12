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

export type DisplayConfig = { id: number; nama: string; poli: string[] };
