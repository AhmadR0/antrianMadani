import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

// Halaman pemeriksaan kemampuan browser TV. Buka /cek di BrowseHere, foto layarnya.
// Tidak memakai komponen lain supaya tetap tampil walau Tailwind/font gagal.

type Baris = { nama: string; nilai: string; ok?: boolean };

function cek(): Baris[] {
  const v = document.createElement('video');
  const can = (t: string) => v.canPlayType(t) || 'tidak';
  const sup = (prop: string, val: string) => {
    try { return typeof CSS !== 'undefined' && CSS.supports(prop, val); } catch { return false; }
  };
  const adaFullscreen = typeof (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen === 'function';
  let ls = false;
  try { localStorage.setItem('cek', '1'); localStorage.removeItem('cek'); ls = true; } catch { ls = false; }

  return [
    { nama: 'User agent', nilai: navigator.userAgent },
    { nama: 'Layar (screen)', nilai: `${screen.width} x ${screen.height}, DPR ${window.devicePixelRatio}` },
    { nama: 'Viewport (window)', nilai: `${window.innerWidth} x ${window.innerHeight}` },
    { nama: 'EventSource (SSE)', nilai: typeof EventSource !== 'undefined' ? 'ada' : 'tidak ada', ok: typeof EventSource !== 'undefined' },
    { nama: 'localStorage', nilai: ls ? 'bisa' : 'tidak bisa', ok: ls },
    { nama: 'Fullscreen API', nilai: adaFullscreen ? 'ada' : 'tidak ada', ok: adaFullscreen },
    { nama: 'Video MP4 H.264', nilai: can('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'), ok: !!v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') },
    { nama: 'Video WebM VP9', nilai: can('video/webm; codecs="vp9"'), ok: !!v.canPlayType('video/webm; codecs="vp9"') },
    { nama: 'Audio MP3', nilai: can('audio/mpeg'), ok: !!v.canPlayType('audio/mpeg') },
    { nama: 'CSS oklch (Tailwind v4)', nilai: sup('color', 'oklch(0.5 0.1 180)') ? 'ya' : 'tidak', ok: sup('color', 'oklch(0.5 0.1 180)') },
    { nama: 'CSS color-mix (Tailwind v4)', nilai: sup('color', 'color-mix(in oklab, red, blue)') ? 'ya' : 'tidak', ok: sup('color', 'color-mix(in oklab, red, blue)') },
    { nama: 'CSS @property / registerProperty', nilai: 'registerProperty' in CSS ? 'ya' : 'tidak', ok: 'registerProperty' in CSS },
    { nama: 'CSS grid', nilai: sup('display', 'grid') ? 'ya' : 'tidak', ok: sup('display', 'grid') },
    { nama: 'CSS backdrop-filter', nilai: sup('backdrop-filter', 'blur(4px)') ? 'ya' : 'tidak', ok: sup('backdrop-filter', 'blur(4px)') },
    { nama: 'Bahasa', nilai: navigator.language },
    { nama: 'Waktu perangkat', nilai: new Date().toString() },
  ];
}

export default function Cek() {
  const [baris, setBaris] = useState<Baris[]>([]);
  const [tombol, setTombol] = useState('belum ada tombol ditekan');
  useEffect(() => {
    setBaris(cek());
    const h = (e: KeyboardEvent) => setTombol(`key="${e.key}" code="${e.code}" keyCode=${e.keyCode}`);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', fontSize: 22, background: '#fff', color: '#111', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40, margin: '0 0 8px' }}>Cek browser TV</h1>
      <p style={{ margin: '0 0 24px', color: '#555' }}>Foto layar ini dan kirim. Tekan tombol remote untuk melihat kode tombol.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 160, height: 60, background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>inline CSS</div>
        <div className="flex h-[60px] w-40 items-center justify-center bg-rs-primer text-white">Tailwind</div>
        <div className="flex h-[60px] w-40 items-center justify-center bg-rs-primer/40 text-rs-tinta">Tailwind /40</div>
        <div className="flex h-[60px] w-40 items-center justify-center rounded-2xl bg-rs-primer-lembut font-sans font-bold text-rs-primer-gelap">Font</div>
      </div>
      <p style={{ marginBottom: 24 }}>Kotak 1 dan 2 harus sama warnanya. Kotak 3 lebih pucat. Kotak 4 bersudut bulat, font tebal.</p>

      <p style={{ marginBottom: 24, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>Tombol remote terakhir: <b>{tombol}</b></p>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {baris.map((b) => (
            <tr key={b.nama} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 8px', width: 360, fontWeight: 600 }}>{b.nama}</td>
              <td style={{ padding: '10px 8px', wordBreak: 'break-all' }}>
                {b.ok === undefined ? null : b.ok
                  ? <Check style={{ display: 'inline', color: '#16a34a', verticalAlign: 'middle', marginRight: 8 }} />
                  : <X style={{ display: 'inline', color: '#dc2626', verticalAlign: 'middle', marginRight: 8 }} />}
                {b.nilai}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
