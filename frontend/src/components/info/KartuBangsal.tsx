import { BedDouble } from 'lucide-react';
import type { BangsalBed } from '../../hooks/useInfoBed';

type Props = { bangsal: BangsalBed };

// Nama kelas Khanza panjang ("Kelas Utama"); di chip cukup bagian setelah kata "Kelas".
const namaKelasPendek = (kelas: string) => kelas.replace(/^Kelas\s+(?=\d)/i, 'Kls ').replace(/^Kelas\s+/i, '');

// Satu kartu bangsal: nama, angka kosong besar, batang keterisian, chip per kelas.
export default function KartuBangsal({ bangsal }: Props) {
  const adaKosong = bangsal.kosong > 0;
  const persenTerisi = bangsal.total === 0 ? 0 : Math.round(((bangsal.total - bangsal.kosong) / bangsal.total) * 100);

  return (
    <div className="flex h-full flex-col rounded-[24px] border-2 border-rs-garis/70 bg-rs-kartu p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[22px] font-bold leading-tight text-rs-tinta">{bangsal.nm_bangsal}</div>
          <div className="mt-1 text-sm text-rs-tinta-lembut">
            {bangsal.total} tempat tidur
            {bangsal.lainnya > 0 && <> · {bangsal.lainnya} dibersihkan/dipesan</>}
          </div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${adaKosong ? 'bg-emerald-100' : 'bg-rose-100'}`}>
          <BedDouble className={`h-5 w-5 ${adaKosong ? 'text-emerald-700' : 'text-rose-700'}`} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className={`text-6xl font-extrabold leading-none tabular-nums ${adaKosong ? 'text-emerald-600' : 'text-rose-600'}`}>
          {bangsal.kosong}
        </span>
        <span className="pb-1 text-lg font-semibold text-rs-tinta-lembut">{adaKosong ? 'kosong' : 'penuh'}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${adaKosong ? 'bg-rs-primer' : 'bg-rose-500'}`}
          style={{ width: `${persenTerisi}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bangsal.kelas.map((k) => (
          <span
            key={k.kelas}
            className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
              k.kosong > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-rs-tinta-lembut'
            }`}
          >
            {namaKelasPendek(k.kelas)} · {k.kosong}/{k.total}
          </span>
        ))}
      </div>
    </div>
  );
}
