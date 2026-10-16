import { useEffect, useRef, useState } from 'react';
import { MonitorPlay } from 'lucide-react';

type Props = {
  playlist: string[];
  senyap: boolean; // true saat mode panggil: suara dimatikan dan gambar diredupkan
  bisu?: boolean;  // pengaturan TV: video selalu tanpa suara (mis. dua TV berhadapan)
};

// Area video/iklan. Memutar playlist berurutan dan berulang.
// Kalau playlist kosong, tampil panel pengganti supaya layout tetap terlihat.
export default function AreaVideo({ playlist, senyap, bisu = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [indeks, setIndeks] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = senyap || bisu;
  }, [senyap, bisu]);

  const berikutnya = () => setIndeks((i) => (i + 1) % Math.max(playlist.length, 1));

  return (
    <section
      className={`relative h-full overflow-hidden rounded-[32px] bg-rs-tinta shadow-md transition-opacity duration-300
        ${senyap ? 'opacity-40' : 'opacity-100'}`}
    >
      {playlist.length > 0 ? (
        <video
          ref={videoRef}
          key={playlist[indeks]}
          src={playlist[indeks]}
          autoPlay
          muted={bisu}
          playsInline
          onEnded={berikutnya}
          onError={berikutnya}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-teal-700 via-sky-800 to-rs-tinta text-white/80">
          <MonitorPlay className="h-20 w-20" strokeWidth={1.5} />
          <p className="text-3xl font-semibold">Area video &amp; informasi</p>
          <p className="text-xl text-white/60">Playlist belum diatur</p>
        </div>
      )}
    </section>
  );
}
