import type { Panggilan } from '../../types/antrian';

type Props = {
  sekarang: Panggilan | null;
  namaTampil: string;          // nama pasien yang sudah melewati aturan penyamaran poli
  sebelumnya: Panggilan[];
  pakaiNomor?: boolean;        // poli yang namanya disamarkan: nomor urut ditampilkan sebagai pegangan pasien
  namaSebelumnya?: (p: Panggilan) => string; // nama (sudah disamarkan bila perlu) untuk daftar "sebelumnya"
};

// Panel kiri mode idle. Kebijakan RS: pasien dipanggil dengan NAMA, jadi nama yang besar, bukan nomor.
// Saat panggilan baru, yang tampil adalah LapisanPanggilan (ambil alih layar), panel ini tetap di belakang.
export default function PanelPanggilan({ sekarang, namaTampil, sebelumnya, pakaiNomor = false, namaSebelumnya }: Props) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[32px] bg-rs-kartu p-10 text-rs-tinta shadow-md">
      <p className="text-2xl font-semibold tracking-widest text-rs-tinta-lembut">
        {sekarang ? 'TERAKHIR DIPANGGIL' : 'PANGGILAN PASIEN'}
      </p>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {sekarang ? (
          <>
            {pakaiNomor && (
              <div className="font-bold leading-none tabular-nums tracking-tight" style={{ fontSize: '11rem' }}>
                {sekarang.no_reg}
              </div>
            )}
            <p className={`line-clamp-3 font-bold leading-tight ${pakaiNomor ? 'mt-6 text-5xl' : 'text-7xl'}`}>{namaTampil || '-'}</p>
            <p className="mt-4 text-3xl text-rs-tinta-lembut">{sekarang.nm_dokter}</p>
          </>
        ) : (
          <p className="text-4xl text-rs-tinta-lembut">Menunggu panggilan</p>
        )}
      </div>

      {sebelumnya.length > 0 && (
        <div className="border-t border-rs-garis pt-5">
          <p className="mb-2 text-lg text-rs-tinta-lembut">Sebelumnya</p>
          <ul className="flex flex-col gap-1">
            {sebelumnya.map((p) => (
              <li key={p.id} className="truncate text-2xl font-semibold text-rs-tinta">
                {pakaiNomor ? <span className="mr-3 tabular-nums">{p.no_reg}</span> : null}
                {namaSebelumnya ? namaSebelumnya(p) : p.nm_pasien}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
