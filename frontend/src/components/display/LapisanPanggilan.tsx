import type { LucideIcon } from 'lucide-react';
import type { Panggilan } from '../../types/antrian';

type Props = {
  panggilan: Panggilan;
  nm_poli: string;
  namaTampil: string;
  // Layar multi-poli (koridor): nama poli harus dominan, latar memakai warna poli, tujuan disebut.
  multiPoli?: { Ikon: LucideIcon; warnaLatar: string };
};

// Lapisan ambil alih seluruh layar saat ada panggilan. Video di belakangnya tetap berjalan
// (dibisukan) dan hanya tertutup, sehingga lanjut dari posisi yang sama saat lapisan hilang.
export default function LapisanPanggilan({ panggilan, nm_poli, namaTampil, multiPoli }: Props) {
  const latar = multiPoli ? multiPoli.warnaLatar : 'bg-gradient-to-br from-teal-600 via-rs-primer to-teal-800';
  const Ikon = multiPoli?.Ikon;

  return (
    <div className={`rs-masuk absolute inset-0 z-20 flex flex-col items-center justify-between ${latar} px-16 py-12 text-center text-white`}>
      {multiPoli && Ikon ? (
        <div className="flex items-center gap-6 rounded-full bg-white/15 px-12 py-4">
          <Ikon className="h-16 w-16" strokeWidth={2.2} />
          <p className="text-6xl font-bold tracking-tight">{nm_poli}</p>
        </div>
      ) : (
        <p className="text-3xl font-semibold uppercase tracking-[0.3em] text-white/80">{nm_poli}</p>
      )}

      <div className="flex flex-col items-center">
        <p className="text-4xl font-semibold tracking-widest text-white/80">NOMOR ANTRIAN</p>
        <div className="rs-denyut font-bold leading-none tabular-nums tracking-tight" style={{ fontSize: multiPoli ? '22rem' : '26rem' }}>
          {panggilan.no_reg}
        </div>
        <p className="mt-4 line-clamp-2 max-w-[1500px] text-7xl font-bold leading-tight">{namaTampil || '-'}</p>
        <p className="mt-4 text-4xl text-white/80">{panggilan.nm_dokter}</p>
      </div>

      {multiPoli ? (
        <p className="text-4xl text-white">Silakan menuju <span className="font-bold">{nm_poli}</span></p>
      ) : (
        <p className="text-3xl text-white/80">Silakan menuju ruang periksa</p>
      )}
    </div>
  );
}
