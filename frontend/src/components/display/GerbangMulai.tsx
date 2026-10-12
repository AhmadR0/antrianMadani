import { Play, type LucideIcon } from 'lucide-react';
import LatarMedis from '../ui/LatarMedis';

type Props = {
  nm_poli: string;
  Ikon: LucideIcon;
  warnaLembut: string;
  warnaKuat: string;
  onMulai: () => void;
  onGanti: () => void;
};

// Layar pertama sebelum tampilan antrian. Satu klik/OK di sini:
// 1. membuka izin autoplay audio & video di browser (butuh interaksi pengguna),
// 2. mencoba masuk fullscreen,
// 3. menegaskan ke operator layar poli mana yang akan dibuka.
export default function GerbangMulai({ nm_poli, Ikon, warnaLembut, warnaKuat, onMulai, onGanti }: Props) {
  const mulai = () => {
    try {
      const p = document.documentElement.requestFullscreen?.();
      if (p && typeof p.catch === 'function') p.catch(() => undefined);
    } catch {
      /* browser TV mungkin tidak mendukung fullscreen, lanjut saja */
    }
    onMulai();
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center gap-8 text-center">
      <LatarMedis />
      <div className={`flex h-28 w-28 items-center justify-center rounded-[32px] ${warnaLembut}`}>
        <Ikon className={`h-14 w-14 ${warnaKuat}`} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-2xl text-rs-tinta-lembut">Anda akan membuka layar antrian</p>
        <p className="mt-2 text-6xl font-bold tracking-tight text-rs-tinta">{nm_poli}</p>
      </div>
      <button
        type="button"
        autoFocus
        onClick={mulai}
        className="mt-6 inline-flex items-center gap-4 rounded-3xl bg-rs-primer px-14 py-6 text-3xl font-bold text-white shadow-xl
                   transition hover:bg-rs-primer-gelap focus:outline-none focus:ring-8 focus:ring-rs-primer/30"
      >
        <Play className="h-9 w-9 fill-white" /> Mulai Tampilan
      </button>
      <button
        type="button"
        onClick={onGanti}
        className="text-xl text-rs-tinta-lembut underline-offset-4 hover:underline focus:outline-none focus:underline"
      >
        Bukan poli ini? Ganti poli
      </button>
    </div>
  );
}
