import type { DokterBertugas } from '../../config/contoh';

type Props = { dokter: DokterBertugas; sedangPraktik: boolean };

function inisial(nama: string): string {
  const kata = nama.replace(/^dr\.?\s*/i, '').replace(/,.*$/, '').trim().split(/\s+/);
  return kata.slice(0, 2).map((k) => k[0]?.toUpperCase() ?? '').join('');
}

const jamPendek = (j: string) => j.slice(0, 5);

// Kartu satu dokter: foto (atau inisial), nama, jam praktik, tanda sedang praktik.
export default function KartuDokter({ dokter, sedangPraktik }: Props) {
  return (
    <div
      className={`flex items-center gap-6 rounded-[28px] border-2 p-5 pr-8 shadow-sm
        ${sedangPraktik ? 'border-rs-primer bg-rs-kartu' : 'border-rs-garis/70 bg-rs-kartu/70'}`}
    >
      {dokter.foto ? (
        <img src={dokter.foto} alt={dokter.nm_dokter} className="h-32 w-32 rounded-3xl object-cover" />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-rs-primer-lembut text-5xl font-bold text-rs-primer-gelap">
          {inisial(dokter.nm_dokter)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-3xl font-bold text-rs-tinta">{dokter.nm_dokter}</p>
        <p className="mt-1 text-2xl tabular-nums text-rs-tinta-lembut">
          {jamPendek(dokter.jam_mulai)} – {jamPendek(dokter.jam_selesai)}
        </p>
        {sedangPraktik && (
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-rs-primer-lembut px-4 py-1.5 text-lg font-semibold text-rs-primer-gelap">
            <span className="h-2.5 w-2.5 rounded-full bg-rs-primer rs-denyut" /> Sedang praktik
          </span>
        )}
      </div>
    </div>
  );
}
