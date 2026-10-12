import { useEffect, useState } from 'react';

// Kanvas berukuran tetap 1920x1080 yang diskalakan agar muat utuh di jendela apa pun.
// Semua ukuran di dalamnya ditulis untuk 1080p; browser laptop, TV 720p, atau TV 4K
// hanya mengubah skalanya, bukan susunannya. Memakai transform: scale (didukung WebView lama).

export const LEBAR_KANVAS = 1920;
export const TINGGI_KANVAS = 1080;

function hitungSkala() {
  return Math.min(window.innerWidth / LEBAR_KANVAS, window.innerHeight / TINGGI_KANVAS);
}

export default function KanvasTV({ children }: { children: React.ReactNode }) {
  const [skala, setSkala] = useState(hitungSkala);

  useEffect(() => {
    const perbarui = () => setSkala(hitungSkala());
    window.addEventListener('resize', perbarui);
    return () => window.removeEventListener('resize', perbarui);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-rs-latar">
      <div
        style={{
          width: LEBAR_KANVAS,
          height: TINGGI_KANVAS,
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${skala})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
