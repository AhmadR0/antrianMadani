import { Stethoscope } from 'lucide-react';
import { cariPoli } from '../../config/poli';
import { inisialDokter, sedangPraktik } from '../../lib/jamPraktik';
import type { DokterJadwal, PoliJadwal } from '../../hooks/useInfoJadwal';

type Props = { poli: PoliJadwal; now: Date };

const MAKS_BARIS = 2; // lebih dari ini ditulis "+N dokter lainnya" supaya kartu tidak meluber

const statusDokter = (d: DokterJadwal, now: Date) => {
  if (!d.jam_diatur) return 'belum diatur';
  if (sedangPraktik(d.jam_mulai, d.jam_selesai, now)) return 'praktik';
  return now.toTimeString().slice(0, 5) > d.jam_selesai ? 'selesai' : 'belum mulai';
};

// Satu kartu poli di layar jadwal. Kepala: ikon + nama poli. Isi: satu baris per dokter dengan
// kolom tetap (foto | nama + spesialis | jam + status) supaya rapi dan mudah dibandingkan antarbaris.
export default function KartuJadwalPoli({ poli, now }: Props) {
  const cfg = cariPoli(poli.kd_poli);
  const Ikon = cfg?.ikon ?? Stethoscope;
  const warnaLembut = cfg?.warnaLembut ?? 'bg-teal-100';
  const warnaKuat = cfg?.warnaKuat ?? 'text-teal-700';

  const tampil = poli.dokter.slice(0, MAKS_BARIS);
  // Satu dokter: baris lega (foto 80 px). Dua dokter: sedikit lebih ringkas supaya keduanya muat.
  const padat = tampil.length > 1;
  const foto = padat ? 'h-16 w-16' : 'h-20 w-20';
  const nama = padat ? 'text-xl' : 'text-2xl';
  const sisa = poli.dokter.length - tampil.length;
  const adaYangPraktik = poli.dokter.some((d) => statusDokter(d, now) === 'praktik');

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[28px] border-2 bg-rs-kartu p-6 shadow-sm ${adaYangPraktik ? 'border-rs-primer' : 'border-rs-garis/70'}`}>
      {/* Kepala kartu */}
      <div className="flex items-center gap-4 border-b border-rs-garis pb-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${warnaLembut}`}>
          <Ikon className={`h-8 w-8 ${warnaKuat}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-3xl font-bold leading-tight text-rs-tinta">{poli.nm_poli}</div>
          <div className="mt-0.5 text-lg text-rs-tinta-lembut">{poli.dokter.length} dokter hari ini</div>
        </div>
      </div>

      {/* Baris dokter */}
      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
        {tampil.map((d) => {
          const status = statusDokter(d, now);
          const praktik = status === 'praktik';
          return (
            <li
              key={`${d.kd_dokter}-${d.jam_mulai}`}
              className={`grid min-h-0 flex-1 items-center gap-4 rounded-2xl px-4 ${padat ? 'grid-cols-[64px_1fr_auto] py-2' : 'grid-cols-[80px_1fr_auto] py-3'}
                ${praktik ? 'bg-rs-primer-lembut' : 'bg-slate-50'}`}
            >
              {d.foto ? (
                <img src={d.foto} alt={d.nm_dokter} className={`${foto} rounded-2xl object-cover`} />
              ) : (
                <div className={`flex ${foto} items-center justify-center rounded-2xl bg-rs-kartu text-2xl font-bold text-rs-primer-gelap shadow-sm`}>
                  {inisialDokter(d.nm_dokter)}
                </div>
              )}
              <div className="min-w-0">
                <p className={`line-clamp-2 ${nama} font-bold leading-tight text-rs-tinta`}>{d.nm_dokter}</p>
                <p className="truncate text-lg text-rs-tinta-lembut">{d.nm_sps ?? 'Dokter'}</p>
              </div>
              <div className="text-right">
                {d.jam_diatur ? (
                  <p className="text-2xl font-bold tabular-nums text-rs-tinta">{d.jam_mulai} – {d.jam_selesai}</p>
                ) : (
                  <p className="text-lg font-semibold text-amber-700">jam belum diatur</p>
                )}
                {praktik ? (
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-base font-semibold text-rs-primer-gelap">
                    <span className="h-2 w-2 rounded-full bg-rs-primer rs-denyut" /> Sedang praktik
                  </p>
                ) : (
                  <p className="mt-0.5 text-base text-rs-tinta-lembut">{status === 'selesai' ? 'Selesai' : status === 'belum mulai' ? 'Belum mulai' : ''}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {sisa > 0 && <div className="mt-2 text-lg font-semibold text-rs-tinta-lembut">+{sisa} dokter lainnya</div>}
    </div>
  );
}
