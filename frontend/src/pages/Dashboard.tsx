import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { DAFTAR_POLI, cariPoli, type Poli } from '../config/poli';
import { bacaPilihanLayar, simpanPilihanLayar } from '../lib/pilihanLayar';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';

// Dashboard pemilih layar antrian. Dibuka sekali oleh operator di TV.
// - Kartu besar per poli, bisa dinavigasi dengan tombol panah remote + OK/Enter.
// - Pilihan diingat di TV itu; buka berikutnya langsung ditawarkan dengan hitung mundur.

const KOLOM = 5; // jumlah kolom grid, dipakai untuk navigasi panah atas/bawah
const DETIK_HITUNG_MUNDUR = 5;

function TombolRemote({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-rs-garis bg-rs-kartu px-1.5 text-sm font-semibold text-rs-tinta shadow-sm">
      {children}
    </kbd>
  );
}

function CincinHitungMundur({ sisa, total }: { sisa: number; total: number }) {
  const r = 54;
  const keliling = 2 * Math.PI * r;
  const offset = keliling * (1 - sisa / total);
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-rs-garis)" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke="var(--color-rs-primer)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={keliling} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold tabular-nums text-rs-tinta">
        {sisa}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const tombolRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Poli yang terakhir dipilih di TV ini (kalau ada dan masih dikenal).
  const [tersimpan, setTersimpan] = useState<Poli | null>(() => cariPoli(bacaPilihanLayar() ?? undefined) ?? null);
  const [sisa, setSisa] = useState(DETIK_HITUNG_MUNDUR);

  const bukaLayar = useCallback(
    (poli: Poli) => {
      simpanPilihanLayar(poli.kd_poli);
      navigate(`/display/${poli.kd_poli}`);
    },
    [navigate],
  );

  // Hitung mundur hanya jalan kalau ada pilihan tersimpan.
  useEffect(() => {
    if (!tersimpan) return;
    if (sisa <= 0) {
      bukaLayar(tersimpan);
      return;
    }
    const t = setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [tersimpan, sisa, bukaLayar]);

  // Fokus ke kartu pertama saat grid tampil, supaya tombol panah remote langsung bekerja.
  useEffect(() => {
    if (!tersimpan) tombolRef.current[0]?.focus();
  }, [tersimpan]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const aktif = tombolRef.current.findIndex((b) => b === document.activeElement);
    if (aktif < 0) return;
    let tujuan = aktif;
    switch (e.key) {
      case 'ArrowRight': tujuan = aktif + 1; break;
      case 'ArrowLeft': tujuan = aktif - 1; break;
      case 'ArrowDown': tujuan = aktif + KOLOM; break;
      case 'ArrowUp': tujuan = aktif - KOLOM; break;
      default: return;
    }
    if (tujuan >= 0 && tujuan < DAFTAR_POLI.length) {
      e.preventDefault();
      tombolRef.current[tujuan]?.focus();
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex flex-col">
      <LatarMedis />
      <HeaderRS subjudul="Sistem Antrian Poliklinik" />

      <main className="flex-1 px-12 pb-6" onKeyDown={onKeyDown}>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-rs-tinta">Pilih layar untuk TV ini</h1>
            <p className="mt-2 text-xl text-rs-tinta-lembut">
              Pilih poli sesuai ruangan tempat TV ini dipasang.
            </p>
          </div>
          <div className="flex items-center gap-3 text-base text-rs-tinta-lembut">
            <span>Gunakan</span>
            <TombolRemote>◀</TombolRemote><TombolRemote>▶</TombolRemote>
            <TombolRemote>▲</TombolRemote><TombolRemote>▼</TombolRemote>
            <span>lalu</span>
            <TombolRemote>OK</TombolRemote>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {DAFTAR_POLI.map((poli, i) => {
            const Ikon = poli.ikon;
            return (
              <button
                key={poli.kd_poli}
                ref={(el) => { tombolRef.current[i] = el; }}
                type="button"
                onClick={() => bukaLayar(poli)}
                className="group relative flex h-48 flex-col justify-between rounded-[28px] border-2 border-rs-garis/70
                           bg-rs-kartu p-6 text-left shadow-sm cursor-pointer
                           transition duration-200 ease-out
                           hover:-translate-y-1 hover:border-rs-primer/60 hover:shadow-lg
                           focus:outline-none focus:-translate-y-1 focus:border-rs-primer focus:shadow-xl focus:ring-4 focus:ring-rs-primer/25"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${poli.warnaLembut}`}>
                    <Ikon className={`h-7 w-7 ${poli.warnaKuat}`} strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-rs-tinta-lembut">
                    {poli.kd_poli}
                  </span>
                </div>
                <div>
                  <div className="text-[22px] font-bold leading-tight text-rs-tinta">{poli.nm_poli}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-rs-primer
                                  opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                    Buka layar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="flex items-center gap-2 px-12 pb-6 text-base text-rs-tinta-lembut">
        <Info className="h-5 w-5" />
        Pilihan akan diingat di TV ini. Saat dibuka lagi, layar yang sama langsung ditawarkan.
      </footer>

      {tersimpan && (() => {
        const Ikon = tersimpan.ikon;
        return (
          <div className="fixed inset-0 z-10 flex items-center justify-center bg-rs-tinta/60 backdrop-blur-sm">
            <div className="w-[760px] rounded-[32px] bg-rs-kartu p-12 text-center shadow-2xl">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${tersimpan.warnaLembut}`}>
                <Ikon className={`h-10 w-10 ${tersimpan.warnaKuat}`} strokeWidth={2.2} />
              </div>
              <p className="mt-6 text-xl text-rs-tinta-lembut">TV ini terakhir dipakai untuk layar</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-rs-tinta">{tersimpan.nm_poli}</p>

              <div className="mt-8 flex flex-col items-center gap-3">
                <CincinHitungMundur sisa={sisa} total={DETIK_HITUNG_MUNDUR} />
                <p className="text-lg text-rs-tinta-lembut">Membuka otomatis</p>
              </div>

              <div className="mt-10 flex justify-center gap-4">
                <button
                  type="button"
                  autoFocus
                  onClick={() => bukaLayar(tersimpan)}
                  className="rounded-2xl bg-rs-primer px-10 py-4 text-xl font-bold text-white shadow-md
                             transition hover:bg-rs-primer-gelap
                             focus:outline-none focus:ring-4 focus:ring-rs-primer/35"
                >
                  Buka sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setTersimpan(null)}
                  className="rounded-2xl border-2 border-rs-garis bg-rs-kartu px-10 py-4 text-xl font-bold text-rs-tinta
                             transition hover:bg-slate-50
                             focus:outline-none focus:border-rs-tinta focus:ring-4 focus:ring-slate-300/60"
                >
                  Bukan di sini, ganti poli
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
