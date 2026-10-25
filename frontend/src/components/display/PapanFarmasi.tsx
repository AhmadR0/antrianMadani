import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ResepTunggu } from '../../types/antrian';
import { samarkanNama } from '../../lib/samarkanNama';

type Props = {
  judul: string;
  Ikon: LucideIcon;
  warna: 'teal' | 'sky';
  daftar: ResepTunggu[];
  perHalaman: number;
};

const DURASI_HALAMAN_MS = 10_000;

const WARNA = {
  teal: { kepala: 'bg-rs-primer', chip: 'bg-teal-100 text-teal-800' },
  sky:  { kepala: 'bg-sky-600',   chip: 'bg-sky-100 text-sky-800' },
};

const teksTunggu = (menit: number) => (menit < 60 ? `${menit} mnt` : `${Math.floor(menit / 60)} j ${menit % 60} m`);

// Papan satu jenis resep (non racikan / racikan): kepala dengan jumlah, lalu baris per resep
// urut dari yang paling lama menunggu. Nama pasien disamarkan (nama lengkap hanya saat dipanggil).
export default function PapanFarmasi({ judul, Ikon, warna, daftar, perHalaman }: Props) {
  const [halaman, setHalaman] = useState(0);
  const jumlahHalaman = Math.max(1, Math.ceil(daftar.length / perHalaman));
  const disiapkan = daftar.filter((r) => r.disiapkan).length;
  const w = WARNA[warna];

  useEffect(() => {
    if (jumlahHalaman <= 1) { setHalaman(0); return; }
    const t = setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), DURASI_HALAMAN_MS);
    return () => clearInterval(t);
  }, [jumlahHalaman]);

  const tampil = daftar.slice((halaman % jumlahHalaman) * perHalaman, (halaman % jumlahHalaman + 1) * perHalaman);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-rs-kartu shadow-md">
      <div className={`flex items-center gap-4 px-6 py-3 text-white ${w.kepala}`}>
        <Ikon className="h-8 w-8" strokeWidth={2.2} />
        <h2 className="text-3xl font-bold tracking-tight">{judul}</h2>
        <div className="ml-auto flex items-center gap-3 text-lg">
          <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">{daftar.length} resep</span>
          {disiapkan > 0 && <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">{disiapkan} sedang disiapkan</span>}
          {jumlahHalaman > 1 && <span className="text-white/80">hal {halaman % jumlahHalaman + 1}/{jumlahHalaman}</span>}
        </div>
      </div>

      {daftar.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-2xl text-rs-tinta-lembut">Tidak ada antrian</div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-rs-garis px-4">
          {tampil.map((r) => (
            <li key={r.no_resep} className="flex min-h-0 flex-1 items-center gap-4 py-1">
              <span className="w-24 shrink-0 text-3xl font-bold tabular-nums text-rs-tinta">{r.kode}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-semibold text-rs-tinta">{samarkanNama(r.nm_pasien)}</p>
                <p className="truncate text-sm text-rs-tinta-lembut">{r.nm_poli}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-base font-semibold ${r.disiapkan ? w.chip : 'bg-slate-100 text-rs-tinta-lembut'}`}>
                {r.disiapkan ? 'Sedang disiapkan' : 'Menunggu'}
              </span>
              <span className="w-20 shrink-0 text-right text-lg tabular-nums text-rs-tinta-lembut">{teksTunggu(r.menit_menunggu)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
