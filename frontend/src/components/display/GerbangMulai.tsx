import { Play, type LucideIcon } from 'lucide-react';
import LatarMedis from '../ui/LatarMedis';
import type { PengaturanTv } from '../../lib/pilihanLayar';

type Props = {
  nm_poli: string;
  Ikon: LucideIcon;
  warnaLembut: string;
  warnaKuat: string;
  pengaturan: PengaturanTv;
  onUbahPengaturan: (p: PengaturanTv) => void;
  onMulai: () => void;
  onGanti: () => void;
};

// Layar pertama sebelum tampilan antrian. Satu klik/OK di sini:
// 1. membuka izin autoplay audio & video di browser (butuh interaksi pengguna),
// 2. mencoba masuk fullscreen,
// 3. menegaskan ke operator layar poli mana yang akan dibuka.
// Juga tempat pengaturan per TV (video & suaranya), diingat di TV ini.
export default function GerbangMulai({ nm_poli, Ikon, warnaLembut, warnaKuat, pengaturan, onUbahPengaturan, onMulai, onGanti }: Props) {
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
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 text-center">
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

      {/* Pengaturan TV ini */}
      <div className="mt-2 flex items-center gap-8 rounded-3xl border-2 border-rs-garis/70 bg-rs-kartu px-8 py-4 text-xl text-rs-tinta shadow-sm">
        <span className="font-semibold text-rs-tinta-lembut">Pengaturan TV ini</span>
        <Centang
          label="Tampilkan video & iklan"
          aktif={pengaturan.video}
          onUbah={(v) => onUbahPengaturan({ ...pengaturan, video: v })}
        />
        <Centang
          label="Suara video"
          aktif={pengaturan.suaraVideo}
          nonaktif={!pengaturan.video}
          onUbah={(v) => onUbahPengaturan({ ...pengaturan, suaraVideo: v })}
        />
      </div>

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

// Kotak centang besar yang bisa dijangkau tombol remote (fokus + OK/Enter/Spasi).
function Centang({ label, aktif, nonaktif = false, onUbah }: { label: string; aktif: boolean; nonaktif?: boolean; onUbah: (v: boolean) => void }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-3 ${nonaktif ? 'opacity-40' : ''}`}>
      <input
        type="checkbox"
        checked={aktif}
        disabled={nonaktif}
        onChange={(e) => onUbah(e.target.checked)}
        className="h-7 w-7 cursor-pointer accent-rs-primer focus:outline-none focus:ring-4 focus:ring-rs-primer/40"
      />
      <span>{label}</span>
    </label>
  );
}
