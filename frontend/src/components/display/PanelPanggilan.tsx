import type { Panggilan } from '../../types/antrian';

type Props = {
  sekarang: Panggilan | null;
  sebelumnya: Panggilan[];
  aktif: boolean; // true selama mode panggil (berkedip)
};

// Panel kiri: nomor yang dipanggil, nama pasien, dokter, dan beberapa nomor sebelumnya.
export default function PanelPanggilan({ sekarang, sebelumnya, aktif }: Props) {
  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-[32px] p-10 shadow-md transition-colors duration-300
        ${aktif ? 'bg-rs-primer text-white ring-8 ring-rs-primer/30' : 'bg-rs-kartu text-rs-tinta'}`}
    >
      <p className={`text-2xl font-semibold tracking-widest ${aktif ? 'text-teal-100' : 'text-rs-tinta-lembut'}`}>
        NOMOR ANTRIAN
      </p>

      <div className="flex flex-1 flex-col justify-center">
        {sekarang ? (
          <>
            <div
              className={`font-bold leading-none tabular-nums tracking-tight ${aktif ? 'rs-denyut' : ''}`}
              style={{ fontSize: '15rem' }}
            >
              {sekarang.no_reg}
            </div>
            <p className="mt-6 line-clamp-2 text-5xl font-bold leading-tight">{sekarang.nm_pasien || '-'}</p>
            <p className={`mt-3 text-3xl ${aktif ? 'text-teal-100' : 'text-rs-tinta-lembut'}`}>{sekarang.nm_dokter}</p>
          </>
        ) : (
          <p className={`text-4xl ${aktif ? 'text-teal-100' : 'text-rs-tinta-lembut'}`}>Menunggu panggilan</p>
        )}
      </div>

      {sebelumnya.length > 0 && (
        <div className={`flex items-center gap-4 border-t pt-6 ${aktif ? 'border-white/30' : 'border-rs-garis'}`}>
          <span className={`text-xl ${aktif ? 'text-teal-100' : 'text-rs-tinta-lembut'}`}>Sebelumnya</span>
          {sebelumnya.map((p) => (
            <span
              key={p.id}
              className={`rounded-xl px-4 py-1.5 text-3xl font-bold tabular-nums ${aktif ? 'bg-white/15' : 'bg-slate-100 text-rs-tinta'}`}
            >
              {p.no_reg}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
