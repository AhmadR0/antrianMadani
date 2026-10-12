import type { Panggilan } from '../../types/antrian';

type Props = {
  sekarang: Panggilan | null;
  namaTampil: string; // nama pasien yang sudah melewati aturan penyamaran poli
  sebelumnya: Panggilan[];
};

// Panel kiri mode idle: nomor terakhir dipanggil, nama pasien, dokter, dan beberapa nomor sebelumnya.
// Saat panggilan baru, yang tampil adalah LapisanPanggilan (ambil alih layar), panel ini tetap di belakang.
export default function PanelPanggilan({ sekarang, namaTampil, sebelumnya }: Props) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[32px] bg-rs-kartu p-10 text-rs-tinta shadow-md">
      <p className="text-2xl font-semibold tracking-widest text-rs-tinta-lembut">
        {sekarang ? 'TERAKHIR DIPANGGIL' : 'NOMOR ANTRIAN'}
      </p>

      <div className="flex flex-1 flex-col justify-center">
        {sekarang ? (
          <>
            <div className="font-bold leading-none tabular-nums tracking-tight" style={{ fontSize: '15rem' }}>
              {sekarang.no_reg}
            </div>
            <p className="mt-6 line-clamp-2 text-5xl font-bold leading-tight">{namaTampil || '-'}</p>
            <p className="mt-3 text-3xl text-rs-tinta-lembut">{sekarang.nm_dokter}</p>
          </>
        ) : (
          <p className="text-4xl text-rs-tinta-lembut">Menunggu panggilan</p>
        )}
      </div>

      {sebelumnya.length > 0 && (
        <div className="flex items-center gap-4 border-t border-rs-garis pt-6">
          <span className="text-xl text-rs-tinta-lembut">Sebelumnya</span>
          {sebelumnya.map((p) => (
            <span key={p.id} className="rounded-xl bg-slate-100 px-4 py-1.5 text-3xl font-bold tabular-nums text-rs-tinta">
              {p.no_reg}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
