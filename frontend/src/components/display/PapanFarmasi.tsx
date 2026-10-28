import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ResepTunggu } from '../../types/antrian';
import { samarkanNama } from '../../lib/samarkanNama';

type Props = {
  judul: string;
  Ikon: LucideIcon;
  warna: 'teal' | 'sky';
  daftar: ResepTunggu[];
  kapasitas: number;     // jumlah kartu per halaman (2 kolom)
  tampilNomor: boolean;  // tampilkan 4 digit nomor resep di kartu
};

const DURASI_HALAMAN_MS = 10_000;
const MAKS_TERTEMPEL_SISA = 4; // minimal 4 slot disisakan untuk kelompok "menunggu"

const WARNA = {
  teal: { ikon: 'bg-rs-primer-lembut text-rs-primer-gelap', siap: 'border-rs-primer/40 bg-rs-primer-lembut/70', titik: 'bg-rs-primer', label: 'text-rs-primer-gelap' },
  sky:  { ikon: 'bg-sky-100 text-sky-700',                   siap: 'border-sky-300/70 bg-sky-50',              titik: 'bg-sky-600',   label: 'text-sky-700' },
};

// Papan satu jenis resep (non racikan / racikan), bukan tabel: satu kartu per pasien.
// Kelompok "Sedang disiapkan" tertempel di atas (paling dekat dipanggil), kelompok "Menunggu" di bawahnya
// dan hanya kelompok itu yang berganti halaman. Tidak ada posisi/urutan: panggilan mengikuti obat yang selesai.
// Nama disamarkan (nama lengkap hanya saat dipanggil); nomor resep opsional (pengaturan TV).
export default function PapanFarmasi({ judul, Ikon, warna, daftar, kapasitas, tampilNomor }: Props) {
  const w = WARNA[warna];
  const disiapkan = daftar.filter((r) => r.disiapkan);
  const menunggu = daftar.filter((r) => !r.disiapkan);

  const tertempel = disiapkan.slice(0, Math.max(0, kapasitas - MAKS_TERTEMPEL_SISA));
  const bergilir = [...disiapkan.slice(tertempel.length), ...menunggu];
  const perHalaman = Math.max(1, kapasitas - tertempel.length);
  const jumlahHalaman = Math.max(1, Math.ceil(bergilir.length / perHalaman));

  const [halaman, setHalaman] = useState(0);
  useEffect(() => {
    if (jumlahHalaman <= 1) { setHalaman(0); return; }
    const t = setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), DURASI_HALAMAN_MS);
    return () => clearInterval(t);
  }, [jumlahHalaman]);
  const hal = halaman % jumlahHalaman;
  const tampil = bergilir.slice(hal * perHalaman, (hal + 1) * perHalaman);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-rs-kartu shadow-md">
      {/* Kepala */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${w.ikon}`}>
          <Ikon className="h-7 w-7" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-3xl font-bold leading-none tracking-tight text-rs-tinta">{judul}</h2>
          <p className="mt-1 text-base text-rs-tinta-lembut">
            {daftar.length === 0 ? 'Tidak ada antrian' : <>{menunggu.length} menunggu · {disiapkan.length} sedang disiapkan</>}
          </p>
        </div>
        {jumlahHalaman > 1 && (
          <div className="ml-auto flex items-center gap-1.5" aria-label={`halaman ${hal + 1} dari ${jumlahHalaman}`}>
            {Array.from({ length: jumlahHalaman }, (_, i) => (
              <span key={i} className={`h-2.5 rounded-full transition-all ${i === hal ? `w-7 ${w.titik}` : 'w-2.5 bg-rs-garis'}`} />
            ))}
          </div>
        )}
      </div>

      {daftar.length === 0 ? (
        <div className="flex flex-1 items-center justify-center pb-6 text-2xl text-rs-tinta-lembut">Belum ada resep yang menunggu</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-5 pb-4">
          {tertempel.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <LabelKelompok teks="Sedang disiapkan" warna={w.label} titik={w.titik} />
              <div className="grid grid-cols-2 gap-2.5">
                {tertempel.map((r) => <KartuResep key={r.no_resep} r={r} siap={w.siap} titik={w.titik} tampilNomor={tampilNomor} />)}
              </div>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <LabelKelompok teks="Menunggu" warna="text-rs-tinta-lembut" />
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5">
              {tampil.map((r) => <KartuResep key={r.no_resep} r={r} siap={w.siap} titik={w.titik} tampilNomor={tampilNomor} />)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LabelKelompok({ teks, warna, titik }: { teks: string; warna: string; titik?: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] ${warna}`}>
      {titik && <span className={`h-2 w-2 rounded-full ${titik} rs-denyut`} />}
      {teks}
    </p>
  );
}

function KartuResep({ r, siap, titik, tampilNomor }: { r: ResepTunggu; siap: string; titik: string; tampilNomor: boolean }) {
  return (
    <div className={`flex h-[62px] items-center gap-3 rounded-2xl border-2 px-4 ${r.disiapkan ? siap : 'border-rs-garis/70 bg-rs-latar/70'}`}>
      {tampilNomor && (
        <span className="shrink-0 rounded-xl bg-rs-kartu px-2.5 py-1 text-2xl font-bold tabular-nums leading-none text-rs-tinta shadow-sm">{r.kode}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-2xl font-bold leading-tight text-rs-tinta">{samarkanNama(r.nm_pasien)}</p>
        <p className="truncate text-sm leading-tight text-rs-tinta-lembut">{r.nm_poli}</p>
      </div>
      {r.disiapkan && <span className={`h-3 w-3 shrink-0 rounded-full ${titik} rs-denyut`} />}
    </div>
  );
}
