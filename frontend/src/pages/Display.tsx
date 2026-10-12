import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { cariPoli } from '../config/poli';
import { CONTOH_PLAYLIST, contohDokter, contohPanggilan } from '../config/contoh';
import { hapusPilihanLayar } from '../lib/pilihanLayar';
import type { Panggilan } from '../types/antrian';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import KanvasTV from '../components/ui/KanvasTV';
import GerbangMulai from '../components/display/GerbangMulai';
import PanelPanggilan from '../components/display/PanelPanggilan';
import KartuDokter from '../components/display/KartuDokter';
import AreaVideo from '../components/display/AreaVideo';
import RunningText from '../components/display/RunningText';

// Layar antrian satu poli. Alur: gerbang "Mulai Tampilan" -> mode idle (video bersuara)
// -> saat ada panggilan, mode panggil selama DURASI_PANGGIL_MS (video senyap, nomor berkedip) -> idle.
// SAAT INI memakai data contoh (config/contoh.ts). Tahap berikutnya: dokter dari backend,
// panggilan dari hook useAntrianEvents.

const DURASI_PANGGIL_MS = 8000;
const JUMLAH_SEBELUMNYA = 3;
const RUNNING_TEXT =
  'Selamat datang di RSUD Madani. Mohon menunggu dengan tenang, nomor antrian akan dipanggil sesuai urutan. ' +
  'Informasi dan pengaduan: (0451) 491605.';

// Kelas kolom ditulis lengkap supaya terdeteksi Tailwind.
const KOLOM_DOKTER: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };

// Tombol "kembali" di berbagai remote/browser TV: Escape, Backspace, Android TV (461), Tizen (10009), webOS (461).
function tombolKembali(e: KeyboardEvent): boolean {
  return e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.key === 'BrowserBack'
    || e.keyCode === 461 || e.keyCode === 10009;
}

function sedangPraktik(jam_mulai: string, jam_selesai: string, now: Date): boolean {
  const hhmm = now.toTimeString().slice(0, 8);
  return hhmm >= jam_mulai && hhmm <= jam_selesai;
}

export default function Display() {
  const { kd_poli } = useParams<{ kd_poli: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const poli = cariPoli(kd_poli);

  // Hanya di dev: ?mulai=1 lewati gerbang, ?demo=1 langsung simulasi satu panggilan,
  // ?dokter=N jumlah dokter contoh (untuk screenshot/review).
  const dev = import.meta.env.DEV;
  const jumlahDokter = dev ? Number(params.get('dokter')) || 2 : 2;
  const [mulai, setMulai] = useState(dev && params.get('mulai') === '1');

  const [sekarang, setSekarang] = useState<Panggilan | null>(null);
  const [sebelumnya, setSebelumnya] = useState<Panggilan[]>([]);
  const [modePanggil, setModePanggil] = useState(false);
  const timerRef = useRef<number | null>(null);

  const dokter = useMemo(() => (poli ? contohDokter(poli.kd_poli, poli.nm_poli, jumlahDokter) : []), [poli, jumlahDokter]);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Menerima satu panggilan: geser yang lama ke "sebelumnya", nyalakan mode panggil sebentar.
  const terimaPanggilan = useCallback((p: Panggilan) => {
    setSekarang((lama) => {
      if (lama && lama.id !== p.id) setSebelumnya((s) => [lama, ...s].slice(0, JUMLAH_SEBELUMNYA));
      return p;
    });
    setModePanggil(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setModePanggil(false), DURASI_PANGGIL_MS);
  }, []);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const simulasi = useCallback(() => {
    if (!poli) return;
    const d = dokter.find((x) => sedangPraktik(x.jam_mulai, x.jam_selesai, new Date())) ?? dokter[0];
    terimaPanggilan(contohPanggilan(poli.kd_poli, poli.nm_poli, d?.nm_dokter ?? '-'));
  }, [poli, dokter, terimaPanggilan]);

  useEffect(() => {
    if (dev && mulai && params.get('demo') === '1') {
      const t = window.setTimeout(simulasi, 800);
      return () => window.clearTimeout(t);
    }
  }, [dev, mulai, params, simulasi]);

  // Tombol Back/Escape saat tampilan berjalan: keluar fullscreen dan kembali ke gerbang.
  useEffect(() => {
    if (!mulai) return;
    const h = (e: KeyboardEvent) => {
      if (!tombolKembali(e)) return;
      e.preventDefault();
      try { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined); } catch { /* abaikan */ }
      setMulai(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mulai]);

  const gantiPoli = () => {
    hapusPilihanLayar();
    navigate('/');
  };

  if (!poli) {
    return (
      <div className="relative flex min-h-screen w-screen flex-col items-center justify-center gap-6 p-10 text-center">
        <LatarMedis />
        <p className="text-4xl font-bold text-red-600">Kode poli "{kd_poli}" tidak dikenal</p>
        <Link to="/" className="text-2xl font-semibold text-rs-primer underline">Kembali ke pemilih layar</Link>
      </div>
    );
  }

  if (!mulai) {
    return (
      <KanvasTV>
      <GerbangMulai
        nm_poli={poli.nm_poli}
        Ikon={poli.ikon}
        warnaLembut={poli.warnaLembut}
        warnaKuat={poli.warnaKuat}
        onMulai={() => setMulai(true)}
        onGanti={gantiPoli}
      />
      </KanvasTV>
    );
  }

  return (
    <KanvasTV>
    <div className="relative grid h-full w-full grid-rows-[auto_1fr_auto_auto] gap-6 overflow-hidden px-12 pb-6">
      <LatarMedis />
      <HeaderRS judul={poli.nm_poli} subjudul="RSUD Madani" />

      <div className="grid min-h-0 grid-cols-[2fr_3fr] gap-6">
        <PanelPanggilan sekarang={sekarang} sebelumnya={sebelumnya} aktif={modePanggil} />
        <AreaVideo playlist={CONTOH_PLAYLIST} senyap={modePanggil} />
      </div>

      <section>
        <p className="mb-3 text-xl font-semibold tracking-widest text-rs-tinta-lembut">DOKTER BERTUGAS HARI INI</p>
        {dokter.length === 0 ? (
          <p className="text-2xl text-rs-tinta-lembut">Tidak ada jadwal dokter hari ini.</p>
        ) : (
          <div className={`grid gap-6 ${KOLOM_DOKTER[dokter.length] ?? 'grid-cols-4'}`}>
            {dokter.map((d) => (
              <KartuDokter
                key={d.kd_dokter}
                dokter={d}
                sedangPraktik={sedangPraktik(d.jam_mulai, d.jam_selesai, now)}
                kompak={dokter.length > 3}
              />
            ))}
          </div>
        )}
      </section>

      <RunningText teks={RUNNING_TEXT} />

      {dev && (
        <button
          type="button"
          onClick={simulasi}
          className="absolute right-12 top-3 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow opacity-60 hover:opacity-100"
        >
          DEV: simulasi panggil
        </button>
      )}
    </div>
    </KanvasTV>
  );
}
