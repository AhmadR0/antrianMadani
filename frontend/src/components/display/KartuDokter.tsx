import type { DokterBertugas } from '../../types/antrian';
import { inisialDokter, jamPendek } from '../../lib/jamPraktik';

type Props = { dokter: DokterBertugas; sedangPraktik: boolean; kompak?: boolean };

// Kartu satu dokter: foto (atau inisial), nama, jam praktik, tanda sedang praktik.
export default function KartuDokter({ dokter, sedangPraktik, kompak = false }: Props) {
  // kompak: dipakai kalau dokter bertugas lebih dari 3, supaya semua tetap muat satu baris
  const foto = kompak ? 'h-20 w-20 rounded-2xl' : 'h-32 w-32 rounded-3xl';
  const inisialCls = kompak ? 'text-3xl' : 'text-5xl';
  const nama = kompak ? 'text-xl' : 'text-3xl';
  const jam = kompak ? 'text-base' : 'text-2xl';
  return (
    <div
      className={`flex items-center rounded-[28px] border-2 shadow-sm ${kompak ? 'gap-4 p-4' : 'gap-6 p-5 pr-8'}
        ${sedangPraktik ? 'border-rs-primer bg-rs-kartu' : 'border-rs-garis/70 bg-rs-kartu/70'}`}
    >
      {dokter.foto ? (
        <img src={dokter.foto} alt={dokter.nm_dokter} className={`${foto} object-cover`} />
      ) : (
        <div className={`flex ${foto} items-center justify-center bg-rs-primer-lembut ${inisialCls} font-bold text-rs-primer-gelap`}>
          {inisialDokter(dokter.nm_dokter)}
        </div>
      )}
      <div className="min-w-0">
        <p className={`truncate ${nama} font-bold text-rs-tinta`}>{dokter.nm_dokter}</p>
        <p className={`mt-1 ${jam} tabular-nums text-rs-tinta-lembut`}>
          {jamPendek(dokter.jam_mulai)} – {jamPendek(dokter.jam_selesai)}
        </p>
        {sedangPraktik && (
          <span className={`inline-flex items-center gap-2 rounded-full bg-rs-primer-lembut font-semibold text-rs-primer-gelap ${kompak ? 'mt-1.5 px-3 py-0.5 text-sm' : 'mt-3 px-4 py-1.5 text-lg'}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-rs-primer rs-denyut" /> Sedang praktik
          </span>
        )}
      </div>
    </div>
  );
}
