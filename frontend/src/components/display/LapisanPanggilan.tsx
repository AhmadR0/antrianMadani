import type { LucideIcon } from 'lucide-react';
import type { Panggilan } from '../../types/antrian';

type Props = {
  panggilan: Panggilan;
  nm_poli: string;
  namaTampil: string;
  pakaiNomor?: boolean; // poli yang namanya disamarkan: nomor urut jadi elemen utama
  // Layar multi-poli (koridor): nama poli harus dominan, latar memakai warna poli.
  multiPoli?: { Ikon: LucideIcon; warnaLatar: string };
  labelAtas?: string;   // ganti teks kecil di atas (default: nm_poli)
  teksBawah?: React.ReactNode; // ganti kalimat bawah (default: "Silakan menuju <nm_poli>")
  keterangan?: string;  // ganti baris di bawah nama (default: nm_dokter)
};

// Lapisan ambil alih seluruh layar saat ada panggilan. Kebijakan RS: pasien dipanggil dengan NAMA,
// jadi nama pasien yang paling besar. Video di belakangnya tetap berjalan (dibisukan) dan hanya tertutup.
export default function LapisanPanggilan({ panggilan, nm_poli, namaTampil, pakaiNomor = false, multiPoli, labelAtas, teksBawah, keterangan }: Props) {
  const latar = multiPoli ? multiPoli.warnaLatar : 'bg-gradient-to-br from-teal-600 via-rs-primer to-teal-800';
  const Ikon = multiPoli?.Ikon;
  // Nama panjang diperkecil otomatis supaya tetap muat dua baris.
  const panjang = (namaTampil || '').length;
  const ukuranNama = panjang > 28 ? '7rem' : panjang > 18 ? '9rem' : '11rem';

  return (
    <div className={`rs-masuk absolute inset-0 z-20 flex flex-col items-center justify-between ${latar} px-16 py-12 text-center text-white`}>
      {multiPoli && Ikon ? (
        <div className="flex items-center gap-6 rounded-full bg-white/15 px-12 py-4">
          <Ikon className="h-16 w-16" strokeWidth={2.2} />
          <p className="text-6xl font-bold tracking-tight">{nm_poli}</p>
        </div>
      ) : (
        <p className="text-3xl font-semibold uppercase tracking-[0.3em] text-white/80">{labelAtas ?? nm_poli}</p>
      )}

      <div className="flex w-full flex-col items-center">
        <p className="text-4xl font-semibold tracking-widest text-white/80">PANGGILAN UNTUK</p>
        {pakaiNomor && (
          <div className="rs-denyut font-bold leading-none tabular-nums tracking-tight" style={{ fontSize: '18rem' }}>
            {panggilan.no_reg}
          </div>
        )}
        <p
          className={`line-clamp-2 max-w-[1700px] font-bold leading-[1.05] ${pakaiNomor ? 'mt-4' : 'rs-denyut mt-6'}`}
          style={{ fontSize: pakaiNomor ? '6rem' : ukuranNama }}
        >
          {namaTampil || '-'}
        </p>
        <p className="mt-6 text-4xl text-white/80">{keterangan ?? panggilan.nm_dokter}</p>
      </div>

      <p className="text-4xl text-white">{teksBawah ?? <>Silakan menuju <span className="font-bold">{nm_poli}</span></>}</p>
    </div>
  );
}
