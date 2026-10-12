import { useEffect, useRef, useState } from "react";
import type { DisplayConfig, Panggilan } from "../types/antrian";

const API_URL = import.meta.env.VITE_API_URL;

type Status = "menghubungkan" | "terhubung" | "terputus";

/**
 * Berlangganan event panggilan untuk satu layar lewat Server-Sent Events.
 * - `terakhir`: panggilan terakhir per poli (dikirim backend saat koneksi dibuka).
 * - `panggilan`: panggilan baru yang masuk, satu per satu, lewat callback.
 * EventSource otomatis menyambung ulang kalau koneksi putus.
 */
export function useAntrianEvents(displayId: number, onPanggil: (p: Panggilan) => void) {
  const [display, setDisplay] = useState<DisplayConfig | null>(null);
  const [terakhir, setTerakhir] = useState<Panggilan[]>([]);
  const [status, setStatus] = useState<Status>("menghubungkan");
  const onPanggilRef = useRef(onPanggil);
  onPanggilRef.current = onPanggil;

  useEffect(() => {
    const es = new EventSource(`${API_URL}/antrian/events?display=${displayId}`);
    es.onopen = () => setStatus("terhubung");
    es.onerror = () => setStatus("terputus");
    es.addEventListener("state", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { display: DisplayConfig; terakhir: Panggilan[] };
      setDisplay(data.display);
      setTerakhir(data.terakhir);
    });
    es.addEventListener("panggil", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as Panggilan;
      setTerakhir((prev) => [p, ...prev.filter((x) => x.kd_poli !== p.kd_poli)]);
      onPanggilRef.current(p);
    });
    return () => es.close();
  }, [displayId]);

  return { display, terakhir, status };
}
