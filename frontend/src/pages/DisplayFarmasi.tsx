import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FlaskConical, Info, Pill, WifiOff } from 'lucide-react';
import { bacaPengaturanTv, hapusPilihanLayar, simpanPengaturanTv, type PengaturanTv } from '../lib/pilihanLayar';
import { bunyikanPanggilan, pemutarSuara, siapkanSuara } from '../lib/suaraAntrian';
import { useAntrianEvents } from '../hooks/useAntrianEvents';
import { useAntrianFarmasi } from '../hooks/useAntrianFarmasi';
import type { Panggilan } from '../types/antrian';
import { API_URL } from '../lib/api';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import KanvasTV from '../components/ui/KanvasTV';
import GerbangMulai from '../components/display/GerbangMulai';
import AreaVideo from '../components/display/AreaVideo';
import RunningText from '../components/display/RunningText';
import LapisanPanggilan from '../components/display/LapisanPanggilan';
import PapanFarmasi from '../components/display/PapanFarmasi';

// Layar antrian FARMASI (loket penyerahan obat rawat jalan).
// - Panggilan: Khanza tombol "Penyerahan" -> antriapotek3 -> poller backend -> SSE kanal "FARMASI".
//   Pasien dipanggil dengan NAMA LENGKAP, suara MP3 server: "Atas nama X, silakan ke loket penyerahan obat".
// - Daftar tunggu: resep hari ini yang sudah divalidasi farmasi dan belum diserahkan, dua papan
//   bersampingan (non racikan | racikan), satu daftar lurus urut jam validasi, nama tampil utuh, tanpa IGD.
//   Panggilan TIDAK mengikuti urutan (obat yang selesai duluan dipanggil duluan); nomor resep opsional per TV.

const KD_FARMASI = 'FARMASI';
const DURASI_PANGGIL_MS = 8000;
const JEDA_SETELAH_SUARA_MS = 1500;
const JUMLAH_SEBELUMNYA = 6;          // disimpan 6, tampil 3 saat video menyala
const BARIS_PAPAN = 12;               // baris per papan per halaman
const RUNNING_TEXT =
  'Pasien dipanggil dengan nama begitu obat selesai disiapkan, sehingga panggilan tidak selalu sesuai urutan nomor. ' +
  'Resep racikan memerlukan waktu lebih lama. Pastikan nama dan jumlah obat sesuai sebelum meninggalkan loket.';
const PLAYLIST: string[] = [];

const tombolKembali = (e: KeyboardEvent) =>
  e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.key === 'BrowserBack' ||
  e.keyCode === 461 || e.keyCode === 10009;

async function simulasiPanggil(tanggal?: string) {
  try {
    const res = await fetch(`${API_URL}/farmasi/simulasi/panggil`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tanggal }),
    });
    if (!res.ok) console.error('[simulasi farmasi]', await res.text());
  } catch (err) { console.error('[simulasi farmasi]', err); }
}

export default function DisplayFarmasi() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dev = import.meta.env.DEV;
  const [mulai, setMulai] = useState(dev && params.get('mulai') === '1');
  const [pengaturan, setPengaturan] = useState<PengaturanTv>(() => {
    const p = bacaPengaturanTv();
    if (!dev) return p;
    return {
      ...p,
      video: params.get('video') === '0' ? false : p.video,
      nomorAntrian: params.get('nomor') === '1' ? true : p.nomorAntrian,
    };
  });
  const ubahPengaturan = (p: PengaturanTv) => { setPengaturan(p); simpanPengaturanTv(p); };

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

  if (!mulai) {
    return (
      <KanvasTV>
        <GerbangMulai
          nm_poli="FARMASI"
          Ikon={Pill}
          warnaLembut="bg-emerald-100"
          warnaKuat="text-emerald-700"
          pengaturan={pengaturan}
          onUbahPengaturan={ubahPengaturan}
          onMulai={() => { void siapkanSuara(); setMulai(true); }}
          onGanti={() => { hapusPilihanLayar(); navigate('/'); }}
          opsiNomorAntrian
          teksGanti="Bukan layar ini? Ganti layar"
        />
      </KanvasTV>
    );
  }

  return <TampilanFarmasi pengaturan={pengaturan} dev={dev} tanggalDev={dev ? params.get('tanggal') ?? undefined : undefined} />;
}

function TampilanFarmasi({ pengaturan, dev, tanggalDev }: { pengaturan: PengaturanTv; dev: boolean; tanggalDev?: string }) {
  const [sekarang, setSekarang] = useState<Panggilan | null>(null);
  const [sebelumnya, setSebelumnya] = useState<Panggilan[]>([]);
  const [modePanggil, setModePanggil] = useState(false);
  const timerRef = useRef<number | null>(null);
  const sekarangRef = useRef<Panggilan | null>(null);
  useEffect(() => { sekarangRef.current = sekarang; }, [sekarang]);

  const terimaPanggilan = useCallback((p: Panggilan) => {
    const lama = sekarangRef.current;
    if (lama && lama.id !== p.id) setSebelumnya((s) => [lama, ...s.filter((x) => x.id !== lama.id)].slice(0, JUMLAH_SEBELUMNYA));
    sekarangRef.current = p;
    setSekarang(p);
    setModePanggil(true);
    const pasangTimer = (ms: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setModePanggil(false), ms);
    };
    pasangTimer(DURASI_PANGGIL_MS);
    const mulai = Date.now();
    bunyikanPanggilan({
      nama: p.nm_pasien,
      no_reg: p.no_reg,
      nm_poli: 'Farmasi',
      suaraUrl: p.suara_nama ? `${API_URL}${p.suara_nama}` : undefined,
      kalimatCadangan: `Atas nama ${p.nm_pasien.toLowerCase()}, silakan ke loket penyerahan obat.`,
    })
      .catch((err) => console.warn('[suara]', err))
      .finally(() => {
        if (sekarangRef.current?.id !== p.id) return;
        pasangTimer(Math.max(DURASI_PANGGIL_MS - (Date.now() - mulai), JEDA_SETELAH_SUARA_MS));
      });
  }, []);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); pemutarSuara.hentikan(); }, []);

  const { keadaan, status } = useAntrianEvents([KD_FARMASI], terimaPanggilan);
  const keadaanFarmasi = keadaan[KD_FARMASI];
  useEffect(() => {
    if (!keadaanFarmasi?.terakhir) return;
    const t = keadaanFarmasi.terakhir;
    if (sekarangRef.current?.id === t.id) return;
    sekarangRef.current = t;
    setSekarang(t);
    setSebelumnya(keadaanFarmasi.riwayat.filter((p) => p.id !== t.id).slice(0, JUMLAH_SEBELUMNYA));
  }, [keadaanFarmasi]);

  const { data, status: statusDaftar } = useAntrianFarmasi(tanggalDev);
  const tampilNomor = pengaturan.nomorAntrian;
  const daftarSebelumnya = sebelumnya.slice(0, pengaturan.video ? 3 : JUMLAH_SEBELUMNYA);

  return (
    <KanvasTV>
    <div className="relative grid h-full w-full grid-rows-[auto_1fr_auto] gap-6 overflow-hidden px-12 pb-6">
      <LatarMedis />
      <HeaderRS judul="Antrian Farmasi" subjudul="RSUD Madani · Penyerahan obat rawat jalan" />

      <div className="grid min-h-0 grid-cols-[2fr_3fr] gap-6">
        {/* Kolom kiri: terakhir dipanggil (+ video kalau aktif) */}
        <div className="flex min-h-0 flex-col gap-5">
          <section className={`relative flex flex-col overflow-hidden rounded-[32px] bg-gradient-to-br from-rs-primer via-teal-700 to-teal-900 p-8 text-white shadow-xl ${pengaturan.video ? '' : 'flex-1'}`}>
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-black/10" />
            <p className="relative text-xl font-semibold tracking-widest text-white/70">{sekarang ? 'TERAKHIR DIPANGGIL' : 'PENYERAHAN OBAT'}</p>
            <div className={`relative flex flex-col justify-center ${pengaturan.video ? 'py-4' : 'flex-1'}`}>
              {sekarang ? (
                <>
                  <p className={`line-clamp-3 font-bold leading-tight ${pengaturan.video ? 'text-5xl' : 'text-7xl'}`}>{sekarang.nm_pasien}</p>
                  <p className="mt-3 text-2xl text-white/80">
                    {tampilNomor && <>Resep <span className="font-bold tabular-nums text-white">{sekarang.no_reg}</span>{sekarang.nm_poli && ' · '}</>}
                    {sekarang.nm_poli && <>dari {sekarang.nm_poli}</>}
                  </p>
                </>
              ) : (
                <p className="text-4xl text-white/70">Menunggu panggilan</p>
              )}
            </div>
            {daftarSebelumnya.length > 0 && (
              <div className="relative border-t border-white/20 pt-4">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">Sudah dipanggil</p>
                <ul className={`flex flex-col ${pengaturan.video ? 'gap-0.5' : 'gap-1.5'}`}>
                  {daftarSebelumnya.map((p) => (
                    <li key={p.id} className={`flex items-baseline gap-3 truncate font-semibold text-white ${pengaturan.video ? 'text-xl' : 'text-2xl'}`}>
                      {tampilNomor && <span className="shrink-0 tabular-nums text-white/60">{p.no_reg}</span>}
                      <span className="truncate">{p.nm_pasien}</span>
                      {p.nm_poli && <span className="shrink-0 text-base font-normal text-white/60">{p.nm_poli}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!pengaturan.video && (
              <div className="relative mt-5 flex items-start gap-3 rounded-2xl bg-white/10 px-5 py-4 text-lg leading-snug text-white/85">
                <Info className="mt-0.5 h-6 w-6 shrink-0 text-white" strokeWidth={2.2} />
                <p>Panggilan tidak selalu sesuai urutan nomor. Obat dipanggil begitu selesai disiapkan, resep racikan memerlukan waktu lebih lama.</p>
              </div>
            )}
          </section>
          {pengaturan.video && (
            <div className="min-h-0 flex-1">
              <AreaVideo playlist={PLAYLIST} senyap={modePanggil} bisu={!pengaturan.suaraVideo} />
            </div>
          )}
        </div>

        {/* Kolom kanan (tampilan kedua): satu wadah ringan tanpa bayangan, dua papan dipisah garis */}
        <div className="grid min-h-0 grid-cols-2 divide-x divide-rs-garis rounded-[32px] border border-rs-garis/80 bg-white/55 py-2">
          <PapanFarmasi judul="Non Racikan" Ikon={Pill} warna="teal" daftar={data?.nonRacikan ?? []} perHalaman={BARIS_PAPAN} tampilNomor={tampilNomor} />
          <PapanFarmasi judul="Racikan" Ikon={FlaskConical} warna="sky" daftar={data?.racikan ?? []} perHalaman={BARIS_PAPAN} tampilNomor={tampilNomor} />
        </div>
      </div>

      <RunningText teks={RUNNING_TEXT} />

      {modePanggil && sekarang && (
        <LapisanPanggilan
          panggilan={sekarang}
          nm_poli="FARMASI"
          labelAtas="FARMASI · PENYERAHAN OBAT"
          namaTampil={sekarang.nm_pasien}
          keterangan={[tampilNomor ? `Resep ${sekarang.no_reg}` : '', sekarang.nm_poli ?? ''].filter(Boolean).join(' · ')}
          teksBawah={<>Silakan ke <span className="font-bold">loket penyerahan obat</span></>}
        />
      )}

      {(status === 'terputus' || statusDaftar === 'gagal') && (
        <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-rose-600 px-4 py-1.5 text-base font-semibold text-white shadow-lg">
          <WifiOff className="h-4 w-4" /> Koneksi ke server antrian terputus, mencoba menyambung…
        </div>
      )}

      {dev && (
        <button
          type="button"
          onClick={() => { void simulasiPanggil(tanggalDev); }}
          className="absolute right-12 top-3 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow opacity-60 hover:opacity-100"
        >
          DEV: simulasi penyerahan
        </button>
      )}
    </div>
    </KanvasTV>
  );
}
