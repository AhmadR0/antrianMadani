import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { cariPoli, type Poli } from '../config/poli';
import { bacaPengaturanTv, hapusPilihanLayar, simpanPengaturanTv, type PengaturanTv } from '../lib/pilihanLayar';
import { sedangPraktik } from '../lib/jamPraktik';
import { samarkanNama } from '../lib/samarkanNama';
import { bunyikanPanggilan, pemutarSuara, siapkanSuara } from '../lib/suaraAntrian';
import { useAntrianEvents } from '../hooks/useAntrianEvents';
import { useDokterBertugas } from '../hooks/useDokterBertugas';
import type { Panggilan } from '../types/antrian';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import KanvasTV from '../components/ui/KanvasTV';
import GerbangMulai from '../components/display/GerbangMulai';
import PanelPanggilan from '../components/display/PanelPanggilan';
import KartuDokter from '../components/display/KartuDokter';
import KartuPoli from '../components/display/KartuPoli';
import AreaVideo from '../components/display/AreaVideo';
import RunningText from '../components/display/RunningText';
import LapisanPanggilan from '../components/display/LapisanPanggilan';
import { API_URL } from '../lib/api';

// Kebijakan RS: pasien dipanggil dengan NAMA, bukan nomor urut; nomor hanya dipakai di poli yang namanya disamarkan.
// Layar antrian. URL /display/U0003 = satu poli (ruang tunggu poli), /display/U0004,U0005,U0011 =
// layar koridor untuk beberapa poli (maks 3). Alur: gerbang "Mulai Tampilan" -> mode idle (video)
// -> saat ada panggilan dari Khanza (lewat backend, SSE), lapisan ambil alih selama DURASI_PANGGIL_MS
// atau sampai suaranya selesai -> idle. Dokter bertugas dari jadwal Khanza lewat backend.

const DURASI_PANGGIL_MS = 8000;      // minimal; diperpanjang kalau suaranya lebih lama
const JEDA_SETELAH_SUARA_MS = 1500;
const JEDA_ANTAR_PANGGILAN_MS = 600; // layar multi-poli: jeda antara dua panggilan yang bergiliran
const JUMLAH_SEBELUMNYA = 3;
const MAKS_POLI = 3;
const RUNNING_TEXT =
  'Selamat datang di RSUD Madani. Mohon menunggu dengan tenang, pasien akan dipanggil dengan nama sesuai urutan. ' +
  'Informasi dan pengaduan: (0451) 491605.';
// Daftar video idle. Kosong = tampil panel pengganti. Nanti diatur lewat halaman pengaturan.
const PLAYLIST: string[] = [];

// Kelas kolom ditulis lengkap supaya terdeteksi Tailwind.
const KOLOM_DOKTER: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };
const KOLOM_POLI: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };

// Tombol "kembali" di berbagai remote/browser TV: Escape, Backspace, Android TV (461), Tizen (10009), webOS (461).
function tombolKembali(e: KeyboardEvent): boolean {
  return e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.key === 'BrowserBack'
    || e.keyCode === 461 || e.keyCode === 10009;
}

// Minta backend menulis antripoli persis seperti Khanza; panggilannya datang kembali lewat SSE.
async function simulasiPanggil(kd_poli: string) {
  try {
    const res = await fetch(`${API_URL}/antrian/simulasi/panggil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kd_poli }),
    });
    if (!res.ok) console.error('[simulasi]', await res.text());
  } catch (err) {
    console.error('[simulasi]', err);
  }
}

const namaUntukTampil = (poli: Poli, p: Panggilan) => (poli.samarkanNama ? samarkanNama(p.nm_pasien) : p.nm_pasien);

export default function Display() {
  const { kd_poli } = useParams<{ kd_poli: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // "U0003" atau "U0004,U0005,U0011" -> daftar poli yang dikenal
  const daftarKd = [...new Set((kd_poli ?? '').split(',').map((k) => k.trim()).filter(Boolean))].slice(0, MAKS_POLI);
  const daftarPoli = daftarKd.map(cariPoli).filter((p): p is Poli => !!p);
  const semuaDikenal = daftarPoli.length === daftarKd.length && daftarPoli.length > 0;

  // Hanya di dev: ?mulai=1 lewati gerbang, ?demo=1 langsung simulasi satu panggilan.
  const dev = import.meta.env.DEV;
  const [mulai, setMulai] = useState(dev && params.get('mulai') === '1');
  // Pengaturan per TV (video & suaranya), diingat di localStorage TV ini. Dev: ?video=0 untuk mencoba tanpa video.
  const [pengaturan, setPengaturan] = useState<PengaturanTv>(() => {
    const p = bacaPengaturanTv();
    return dev && params.get('video') === '0' ? { ...p, video: false } : p;
  });
  const ubahPengaturan = (p: PengaturanTv) => { setPengaturan(p); simpanPengaturanTv(p); };

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

  if (!semuaDikenal) {
    return (
      <div className="relative flex min-h-screen w-screen flex-col items-center justify-center gap-6 p-10 text-center">
        <LatarMedis />
        <p className="text-4xl font-bold text-red-600">Kode poli "{kd_poli}" tidak dikenal</p>
        <Link to="/" className="text-2xl font-semibold text-rs-primer underline">Kembali ke pemilih layar</Link>
      </div>
    );
  }

  const pertama = daftarPoli[0];
  const judul = daftarPoli.map((p) => p.nm_poli).join(' · ');

  if (!mulai) {
    return (
      <KanvasTV>
      <GerbangMulai
        nm_poli={judul}
        Ikon={pertama.ikon}
        warnaLembut={pertama.warnaLembut}
        warnaKuat={pertama.warnaKuat}
        pengaturan={pengaturan}
        onUbahPengaturan={ubahPengaturan}
        onMulai={() => { void siapkanSuara(); setMulai(true); }} // siapkan audio selagi masih ada gestur pengguna
        onGanti={gantiPoli}
      />
      </KanvasTV>
    );
  }

  const demo = dev && params.get('demo') === '1';
  return daftarPoli.length === 1
    ? <TampilanPoli poli={pertama} pengaturan={pengaturan} demo={demo} dev={dev} />
    : <TampilanMultiPoli daftar={daftarPoli} judul={judul} pengaturan={pengaturan} demo={demo} dev={dev} />;
}

// Jam sekarang, diperbarui tiap 30 detik, untuk tanda "sedang praktik".
function useJamSekarang() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function PilKoneksiPutus() {
  return (
    <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-rose-600 px-4 py-1.5 text-base font-semibold text-white shadow-lg">
      <WifiOff className="h-4 w-4" /> Koneksi ke server antrian terputus, mencoba menyambung…
    </div>
  );
}

// ======================= SATU POLI (ruang tunggu poli) =======================
// Bagian yang terhubung ke backend; dipasang hanya setelah gerbang dilewati.
function TampilanPoli({ poli, pengaturan, demo, dev }: { poli: Poli; pengaturan: PengaturanTv; demo: boolean; dev: boolean }) {
  const [sekarang, setSekarang] = useState<Panggilan | null>(null);
  const [sebelumnya, setSebelumnya] = useState<Panggilan[]>([]);
  const [modePanggil, setModePanggil] = useState(false);
  const timerRef = useRef<number | null>(null);
  // Salinan `sekarang` yang bisa dibaca di callback tanpa memanggil setState di dalam updater
  // (updater dijalankan dua kali di mode dev React, yang membuat "sebelumnya" terisi ganda).
  const sekarangRef = useRef<Panggilan | null>(null);
  useEffect(() => { sekarangRef.current = sekarang; }, [sekarang]);

  // Geser panggilan yang sedang tampil ke daftar "sebelumnya", tanpa duplikat.
  const geserKeSebelumnya = (lama: Panggilan) =>
    setSebelumnya((s) => [lama, ...s.filter((x) => x.id !== lama.id)].slice(0, JUMLAH_SEBELUMNYA));

  // Menerima satu panggilan baru: geser yang lama ke "sebelumnya", nyalakan mode panggil sebentar.
  const terimaPanggilan = useCallback((p: Panggilan) => {
    const lama = sekarangRef.current;
    if (lama && lama.id !== p.id) geserKeSebelumnya(lama);
    sekarangRef.current = p;
    setSekarang(p);
    setModePanggil(true);
    const pasangTimer = (ms: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setModePanggil(false), ms);
    };
    pasangTimer(DURASI_PANGGIL_MS);
    // Bunyikan nomor, lalu nama (tidak di poli yang namanya disamarkan). Mode panggil dipertahankan
    // sampai suaranya selesai kalau itu lebih lama dari durasi minimum.
    const mulai = Date.now();
    bunyikanPanggilan({ nama: poli.samarkanNama ? undefined : p.nm_pasien, no_reg: p.no_reg, nm_poli: poli.nm_poli })
      .catch((err) => console.warn('[suara]', err))
      .finally(() => {
        if (sekarangRef.current?.id !== p.id) return; // sudah ada panggilan lain
        const sisa = DURASI_PANGGIL_MS - (Date.now() - mulai);
        pasangTimer(Math.max(sisa, JEDA_SETELAH_SUARA_MS));
      });
  }, [poli.samarkanNama, poli.nm_poli]);
  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    pemutarSuara.hentikan();
  }, []);

  const { keadaan, status } = useAntrianEvents([poli.kd_poli], terimaPanggilan);
  const dokter = useDokterBertugas([poli.kd_poli])[poli.kd_poli] ?? [];

  // Saat koneksi (ulang) dibuka, backend mengirim keadaan poli: tampilkan tanpa mode panggil.
  // Panggilan yang masuk lewat event "panggil" sudah ditangani terimaPanggilan, jadi di sini id-nya sama dan dilewati.
  const keadaanPoli = keadaan[poli.kd_poli];
  useEffect(() => {
    if (!keadaanPoli?.terakhir) return;
    const t = keadaanPoli.terakhir;
    if (sekarangRef.current?.id === t.id) return;
    sekarangRef.current = t;
    setSekarang(t);
    setSebelumnya(keadaanPoli.riwayat.filter((p) => p.id !== t.id).slice(0, JUMLAH_SEBELUMNYA));
  }, [keadaanPoli]);

  const now = useJamSekarang();
  const simulasi = useCallback(() => { void simulasiPanggil(poli.kd_poli); }, [poli.kd_poli]);
  useEffect(() => {
    if (!demo) return;
    const t = window.setTimeout(simulasi, 800);
    return () => window.clearTimeout(t);
  }, [demo, simulasi]);

  const namaTampil = sekarang ? namaUntukTampil(poli, sekarang) : '';

  return (
    <KanvasTV>
    <div className="relative grid h-full w-full grid-rows-[auto_1fr_auto_auto] gap-6 overflow-hidden px-12 pb-6">
      <LatarMedis />
      <HeaderRS judul={poli.nm_poli} subjudul="RSUD Madani" />

      {pengaturan.video ? (
        <>
          {/* Dengan video: nomor di kiri, video di kanan, dokter di bawah */}
          <div className="grid min-h-0 grid-cols-[2fr_3fr] gap-6">
            <PanelPanggilan sekarang={sekarang} namaTampil={namaTampil} sebelumnya={sebelumnya} pakaiNomor={!!poli.samarkanNama} namaSebelumnya={(p) => namaUntukTampil(poli, p)} />
            <AreaVideo playlist={PLAYLIST} senyap={modePanggil} bisu={!pengaturan.suaraVideo} />
          </div>
          <section>
            <p className="mb-3 text-xl font-semibold tracking-widest text-rs-tinta-lembut">DOKTER BERTUGAS HARI INI</p>
            {dokter.length === 0 ? (
              <p className="text-2xl text-rs-tinta-lembut">Tidak ada jadwal dokter hari ini.</p>
            ) : (
              <div className={`grid gap-6 ${KOLOM_DOKTER[dokter.length] ?? 'grid-cols-4'}`}>
                {dokter.map((d) => (
                  <KartuDokter
                    key={`${d.kd_dokter}-${d.jam_mulai}`}
                    dokter={d}
                    sedangPraktik={sedangPraktik(d.jam_mulai, d.jam_selesai, now)}
                    kompak={dokter.length > 3}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Tanpa video (TV berhadapan): nomor di kiri, dokter mengisi kolom kanan, bertumpuk */}
          <div className="grid min-h-0 grid-cols-[2fr_3fr] gap-6">
            <PanelPanggilan sekarang={sekarang} namaTampil={namaTampil} sebelumnya={sebelumnya} pakaiNomor={!!poli.samarkanNama} namaSebelumnya={(p) => namaUntukTampil(poli, p)} />
            <section className="flex min-h-0 flex-col">
              <p className="mb-3 text-xl font-semibold tracking-widest text-rs-tinta-lembut">DOKTER BERTUGAS HARI INI</p>
              {dokter.length === 0 ? (
                <p className="text-2xl text-rs-tinta-lembut">Tidak ada jadwal dokter hari ini.</p>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-5">
                  {dokter.map((d) => (
                    <KartuDokter
                      key={`${d.kd_dokter}-${d.jam_mulai}`}
                      dokter={d}
                      sedangPraktik={sedangPraktik(d.jam_mulai, d.jam_selesai, now)}
                      kompak={dokter.length > 3}
                      besar={dokter.length <= 3}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <RunningText teks={RUNNING_TEXT} />

      {modePanggil && sekarang && (
        <LapisanPanggilan panggilan={sekarang} nm_poli={poli.nm_poli} namaTampil={namaTampil} pakaiNomor={!!poli.samarkanNama} />
      )}

      {status === 'terputus' && <PilKoneksiPutus />}

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

// ======================= BEBERAPA POLI (layar koridor) =======================
// Panggilan dari poli mana pun masuk ke antrean dan ditampilkan bergiliran, masing-masing minimal
// DURASI_PANGGIL_MS atau sampai suaranya selesai. Kartu per poli langsung diperbarui begitu panggilan masuk.
function TampilanMultiPoli({ daftar, judul, pengaturan, demo, dev }: {
  daftar: Poli[]; judul: string; pengaturan: PengaturanTv; demo: boolean; dev: boolean;
}) {
  const daftarKd = daftar.map((p) => p.kd_poli);
  const poliDari = (kd: string) => daftar.find((p) => p.kd_poli === kd);

  const [sekarang, setSekarang] = useState<Record<string, Panggilan | null>>({});
  const [aktif, setAktif] = useState<Panggilan | null>(null); // yang sedang ditampilkan di lapisan panggilan
  const aktifRef = useRef<Panggilan | null>(null);
  const antreanRef = useRef<Panggilan[]>([]);
  const timerRef = useRef<number | null>(null);

  const selesaikanAktif = useCallback(() => {
    aktifRef.current = null;
    setAktif(null);
    timerRef.current = window.setTimeout(() => prosesAntrean(), JEDA_ANTAR_PANGGILAN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambil panggilan berikutnya dari antrean, tampilkan, bunyikan; selesai -> giliran berikutnya.
  const prosesAntrean = useCallback(() => {
    if (aktifRef.current) return;
    const p = antreanRef.current.shift();
    if (!p) return;
    aktifRef.current = p;
    setAktif(p);
    const poli = poliDari(p.kd_poli);
    const mulai = Date.now();
    let timerMinimal: number | null = window.setTimeout(() => { timerMinimal = null; }, DURASI_PANGGIL_MS);
    bunyikanPanggilan({ nama: poli?.samarkanNama ? undefined : p.nm_pasien, no_reg: p.no_reg, nm_poli: poli?.nm_poli ?? p.nm_poli })
      .catch((err) => console.warn('[suara]', err))
      .finally(() => {
        if (aktifRef.current?.id !== p.id) return;
        const sisa = DURASI_PANGGIL_MS - (Date.now() - mulai);
        if (timerMinimal) window.clearTimeout(timerMinimal);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(selesaikanAktif, Math.max(sisa, JEDA_SETELAH_SUARA_MS));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selesaikanAktif]);

  const terimaPanggilan = useCallback((p: Panggilan) => {
    setSekarang((s) => ({ ...s, [p.kd_poli]: p }));
    antreanRef.current.push(p);
    prosesAntrean();
  }, [prosesAntrean]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    pemutarSuara.hentikan();
  }, []);

  const { keadaan, status } = useAntrianEvents(daftarKd, terimaPanggilan);
  const dokter = useDokterBertugas(daftarKd);

  // Keadaan awal / sambung ulang: isi nomor terakhir tiap poli tanpa membunyikan.
  useEffect(() => {
    setSekarang((s) => {
      const baru = { ...s };
      for (const kd of Object.keys(keadaan)) {
        const t = keadaan[kd].terakhir;
        if (t && baru[kd]?.id !== t.id) baru[kd] = t;
      }
      return baru;
    });
  }, [keadaan]);

  const now = useJamSekarang();
  useEffect(() => {
    if (!demo) return;
    const t = window.setTimeout(() => { void simulasiPanggil(daftarKd[0]); }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  const poliAktif = aktif ? poliDari(aktif.kd_poli) : undefined;
  const modePanggil = !!aktif;

  const kartu = (mode: 'tumpuk' | 'kolom') => daftar.map((poli) => {
    const p = sekarang[poli.kd_poli] ?? null;
    return (
      <KartuPoli
        key={poli.kd_poli}
        poli={poli}
        sekarang={p}
        namaTampil={p ? namaUntukTampil(poli, p) : ''}
        pakaiNomor={!!poli.samarkanNama}
        dokter={dokter[poli.kd_poli] ?? []}
        now={now}
        mode={mode}
        jumlahPoli={daftar.length}
      />
    );
  });

  return (
    <KanvasTV>
    <div className="relative grid h-full w-full grid-rows-[auto_1fr_auto] gap-6 overflow-hidden px-12 pb-6">
      <LatarMedis />
      <HeaderRS judul={judul} subjudul="RSUD Madani · Layar koridor" />

      {pengaturan.video ? (
        <div className="grid min-h-0 grid-cols-[1fr_1fr] gap-6">
          <div className="flex min-h-0 flex-col gap-4">{kartu('tumpuk')}</div>
          <AreaVideo playlist={PLAYLIST} senyap={modePanggil} bisu={!pengaturan.suaraVideo} />
        </div>
      ) : (
        <div className={`grid min-h-0 gap-6 ${KOLOM_POLI[daftar.length] ?? 'grid-cols-3'}`}>{kartu('kolom')}</div>
      )}

      <RunningText teks={RUNNING_TEXT} />

      {aktif && poliAktif && (
        <LapisanPanggilan
          panggilan={aktif}
          nm_poli={poliAktif.nm_poli}
          namaTampil={namaUntukTampil(poliAktif, aktif)}
          pakaiNomor={!!poliAktif.samarkanNama}
          multiPoli={{ Ikon: poliAktif.ikon, warnaLatar: poliAktif.warnaLatar }}
        />
      )}

      {status === 'terputus' && <PilKoneksiPutus />}

      {dev && (
        <div className="absolute right-12 top-3 flex gap-2">
          {daftar.map((p) => (
            <button
              key={p.kd_poli}
              type="button"
              onClick={() => { void simulasiPanggil(p.kd_poli); }}
              className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow opacity-60 hover:opacity-100"
            >
              DEV: panggil {p.kd_poli}
            </button>
          ))}
        </div>
      )}
    </div>
    </KanvasTV>
  );
}
