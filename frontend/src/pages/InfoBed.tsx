import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CircleAlert } from 'lucide-react';
import KanvasTV from '../components/ui/KanvasTV';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';
import RunningText from '../components/display/RunningText';
import KartuBangsal from '../components/info/KartuBangsal';
import { useInfoBed, type BangsalBed, type HitunganBed } from '../hooks/useInfoBed';
import { hapusPilihanLayar } from '../lib/pilihanLayar';
import { jamMenitRS } from '../lib/jamPraktik';

// Layar informasi tempat tidur: ringkasan rumah sakit di atas, kartu per bangsal di bawah.
// Kalau bangsal lebih dari satu halaman, halaman berganti otomatis.

// Grid 3 kolom x 2 baris = 6 "satuan" per halaman. Kartu dengan >= 3 kelas memakai 2 satuan
// (setinggi dua baris, satu kolom penuh) supaya baris kelasnya tidak mepet.
const SATUAN_PER_HALAMAN = 6;
const kartuTinggi = (b: BangsalBed) => b.kelas.length >= 3;
const bobot = (b: BangsalBed) => (kartuTinggi(b) ? 2 : 1);

// Membagi daftar bangsal ke halaman berdasarkan bobot; kartu tinggi ditaruh di depan tiap halaman.
function bagiHalaman(daftar: BangsalBed[]): BangsalBed[][] {
  const halaman: BangsalBed[][] = [];
  let sekarang: BangsalBed[] = [];
  let terisi = 0;
  for (const b of daftar) {
    const w = bobot(b);
    if (terisi + w > SATUAN_PER_HALAMAN) { halaman.push(sekarang); sekarang = []; terisi = 0; }
    sekarang.push(b);
    terisi += w;
  }
  if (sekarang.length) halaman.push(sekarang);
  return halaman.map((h) => [...h].sort((a, b) => bobot(b) - bobot(a)));
}
const DURASI_HALAMAN_MS = 12_000;
const RUNNING_TEXT =
  'Informasi ketersediaan tempat tidur diperbarui otomatis dari sistem rumah sakit. Untuk pendaftaran rawat inap silakan ke bagian admisi.';

// Tombol kembali remote TV / Escape: keluar ke dashboard pemilih layar.
const tombolKembali = (e: KeyboardEvent) =>
  e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.key === 'BrowserBack' ||
  e.keyCode === 461 || e.keyCode === 10009;

function Ringkasan({ r, diperbarui, gagal }: { r: HitunganBed; diperbarui: string; gagal: boolean }) {
  const persen = r.total === 0 ? 0 : Math.round(((r.total - r.kosong) / r.total) * 100);
  const jam = jamMenitRS(new Date(diperbarui));
  const Angka = ({ label, nilai, warna = 'text-rs-tinta' }: { label: string; nilai: number | string; warna?: string }) => (
    <div className="rounded-[24px] bg-rs-kartu px-8 py-5 shadow-sm border-2 border-rs-garis/70">
      <div className="text-base font-semibold uppercase tracking-widest text-rs-tinta-lembut">{label}</div>
      <div className={`mt-1 text-5xl font-extrabold leading-none tabular-nums ${warna}`}>{nilai}</div>
    </div>
  );
  return (
    <div className="flex items-stretch gap-5">
      <div className="flex flex-1 items-center gap-5 rounded-[24px] bg-rs-primer px-8 text-white shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <BedDouble className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-3xl font-bold leading-tight">Ketersediaan Tempat Tidur</div>
          <div className="mt-1 flex items-center gap-2 text-lg text-white/80">
            Diperbarui {jam}
            {gagal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-sm font-semibold text-amber-950">
                <CircleAlert className="h-4 w-4" /> koneksi terganggu, data terakhir
              </span>
            )}
          </div>
        </div>
      </div>
      <Angka label="Total" nilai={r.total} />
      <Angka label="Terisi" nilai={r.terisi} warna="text-rose-600" />
      <Angka label="Kosong" nilai={r.kosong} warna="text-emerald-600" />
      <Angka label="Keterisian" nilai={`${persen}%`} warna="text-rs-primer" />
    </div>
  );
}

export default function InfoBed() {
  const navigate = useNavigate();
  const { data, status } = useInfoBed();
  const [halaman, setHalaman] = useState(0);

  const halamanBangsal = useMemo(() => (data ? bagiHalaman(data.bangsal) : []), [data]);
  const jumlahHalaman = Math.max(1, halamanBangsal.length);

  // Ganti halaman otomatis kalau bangsal tidak muat satu layar.
  useEffect(() => {
    if (jumlahHalaman <= 1) { setHalaman(0); return; }
    const t = setInterval(() => setHalaman((h) => (h + 1) % jumlahHalaman), DURASI_HALAMAN_MS);
    return () => clearInterval(t);
  }, [jumlahHalaman]);

  // Tombol kembali: lupakan pilihan TV ini dan kembali ke dashboard.
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

  const tampil = halamanBangsal[halaman] ?? [];

  return (
    <KanvasTV>
      <div className="relative grid h-full w-full grid-rows-[auto_auto_1fr_auto] gap-6 overflow-hidden px-12 pb-6">
        <LatarMedis />
        <HeaderRS judul="Informasi Tempat Tidur" subjudul="RSUD Madani" />

        {data ? (
          <Ringkasan r={data.ringkasan} diperbarui={data.diperbarui} gagal={status === 'gagal'} />
        ) : (
          <div className="h-[116px] rounded-[24px] bg-rs-kartu/60" />
        )}

        <section className="relative min-h-0">
          {!data && (
            <div className="flex h-full items-center justify-center text-3xl font-semibold text-rs-tinta-lembut">
              {status === 'gagal' ? 'Tidak dapat terhubung ke server. Mencoba lagi…' : 'Memuat data tempat tidur…'}
            </div>
          )}
          {data && (
            <div key={halaman} className="rs-masuk grid h-full grid-flow-dense grid-cols-3 grid-rows-2 gap-5">
              {tampil.map((b) => <KartuBangsal key={b.kd_bangsal} bangsal={b} tinggi={kartuTinggi(b)} />)}
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
