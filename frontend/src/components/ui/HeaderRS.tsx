import logo from '../../assets/logo.jpeg';
import JamSekarang from './JamSekarang';

type Props = { subjudul: string };

// Header bersama: logo + nama RS di kiri, jam di kanan.
export default function HeaderRS({ subjudul }: Props) {
  return (
    <header className="flex items-center justify-between px-12 pt-8 pb-4">
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-rs-kartu shadow-md flex items-center justify-center overflow-hidden">
          <img src={logo} alt="Logo RSUD Madani" className="h-14 w-14 object-contain" />
        </div>
        <div>
          <div className="text-3xl font-bold tracking-tight text-rs-tinta leading-none">RSUD Madani</div>
          <div className="mt-1.5 text-lg text-rs-tinta-lembut">{subjudul}</div>
        </div>
      </div>
      <JamSekarang />
    </header>
  );
}
