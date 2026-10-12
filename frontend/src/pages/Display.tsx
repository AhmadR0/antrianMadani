import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { cariPoli } from '../config/poli';
import { hapusPilihanLayar } from '../lib/pilihanLayar';
import HeaderRS from '../components/ui/HeaderRS';
import LatarMedis from '../components/ui/LatarMedis';

// KERANGKA SEMENTARA. Layar antrian per poli yang sebenarnya dibangun di tahap berikutnya.
// Saat ini hanya memastikan route /display/:kd_poli ada dan nama poli tampil besar,
// supaya operator langsung tahu kalau salah pilih.

export default function Display() {
  const { kd_poli } = useParams<{ kd_poli: string }>();
  const navigate = useNavigate();
  const poli = cariPoli(kd_poli);

  const gantiPoli = () => {
    hapusPilihanLayar();
    navigate('/');
  };

  if (!poli) {
    return (
      <div className="relative min-h-screen w-screen flex flex-col items-center justify-center gap-6 p-10 text-center">
        <LatarMedis />
        <p className="text-4xl font-bold text-red-600">Kode poli "{kd_poli}" tidak dikenal</p>
        <Link to="/" className="text-2xl font-semibold text-rs-primer underline">Kembali ke pemilih layar</Link>
      </div>
    );
  }

  const Ikon = poli.ikon;
  return (
    <div className="relative min-h-screen w-screen flex flex-col">
      <LatarMedis />
      <HeaderRS subjudul={poli.nm_poli} />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${poli.warnaLembut}`}>
          <Ikon className={`h-12 w-12 ${poli.warnaKuat}`} strokeWidth={2.2} />
        </div>
        <p className="text-5xl font-bold tracking-tight text-rs-tinta">{poli.nm_poli}</p>
        <p className="text-xl text-rs-tinta-lembut">Layar antrian untuk poli ini akan dibangun pada tahap berikutnya.</p>
        <button
          type="button"
          onClick={gantiPoli}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-rs-garis bg-rs-kartu px-8 py-4 text-xl font-bold text-rs-tinta
                     transition hover:bg-slate-50 focus:outline-none focus:border-rs-tinta focus:ring-4 focus:ring-slate-300/60"
        >
          <RotateCcw className="h-5 w-5" /> Ganti poli
        </button>
      </main>
    </div>
  );
}
