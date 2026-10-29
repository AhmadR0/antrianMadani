import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CircleAlert } from 'lucide-react';
import KanvasTV from '../components/ui/KanvasTV';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import RunningText from '../components/display/RunningText';
import KartuJadwalPoli from '../components/info/KartuJadwalPoli';
import { useInfoJadwal } from '../hooks/useInfoJadwal';
import { hapusPilihanLayar } from '../lib/pilihanLayar';
import { jamMenitRS } from '../lib/jamPraktik';

// Layar jadwal dokter hari ini untuk semua poli. Kartu per poli, 6 per halaman (3 kolom x 2 baris), berganti otomatis.

const PER_HALAMAN = 6;
const DURASI_HALAMAN_MS = 12_000;
const RUNNING_TEXT =
  'Jadwal dokter dapat berubah sewaktu-waktu sesuai kondisi pelayanan. Informasi lebih lanjut silakan hubungi petugas pendaftaran.';

const tombolKembali = (e: KeyboardEvent) =>
  e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.key === 'BrowserBack' ||
  e.keyCode === 461 || e.keyCode === 10009;

const tanggalPanjang = (tanggal: string) =>
  new Date(`${tanggal}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function InfoJadwal() {
  const navigate = useNavigate();
  const { data, status } = useInfoJadwal();
  const [halaman, setHalaman] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const jumlahHalaman = data ? Math.max(1, Math.ceil(data.poli.length / PER_HALAMAN)) : 1;

  // Jam dipakai untuk tanda "sedang praktik"; cukup diperbarui tiap 30 detik.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (jumlahHalaman <= 1) { setHalaman(0); return; }
    const t = setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), DURASI_HALAMAN_MS);
    return () => clearInterval(t);
  }, [jumlahHalaman]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!tombolKembali(e)) return;
      e.preventDefault();
      hapusPilihanLayar();
      navigate('/');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navigate]);

  const tampil = data ? data.poli.slice(halaman * PER_HALAMAN, (halaman + 1) * PER_HALAMAN) : [];
  const jamDiperbarui = data
    ? jamMenitRS(new Date(data.diperbarui))
    : '';

  return (
    <KanvasTV>
      <div className="relative grid h-full w-full grid-rows-[auto_auto_1fr_auto] gap-6 overflow-hidden px-12 pb-6">
        <LatarMedis />
        <HeaderRS judul="Jadwal Dokter Hari Ini" subjudul="RSUD Madani" />

        {data ? (
          <div className="flex items-center gap-5 rounded-[24px] bg-rs-primer px-8 py-5 text-white shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <CalendarDays className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold leading-tight">{tanggalPanjang(data.tanggal)}</div>
              <div className="mt-1 flex items-center gap-2 text-lg text-white/80">
                {data.jumlah_dokter} dokter di {data.poli.length} poli · Diperbarui {jamDiperbarui}
                {status === 'gagal' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-sm font-semibold text-amber-950">
                    <CircleAlert className="h-4 w-4" /> koneksi terganggu, data terakhir
                  </span>
                )}
              </div>
            </div>
            {jumlahHalaman > 1 && (
              <div className="text-xl font-semibold text-white/80">Halaman {halaman + 1} / {jumlahHalaman}</div>
            )}
          </div>
        ) : (
          <div className="h-[104px] rounded-[24px] bg-rs-kartu/60" />
        )}

        <section className="relative min-h-0">
          {!data && (
            <div className="flex h-full items-center justify-center text-3xl font-semibold text-rs-tinta-lembut">
              {status === 'gagal' ? 'Tidak dapat terhubung ke server. Mencoba lagi…' : 'Memuat jadwal dokter…'}
            </div>
          )}
          {data && data.poli.length === 0 && (
            <div className="flex h-full items-center justify-center text-3xl font-semibold text-rs-tinta-lembut">
              Tidak ada jadwal praktik dokter hari ini.
            </div>
          )}
          {data && data.poli.length > 0 && (
            <div key={halaman} className="rs-masuk grid h-full grid-cols-3 grid-rows-2 gap-5">
              {tampil.map((p) => <KartuJadwalPoli key={p.kd_poli} poli={p} now={now} />)}
            </div>
          )}
          {jumlahHalaman > 1 && (
            <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {Array.from({ length: jumlahHalaman }, (_, i) => (
                <span key={i} className={`h-2.5 rounded-full transition-all ${i === halaman ? 'w-8 bg-rs-primer' : 'w-2.5 bg-rs-garis'}`} />
              ))}
            </div>
          )}
        </section>

        <RunningText teks={RUNNING_TEXT} />
      </div>
    </KanvasTV>
  );
}
