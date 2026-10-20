import type { Poli } from '../../config/poli';
import type { DokterBertugas, Panggilan } from '../../types/antrian';
import { inisialDokter, jamPendek, sedangPraktik } from '../../lib/jamPraktik';

type Props = {
  poli: Poli;
  sekarang: Panggilan | null;
  namaTampil: string;        // nama pasien sesudah aturan penyamaran poli ini
  dokter: DokterBertugas[];
  now: Date;
  mode: 'tumpuk' | 'kolom';  // tumpuk: kartu bertumpuk di kolom kiri (ada video); kolom: satu kolom penuh per poli
  jumlahPoli: number;         // berapa kartu di layar, menentukan berapa baris dokter yang muat
};

// Satu blok per poli di layar multi-poli (koridor): kepala berwarna poli, nomor terakhir dipanggil,
// lalu dokter bertugas hari ini. Semua informasi satu poli ada di satu blok.
export default function KartuPoli({ poli, sekarang, namaTampil, dokter, now, mode, jumlahPoli }: Props) {
  const Ikon = poli.ikon;
  const kolom = mode === 'kolom';
  // Tiga tingkat ukuran: kolom penuh (tanpa video), tumpuk 2 poli (lega), tumpuk 3 poli (padat, ~260 px per kartu).
  const padat = !kolom && jumlahPoli >= 3;
  const maksDokter = kolom ? 3 : padat ? 1 : 2;
  const u = kolom
    ? { nomor: 'text-[9rem]',  nama: 'text-4xl', pemanggil: 'mt-1 text-2xl', foto: 'h-16 w-16 text-xl', dnama: 'text-2xl', djam: 'text-lg',  baris: 'px-3 py-2' }
    : padat
      ? { nomor: 'text-[4.5rem]', nama: 'text-3xl', pemanggil: 'text-base',    foto: 'h-[52px] w-[52px] text-lg', dnama: 'text-xl', djam: 'text-sm', baris: 'px-3 py-1.5' }
      : { nomor: 'text-[5.5rem]', nama: 'text-3xl', pemanggil: 'text-xl',      foto: 'h-14 w-14 text-lg', dnama: 'text-xl', djam: 'text-base', baris: 'px-3 py-2' };
  const tampil = dokter.slice(0, maksDokter);
  const sisa = dokter.length - tampil.length;

  return (
    <section className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border-2 border-rs-garis/70 bg-rs-kartu shadow-md ${kolom ? 'p-6' : 'p-5'}`}>
      {/* Kepala: ikon + nama poli */}
      <div className="flex shrink-0 items-center gap-4">
        <div className={`flex shrink-0 items-center justify-center rounded-2xl ${poli.warnaLembut} ${kolom ? 'h-16 w-16' : 'h-12 w-12'}`}>
          <Ikon className={`${poli.warnaKuat} ${kolom ? 'h-8 w-8' : 'h-6 w-6'}`} strokeWidth={2.2} />
        </div>
        <p className={`line-clamp-2 font-bold leading-tight text-rs-tinta ${kolom ? 'text-4xl' : 'text-[2rem]'}`}>{poli.nm_poli}</p>
      </div>

      {/* Nomor terakhir dipanggil */}
      <div className={`flex min-h-0 items-center gap-5 overflow-hidden ${kolom ? 'mt-6 flex-1 flex-col justify-center text-center' : 'mt-2 flex-1'}`}>
        {sekarang ? (
          <>
            <div className={`shrink-0 font-bold leading-none tabular-nums tracking-tight text-rs-tinta ${u.nomor}`}>
              {sekarang.no_reg}
            </div>
            <div className="min-w-0">
              <p className={`font-bold leading-tight text-rs-tinta ${padat ? 'line-clamp-1' : 'line-clamp-2'} ${u.nama}`}>{namaTampil || '-'}</p>
              <p className={`truncate text-rs-tinta-lembut ${u.pemanggil}`}>{sekarang.nm_dokter}</p>
            </div>
          </>
        ) : (
          <p className={`text-rs-tinta-lembut ${kolom ? 'text-3xl' : 'py-3 text-2xl'}`}>Menunggu panggilan</p>
        )}
      </div>

      {/* Dokter bertugas hari ini */}
      <div className={`shrink-0 border-t border-rs-garis ${kolom ? 'mt-4 pt-4' : 'mt-2 pt-2'}`}>
        {!padat && <p className={`font-semibold tracking-widest text-rs-tinta-lembut ${kolom ? 'mb-3 text-base' : 'mb-2 text-sm'}`}>DOKTER HARI INI</p>}
        {dokter.length === 0 ? (
          <p className={`text-rs-tinta-lembut ${kolom ? 'text-xl' : 'text-base'}`}>{padat ? 'Tidak ada jadwal dokter hari ini.' : 'Tidak ada jadwal.'}</p>
        ) : (
          <ul className={`flex flex-col ${kolom ? 'gap-3' : 'gap-2'}`}>
            {tampil.map((d) => {
              const praktik = sedangPraktik(d.jam_mulai, d.jam_selesai, now);
              return (
                <li key={`${d.kd_dokter}-${d.jam_mulai}`} className={`flex items-center gap-3 rounded-2xl ${u.baris} ${praktik ? 'bg-rs-primer-lembut' : 'bg-slate-50'}`}>
                  {d.foto ? (
                    <img src={d.foto} alt={d.nm_dokter} className={`shrink-0 rounded-xl object-cover ${u.foto}`} />
                  ) : (
                    <div className={`flex shrink-0 items-center justify-center rounded-xl bg-rs-kartu font-bold text-rs-primer-gelap shadow-sm ${u.foto}`}>
                      {inisialDokter(d.nm_dokter)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-bold text-rs-tinta ${u.dnama}`}>{d.nm_dokter}</p>
                    <p className={`tabular-nums text-rs-tinta-lembut ${u.djam}`}>
                      {jamPendek(d.jam_mulai)} – {jamPendek(d.jam_selesai)}
                      {praktik && <span className="ml-3 font-semibold text-rs-primer-gelap">● Sedang praktik</span>}
                    </p>
                  </div>
                </li>
              );
            })}
            {sisa > 0 && <li className="text-sm font-semibold text-rs-tinta-lembut">+{sisa} dokter lainnya</li>}
          </ul>
        )}
      </div>
    </section>
  );
}
