import { Stethoscope } from 'lucide-react';
import { cariPoli } from '../../config/poli';
import { inisialDokter, sedangPraktik } from '../../lib/jamPraktik';
import type { PoliJadwal } from '../../hooks/useInfoJadwal';

type Props = { poli: PoliJadwal; now: Date };

const MAKS_BARIS = 3;

// Satu kartu poli di layar jadwal: ikon + nama poli, lalu daftar dokter hari ini dengan jamnya.
export default function KartuJadwalPoli({ poli, now }: Props) {
  const cfg = cariPoli(poli.kd_poli);
  const Ikon = cfg?.ikon ?? Stethoscope;
  const warnaLembut = cfg?.warnaLembut ?? 'bg-teal-100';
  const warnaKuat = cfg?.warnaKuat ?? 'text-teal-700';

  const tampil = poli.dokter.slice(0, MAKS_BARIS);
  const sisa = poli.dokter.length - tampil.length;
  const adaYangPraktik = poli.dokter.some((d) => d.jam_diatur && sedangPraktik(d.jam_mulai, d.jam_selesai, now));

  return (
    <div className={`flex h-full flex-col rounded-[24px] border-2 bg-rs-kartu p-5 shadow-sm ${adaYangPraktik ? 'border-rs-primer' : 'border-rs-garis/70'}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${warnaLembut}`}>
          <Ikon className={`h-6 w-6 ${warnaKuat}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[22px] font-bold leading-tight text-rs-tinta">{poli.nm_poli}</div>
          <div className="text-sm text-rs-tinta-lembut">{poli.dokter.length} dokter hari ini</div>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {tampil.map((d) => {
          const praktik = d.jam_diatur && sedangPraktik(d.jam_mulai, d.jam_selesai, now);
          return (
            <li
              key={`${d.kd_dokter}-${d.jam_mulai}`}
              className={`flex items-start gap-4 rounded-2xl px-4 py-3 ${praktik ? 'bg-rs-primer-lembut' : 'bg-slate-50'}`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rs-kartu text-xl font-bold text-rs-primer-gelap shadow-sm">
                {inisialDokter(d.nm_dokter)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-xl font-bold leading-snug text-rs-tinta">{d.nm_dokter}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-rs-tinta-lembut">
                  {d.jam_diatur ? (
                    <span className="text-lg font-bold tabular-nums text-rs-tinta">{d.jam_mulai} – {d.jam_selesai}</span>
                  ) : (
                    <span className="font-semibold text-amber-700">jam belum diatur</span>
                  )}
                  {d.nm_sps && <span>{d.nm_sps}</span>}
                  {praktik && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-rs-primer-gelap">
                      <span className="h-2 w-2 rounded-full bg-rs-primer rs-denyut" /> Sedang praktik
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {sisa > 0 && <div className="mt-2 text-sm font-semibold text-rs-tinta-lembut">+{sisa} dokter lainnya</div>}
    </div>
  );
}
