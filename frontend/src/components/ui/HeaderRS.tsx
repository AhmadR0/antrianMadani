import logo from '../../assets/logo.jpeg';
import JamSekarang from './JamSekarang';

type Props = { judul: string; subjudul: string };

// Header bersama: logo + judul besar (nama RS di dashboard, nama poli di layar antrian) di kiri, jam di kanan.
export default function HeaderRS({ judul, subjudul }: Props) {
  return (
    <header className="flex items-center justify-between px-12 pt-8 pb-4">
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-rs-kartu shadow-md flex items-center justify-center overflow-hidden">
          <img src={logo} alt="Logo RSUD Madani" className="h-14 w-14 object-contain" />
        </div>
        <div>
          <div className="text-lg font-semibold uppercase tracking-widest text-rs-tinta-lembut">{subjudul}</div>
          <div className="mt-1 text-4xl font-bold tracking-tight text-rs-tinta leading-none">{judul}</div>
        </div>
      </div>
      <JamSekarang />
    </header>
  );
}
