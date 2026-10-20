import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarDays, Info, type LucideIcon } from 'lucide-react';
import { DAFTAR_POLI } from '../config/poli';
import { bacaPilihanLayar, simpanPilihanLayar } from '../lib/pilihanLayar';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import KanvasTV from '../components/ui/KanvasTV';

// Dashboard pemilih layar. Dibuka sekali oleh operator di TV.
// - Kartu per poli (layar antrian) + kartu layar informasi, dinavigasi dengan panah remote + OK/Enter.
// - Pilihan diingat di TV itu; buka berikutnya langsung ditawarkan dengan hitung mundur.

const KOLOM = 5; // jumlah kolom grid poli, dipakai untuk navigasi panah atas/bawah
const DETIK_HITUNG_MUNDUR = 5;

// Satu pilihan di dashboard, apa pun jenis layarnya.
type Layar = {
  path: string; // tanpa garis miring depan, sama dengan yang disimpan di localStorage
  kode: string;
  nama: string;
  ikon: LucideIcon;
  warnaLembut: string;
  warnaKuat: string;
  keterangan?: string;
};

const LAYAR_POLI: Layar[] = DAFTAR_POLI.map((p) => ({
  path: `display/${p.kd_poli}`,
  kode: p.kd_poli,
  nama: p.nm_poli,
  ikon: p.ikon,
  warnaLembut: p.warnaLembut,
  warnaKuat: p.warnaKuat,
}));

const LAYAR_INFO: Layar[] = [
  {
    path: 'info/bed',
    kode: 'BED',
    nama: 'Tempat Tidur',
    ikon: BedDouble,
    warnaLembut: 'bg-emerald-100',
    warnaKuat: 'text-emerald-700',
    keterangan: 'Ketersediaan kamar rawat inap per bangsal dan kelas',
  },
  {
    path: 'info/jadwal',
    kode: 'JADWAL',
    nama: 'Jadwal Dokter',
    ikon: CalendarDays,
    warnaLembut: 'bg-sky-100',
    warnaKuat: 'text-sky-700',
    keterangan: 'Jadwal praktik dokter hari ini untuk semua poli',
  },
];

const SEMUA_LAYAR = [...LAYAR_POLI, ...LAYAR_INFO];
const MAKS_POLI = 3;

// Path tersimpan -> Layar. Path gabungan "display/U0004,U0005,U0011" (layar koridor) dirakit dari poli-polinya.
function cariLayar(path: string | null): Layar | null {
  if (!path) return null;
  const langsung = SEMUA_LAYAR.find((l) => l.path === path);
  if (langsung) return langsung;
  if (!path.startsWith('display/') || !path.includes(',')) return null;
  const polis = path.slice('display/'.length).split(',').map((kd) => LAYAR_POLI.find((l) => l.kode === kd));
  if (polis.length < 2 || polis.length > MAKS_POLI || polis.some((p) => !p)) return null;
  const daftar = polis as Layar[];
  return {
    path,
    kode: daftar.map((p) => p.kode).join(','),
    nama: daftar.map((p) => p.nama).join(' · '),
    ikon: daftar[0].ikon,
    warnaLembut: daftar[0].warnaLembut,
    warnaKuat: daftar[0].warnaKuat,
    keterangan: `Layar koridor, ${daftar.length} poli`,
  };
}

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

const KELAS_TOMBOL =
  'group relative rounded-[28px] border-2 border-rs-garis/70 bg-rs-kartu text-left shadow-sm cursor-pointer ' +
  'transition duration-200 ease-out hover:-translate-y-1 hover:border-rs-primer/60 hover:shadow-lg ' +
  'focus:outline-none focus:-translate-y-1 focus:border-rs-primer focus:shadow-xl focus:ring-4 focus:ring-rs-primer/25';

export default function Dashboard() {
  const navigate = useNavigate();
  const tombolRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Layar yang terakhir dipilih di TV ini (kalau ada dan masih dikenal).
  const [tersimpan, setTersimpan] = useState<Layar | null>(() => cariLayar(bacaPilihanLayar()));
  const [sisa, setSisa] = useState(DETIK_HITUNG_MUNDUR);
  // Poli yang sedang dicentang (urutan pilih = urutan di layar). Maks MAKS_POLI untuk satu layar koridor.
  const [dipilih, setDipilih] = useState<string[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  const bukaLayar = useCallback(
    (layar: Layar) => {
      simpanPilihanLayar(layar.path);
      // Layar informasi tidak punya gerbang "Mulai", jadi minta layar penuh di sini selagi masih ada gestur pengguna.
      if (layar.path.startsWith('info/')) {
        try { document.documentElement.requestFullscreen?.().catch(() => undefined); } catch { /* abaikan */ }
      }
      navigate(`/${layar.path}`);
    },
    [navigate],
  );

  // Ubin poli: OK pertama mencentang, OK pada satu-satunya poli yang dicentang membuka layarnya.
  // Beberapa poli dicentang -> dibuka lewat tombol "Buka layar" sebagai satu layar koridor.
  const klikPoli = (layar: Layar) => {
    setPesan(null);
    if (dipilih.length === 1 && dipilih[0] === layar.kode) { bukaLayar(layar); return; }
    if (dipilih.includes(layar.kode)) { setDipilih(dipilih.filter((k) => k !== layar.kode)); return; }
    if (dipilih.length >= MAKS_POLI) { setPesan(`Maksimal ${MAKS_POLI} poli untuk satu layar.`); return; }
    setDipilih([...dipilih, layar.kode]);
  };
  const bukaPilihan = () => {
    if (dipilih.length === 0) return;
    const layar = cariLayar(`display/${dipilih.join(',')}`) ?? LAYAR_POLI.find((l) => l.kode === dipilih[0]);
    if (layar) bukaLayar(layar);
  };

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

  // Indeks tombol: 0..n-1 kartu poli (grid KOLOM kolom), lalu kartu layar informasi (satu baris).
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const aktif = tombolRef.current.findIndex((b) => b === document.activeElement);
    if (aktif < 0) return;
    const nPoli = LAYAR_POLI.length;
    const diPoli = aktif < nPoli;
    let tujuan = aktif;
    switch (e.key) {
      case 'ArrowRight': tujuan = aktif + 1; break;
      case 'ArrowLeft': tujuan = aktif - 1; break;
      case 'ArrowDown':
        tujuan = diPoli ? (aktif + KOLOM < nPoli ? aktif + KOLOM : nPoli) : aktif;
        break;
      case 'ArrowUp':
        if (diPoli) tujuan = aktif - KOLOM;
        else tujuan = nPoli - KOLOM + Math.min(aktif - nPoli, KOLOM - 1); // ke baris poli terakhir
        break;
      default: return;
    }
    if (tujuan !== aktif && tujuan >= 0 && tujuan < SEMUA_LAYAR.length) {
      e.preventDefault();
      tombolRef.current[tujuan]?.focus();
    }
  };

  return (
    <KanvasTV>
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <LatarMedis />
      <HeaderRS judul="RSUD Madani" subjudul="Sistem Antrian Poliklinik" />

      <main className="flex-1 px-12 pb-4" onKeyDown={onKeyDown}>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-rs-tinta">Pilih layar untuk TV ini</h1>
            <p className="mt-2 text-xl text-rs-tinta-lembut">
              Pilih poli sesuai ruangan tempat TV ini dipasang. Untuk layar koridor, centang sampai 3 poli lalu tekan "Buka layar".
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

        <div className="grid grid-cols-5 gap-5">
          {LAYAR_POLI.map((layar, i) => {
            const Ikon = layar.ikon;
            return (
              <button
                key={layar.path}
                ref={(el) => { tombolRef.current[i] = el; }}
                type="button"
                onClick={() => klikPoli(layar)}
                aria-pressed={dipilih.includes(layar.kode)}
                className={`${KELAS_TOMBOL} flex h-44 flex-col justify-between p-6 ${dipilih.includes(layar.kode) ? 'border-rs-primer bg-rs-primer-lembut/40' : ''}`}
              >
                {dipilih.includes(layar.kode) && (
                  <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-rs-primer text-lg font-bold text-white shadow-md">
                    {dipilih.indexOf(layar.kode) + 1}
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${layar.warnaLembut}`}>
                    <Ikon className={`h-7 w-7 ${layar.warnaKuat}`} strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-rs-tinta-lembut">
                    {layar.kode}
                  </span>
                </div>
                <div>
                  <div className="text-[22px] font-bold leading-tight text-rs-tinta">{layar.nama}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-rs-primer
                                  opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                    Buka layar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <h2 className="mt-6 mb-3 text-lg font-semibold uppercase tracking-widest text-rs-tinta-lembut">Layar informasi</h2>
        <div className="grid grid-cols-5 gap-5">
          {LAYAR_INFO.map((layar, j) => {
            const Ikon = layar.ikon;
            const i = LAYAR_POLI.length + j;
            return (
              <button
                key={layar.path}
                ref={(el) => { tombolRef.current[i] = el; }}
                type="button"
                onClick={() => bukaLayar(layar)}
                className={`${KELAS_TOMBOL} col-span-2 flex h-28 items-center gap-5 px-6`}
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${layar.warnaLembut}`}>
                  <Ikon className={`h-7 w-7 ${layar.warnaKuat}`} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[22px] font-bold leading-tight text-rs-tinta">{layar.nama}</div>
                  <div className="mt-1 truncate text-sm text-rs-tinta-lembut">{layar.keterangan}</div>
                </div>
                <ArrowRight className="h-6 w-6 shrink-0 text-rs-primer opacity-0 transition group-hover:opacity-100 group-focus:opacity-100" />
              </button>
            );
          })}
        </div>
      </main>

      {(dipilih.length > 0 || pesan) && (
        <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center gap-5 rounded-3xl bg-rs-tinta px-8 py-4 text-white shadow-2xl">
          {pesan && <span className="text-xl font-semibold text-amber-300">{pesan}</span>}
          {dipilih.length > 0 && (
            <>
              <span className="text-xl">
                {dipilih.length} poli dipilih
                {dipilih.length > 1 && <span className="text-white/70"> · satu layar koridor</span>}
              </span>
              <button
                type="button"
                id="tombol-buka-pilihan"
                onClick={bukaPilihan}
                className="rounded-2xl bg-rs-primer px-8 py-3 text-xl font-bold text-white transition hover:bg-rs-primer-gelap focus:outline-none focus:ring-4 focus:ring-white/40"
              >
                Buka layar
              </button>
              <button
                type="button"
                onClick={() => setDipilih([])}
                className="text-lg text-white/70 underline-offset-4 hover:underline focus:underline focus:outline-none"
              >
                Batal
              </button>
            </>
          )}
        </div>
      )}

      <footer className="flex items-center gap-2 px-12 pb-6 text-base text-rs-tinta-lembut">
        <Info className="h-5 w-5" />
        Pilihan akan diingat di TV ini. Saat dibuka lagi, layar yang sama langsung ditawarkan.
      </footer>

      {tersimpan && (() => {
        const Ikon = tersimpan.ikon;
        return (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-rs-tinta/60 backdrop-blur-sm">
            <div className="w-[760px] rounded-[32px] bg-rs-kartu p-12 text-center shadow-2xl">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${tersimpan.warnaLembut}`}>
                <Ikon className={`h-10 w-10 ${tersimpan.warnaKuat}`} strokeWidth={2.2} />
              </div>
              <p className="mt-6 text-xl text-rs-tinta-lembut">TV ini terakhir dipakai untuk layar</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-rs-tinta">{tersimpan.nama}</p>

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
                  Bukan di sini, ganti layar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </KanvasTV>
  );
}
