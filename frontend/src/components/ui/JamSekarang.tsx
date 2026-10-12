import { useEffect, useState } from 'react';

// Jam dan tanggal yang diperbarui tiap detik. Dipakai di header dashboard dan layar antrian.
export default function JamSekarang() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const jam = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const tanggal = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  return (
    <div className="text-right leading-none">
      <div className="text-5xl font-semibold tabular-nums tracking-tight text-rs-tinta">{jam.replace('.', ':')}</div>
      <div className="mt-2 text-lg text-rs-tinta-lembut">{tanggal}</div>
    </div>
  );
}
