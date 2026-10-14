import { BedDouble } from 'lucide-react';
import type { BangsalBed } from '../../hooks/useInfoBed';

type Props = { bangsal: BangsalBed };

// Satu kartu bangsal. Kepala: nama ruangan besar + ringkasan. Isi: satu baris penuh per kelas,
// dibaca seperti kalimat: "Kelas 3 — 4 kosong dari 12", atau "Penuh" merah kalau habis.
export default function KartuBangsal({ bangsal }: Props) {
  const adaKosong = bangsal.kosong > 0;

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[28px] border-2 bg-rs-kartu p-5 shadow-sm ${adaKosong ? 'border-rs-garis/70' : 'border-rose-200'}`}>
      {/* Kepala */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="line-clamp-2 text-3xl font-bold leading-tight text-rs-tinta">{bangsal.nm_bangsal}</div>
          <div className="mt-1 text-lg text-rs-tinta-lembut">
            {bangsal.total} tempat tidur
            {bangsal.lainnya > 0 && <> · {bangsal.lainnya} dibersihkan/dipesan</>}
          </div>
        </div>
        <div className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xl font-bold ${adaKosong ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
          <BedDouble className="h-6 w-6" strokeWidth={2.2} />
          {adaKosong ? `${bangsal.kosong} kosong` : 'Penuh'}
        </div>
      </div>

      {/* Baris per kelas */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
        {bangsal.kelas.map((k) => {
          const ada = k.kosong > 0;
          return (
            <div
              key={k.kelas}
              className={`flex min-h-0 flex-1 items-center justify-between gap-4 rounded-2xl px-5 ${ada ? 'bg-emerald-50' : 'bg-rose-50'}`}
            >
              <div className="shrink-0 text-2xl font-bold text-rs-tinta">{k.kelas}</div>
              {ada ? (
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-4xl font-extrabold tabular-nums text-emerald-600">{k.kosong} kosong</span>
                  <span className="text-xl text-rs-tinta-lembut">dari {k.total}</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-4xl font-extrabold text-rose-600">Penuh</span>
                  <span className="text-xl text-rs-tinta-lembut">{k.total} terisi</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
