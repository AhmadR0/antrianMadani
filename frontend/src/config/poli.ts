import {
  Baby, Brain, Ear, Eye, Hand, HandHeart, HeartPulse, MessageCircleHeart, PersonStanding,
  Ruler, Scissors, Smile, Speech, Stethoscope, Wind, type LucideIcon,
} from 'lucide-react';

// Daftar poli untuk dashboard pemilih layar.
// SEMENTARA statis (diambil dari tabel poliklinik status='1' di madaniDev, 2026-10-12).
// Rencana: kode & nama diambil dari backend; ikon dan warna tetap dipetakan di sini per kd_poli.
// Kelas warna ditulis lengkap (bukan dirangkai) supaya terdeteksi Tailwind.

export type Poli = {
  kd_poli: string;
  nm_poli: string;
  ikon: LucideIcon;
  warnaLembut: string; // latar lingkaran ikon
  warnaKuat: string;   // warna ikon
  warnaLatar: string;  // latar lapisan panggilan di layar multi-poli (warna pekat)
  // Nama pasien disamarkan di layar (dan nanti tidak disebut di audio).
  // SEMENTARA di sini; rencana: pindah ke tabel pengaturan di backend + halaman admin.
  samarkanNama?: boolean;
};

export const DAFTAR_POLI: Poli[] = [
  { kd_poli: 'U0001', nm_poli: 'KLINIK KANDUNGAN',      ikon: HandHeart,          warnaLembut: 'bg-rose-100',    warnaKuat: 'text-rose-600', warnaLatar: 'bg-rose-600' },
  { kd_poli: 'U0002', nm_poli: 'KLINIK ANAK',           ikon: Baby,               warnaLembut: 'bg-amber-100',   warnaKuat: 'text-amber-600', warnaLatar: 'bg-amber-600' },
  { kd_poli: 'U0003', nm_poli: 'KLINIK PENYAKIT DALAM', ikon: Stethoscope,        warnaLembut: 'bg-teal-100',    warnaKuat: 'text-teal-700', warnaLatar: 'bg-teal-700' },
  { kd_poli: 'U0004', nm_poli: 'KLINIK BEDAH',          ikon: Scissors,           warnaLembut: 'bg-blue-100',    warnaKuat: 'text-blue-600', warnaLatar: 'bg-blue-700' },
  { kd_poli: 'U0005', nm_poli: 'KLINIK MATA',           ikon: Eye,                warnaLembut: 'bg-sky-100',     warnaKuat: 'text-sky-600', warnaLatar: 'bg-sky-600' },
  { kd_poli: 'U0006', nm_poli: 'KLINIK KULIT & KELAMIN',ikon: Hand,               warnaLembut: 'bg-orange-100',  warnaKuat: 'text-orange-600', warnaLatar: 'bg-orange-600', samarkanNama: true },
  { kd_poli: 'U0007', nm_poli: 'KLINIK SYARAF',         ikon: Brain,              warnaLembut: 'bg-violet-100',  warnaKuat: 'text-violet-600', warnaLatar: 'bg-violet-700' },
  { kd_poli: 'U0008', nm_poli: 'KLINIK TB',             ikon: Wind,               warnaLembut: 'bg-cyan-100',    warnaKuat: 'text-cyan-600', warnaLatar: 'bg-cyan-700', samarkanNama: true },
  { kd_poli: 'U0009', nm_poli: 'KLINIK JIWA',           ikon: MessageCircleHeart, warnaLembut: 'bg-fuchsia-100', warnaKuat: 'text-fuchsia-600', warnaLatar: 'bg-fuchsia-700', samarkanNama: true },
  { kd_poli: 'U0010', nm_poli: 'KLINIK GIGI & MULUT',   ikon: Smile,              warnaLembut: 'bg-lime-100',    warnaKuat: 'text-lime-700', warnaLatar: 'bg-lime-700' },
  { kd_poli: 'U0011', nm_poli: 'KLINIK THT',            ikon: Ear,                warnaLembut: 'bg-emerald-100', warnaKuat: 'text-emerald-600', warnaLatar: 'bg-emerald-700' },
  { kd_poli: 'U0012', nm_poli: 'KLINIK JANTUNG',        ikon: HeartPulse,         warnaLembut: 'bg-red-100',     warnaKuat: 'text-red-600', warnaLatar: 'bg-red-700' },
  { kd_poli: 'U0013', nm_poli: 'KLINIK TUMBUH KEMBANG', ikon: Ruler,              warnaLembut: 'bg-yellow-100',  warnaKuat: 'text-yellow-700', warnaLatar: 'bg-yellow-600' },
  { kd_poli: 'U0014', nm_poli: 'KLINIK PSIKOLOGI',      ikon: Speech,             warnaLembut: 'bg-purple-100',  warnaKuat: 'text-purple-600', warnaLatar: 'bg-purple-700', samarkanNama: true },
  { kd_poli: 'U0020', nm_poli: 'KLINIK FISIOTERAPI',    ikon: PersonStanding,     warnaLembut: 'bg-indigo-100',  warnaKuat: 'text-indigo-600', warnaLatar: 'bg-indigo-700' },
];

export function cariPoli(kd_poli: string | undefined): Poli | undefined {
  return DAFTAR_POLI.find((p) => p.kd_poli === kd_poli);
}
