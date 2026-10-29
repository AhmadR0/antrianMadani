import { useEffect, useState } from 'react';
import { jamMenitRS, tanggalPanjangRS } from '../../lib/jamPraktik';

// Jam dan tanggal (WITA, tidak ikut zona waktu perangkat) yang diperbarui tiap detik. Dipakai di header dashboard dan layar antrian.
export default function JamSekarang() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const jam = jamMenitRS(now);
  const tanggal = tanggalPanjangRS(now);

  return (
    <div className="text-right leading-none">
      <div className="text-5xl font-semibold tabular-nums tracking-tight text-rs-tinta">{jam}</div>
      <div className="mt-2 text-lg text-rs-tinta-lembut">{tanggal}</div>
    </div>
  );
}
