import type { Panggilan } from '../../types/antrian';

type Props = { panggilan: Panggilan; nm_poli: string; namaTampil: string };

// Lapisan ambil alih seluruh layar saat ada panggilan. Video di belakangnya tetap berjalan
// (dibisukan) dan hanya tertutup, sehingga lanjut dari posisi yang sama saat lapisan hilang.
export default function LapisanPanggilan({ panggilan, nm_poli, namaTampil }: Props) {
  return (
    <div className="rs-masuk absolute inset-0 z-20 flex flex-col items-center justify-between bg-gradient-to-br from-teal-600 via-rs-primer to-teal-800 px-16 py-14 text-center text-white">
      <p className="text-3xl font-semibold uppercase tracking-[0.3em] text-teal-100">{nm_poli}</p>

      <div className="flex flex-col items-center">
        <p className="text-4xl font-semibold tracking-widest text-teal-100">NOMOR ANTRIAN</p>
        <div className="rs-denyut font-bold leading-none tabular-nums tracking-tight" style={{ fontSize: '26rem' }}>
          {panggilan.no_reg}
        </div>
        <p className="mt-4 line-clamp-2 max-w-[1500px] text-7xl font-bold leading-tight">{namaTampil || '-'}</p>
        <p className="mt-4 text-4xl text-teal-100">{panggilan.nm_dokter}</p>
      </div>

      <p className="text-3xl text-teal-100">Silakan menuju ruang periksa</p>
    </div>
  );
}
