import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ResepTunggu } from '../../types/antrian';

type Props = {
  judul: string;
  Ikon: LucideIcon;
  warna: 'teal' | 'sky';
  daftar: ResepTunggu[];   // sudah urut jam validasi dari backend
  perHalaman: number;      // baris per halaman
  tampilNomor: boolean;    // tampilkan 4 digit nomor resep
};

const DURASI_HALAMAN_MS = 10_000;

const WARNA = {
  teal: { ikon: 'bg-rs-primer-lembut text-rs-primer-gelap', titik: 'bg-rs-primer' },
  sky:  { ikon: 'bg-sky-100 text-sky-700',                   titik: 'bg-sky-600' },
};

// Papan satu jenis resep (non racikan / racikan): satu daftar lurus dari atas ke bawah,
// urut jam validasi farmasi (yang paling dulu diterima paling atas). Farmasi memanggil mengikuti
// urutan itu, jadi baris pertama = berikutnya dipanggil, ditandai oranye "Bersiap".
// Nama pasien tampil utuh (kebijakan farmasi); nomor resep opsional (pengaturan TV).
export default function PapanFarmasi({ judul, Ikon, warna, daftar, perHalaman, tampilNomor }: Props) {
  const w = WARNA[warna];
  const jumlahHalaman = Math.max(1, Math.ceil(daftar.length / perHalaman));
  const [halaman, setHalaman] = useState(0);
  useEffect(() => {
    if (jumlahHalaman <= 1) { setHalaman(0); return; }
    const t = setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), DURASI_HALAMAN_MS);
    return () => clearInterval(t);
  }, [jumlahHalaman]);
  const hal = halaman % jumlahHalaman;
  const tampil = daftar.slice(hal * perHalaman, (hal + 1) * perHalaman);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden px-5">
      {/* Kepala: ringan, bukan kartu */}
      <div className="flex items-center gap-3 border-b border-rs-garis px-1 pt-3 pb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${w.ikon}`}>
          <Ikon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h2 className="truncate text-2xl font-bold leading-none tracking-tight text-rs-tinta">{judul}</h2>
        <span className="ml-auto shrink-0 text-base tabular-nums text-rs-tinta-lembut">{daftar.length === 0 ? 'kosong' : `${daftar.length} resep`}</span>
      </div>

      {daftar.length === 0 ? (
        <div className="flex flex-1 items-center justify-center pb-6 text-center text-2xl text-rs-tinta-lembut">Belum ada resep<br />yang menunggu</div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col overflow-hidden pt-1.5 pb-2">
          {tampil.map((r, i) => {
            const bersiap = hal === 0 && i === 0; // baris pertama daftar = berikutnya dipanggil
            return (
              <li
                key={r.no_resep}
                className={`flex h-[57px] shrink-0 items-center gap-3 px-3 ${bersiap ? 'rounded-2xl border-2 border-orange-400 bg-orange-50' : 'border-b border-rs-garis/60'}`}
              >
                {tampilNomor && (
                  <span className={`shrink-0 rounded-xl px-2.5 py-1 text-2xl font-bold tabular-nums leading-none ${bersiap ? 'bg-orange-500 text-white shadow-sm' : 'bg-rs-latar text-rs-tinta'}`}>{r.kode}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-2xl leading-tight ${bersiap ? 'font-bold text-orange-900' : 'font-semibold text-rs-tinta'}`}>
                    {r.nm_pasien && r.nm_pasien !== '-' ? r.nm_pasien : <span className="font-normal text-rs-tinta-lembut">Nama tidak tersedia</span>}
                  </p>
                  <p className={`truncate text-sm leading-tight ${bersiap ? 'text-orange-700' : 'text-rs-tinta-lembut'}`}>{r.nm_poli}</p>
                </div>
                {bersiap ? (
                  <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white rs-denyut">Bersiap</span>
                ) : (
                  <span className="shrink-0 text-lg tabular-nums text-rs-tinta-lembut">{r.jam_validasi}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {jumlahHalaman > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3" aria-label={`halaman ${hal + 1} dari ${jumlahHalaman}`}>
          {jumlahHalaman <= 12
            ? Array.from({ length: jumlahHalaman }, (_, i) => (
                <span key={i} className={`h-2.5 rounded-full transition-all ${i === hal ? `w-7 ${w.titik}` : 'w-2.5 bg-rs-garis'}`} />
              ))
            : <span className="text-base tabular-nums text-rs-tinta-lembut">halaman {hal + 1} / {jumlahHalaman}</span>}
        </div>
      )}
    </section>
  );
}
