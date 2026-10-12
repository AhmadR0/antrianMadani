import { useCallback, useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAntrianEvents } from "../hooks/useAntrianEvents";
import type { Panggilan } from "../types/antrian";

const API_URL = import.meta.env.VITE_API_URL;
const DISPLAY_ID = 1; // sementara; nanti dari route /display/:id (Tahap 2)

type DokterTugas = {
    nama_dokter: string;
    nama_poli: string;
};

export default function PoliDalamPage() {
    // Panggilan yang sedang ditampilkan besar. Datang dari Khanza lewat backend (SSE).
    const [sedangDipanggil, setSedangDipanggil] = useState<Panggilan | null>(null);
    const onPanggil = useCallback((p: Panggilan) => setSedangDipanggil(p), []);
    const { terakhir, status } = useAntrianEvents(DISPLAY_ID, onPanggil);

    const [doctorsOnDuty, setDoctorsOnDuty] = useState<DokterTugas[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDokter = async () => {
            try {
                const response = await fetch(`${API_URL}/tesApi/jadwalAntrian1`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                setDoctorsOnDuty(await response.json());
            } catch (err) {
                console.error("Gagal ambil data dokter dari API", err);
                setError("Gagal mengambil data dokter");
            } finally {
                setLoading(false);
            }
        };

        fetchDokter();
    }, []);

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto p-2 space-y-4">
                <h1 className="text-2xl font-bold text-center text-green-600">Antrian Poliklinik</h1>
                <p className="text-center text-xs text-gray-400">koneksi: {status}</p>

                {/* Panggilan aktif */}
                <div className="bg-white rounded-2xl shadow p-6 text-center w-full max-w-md mx-auto flex flex-col justify-center min-h-[172px]">
                    {sedangDipanggil ? (
                        <>
                            <p className="text-gray-500 mb-2 text-base">Nomor Antrian</p>
                            <h2 className="text-6xl font-bold text-green-700">{sedangDipanggil.no_reg}</h2>
                            <p className="text-2xl text-gray-800 mt-2 font-semibold">{sedangDipanggil.nm_pasien || "-"}</p>
                            <p className="text-lg text-gray-600">{sedangDipanggil.nm_poli} · {sedangDipanggil.nm_dokter}</p>
                        </>
                    ) : (
                        <p className="text-gray-400 text-xl">Menunggu panggilan...</p>
                    )}
                </div>

                {/* Panggilan terakhir per poli */}
                {terakhir.length > 0 && (
                    <div className="bg-white rounded-xl shadow p-4 w-full max-w-3xl mx-auto">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Terakhir dipanggil</h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {terakhir.map((p) => (
                                <div key={p.kd_poli} className="flex justify-between border-b border-gray-100 py-1 text-sm">
                                    <span className="text-gray-700">{p.nm_poli}</span>
                                    <span className="font-bold text-green-700">{p.no_reg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dokter Bertugas */}
                <div className="text-xl flex items-between gap-2">
                    <div className="bg-white rounded-xl shadow p-8 w-full max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold mb-6 text-gray-700 text-center">Dokter yang Bertugas</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {loading ? (
                                <p className="text-gray-500">Memuat data dokter...</p>
                            ) : error ? (
                                <p className="text-red-600">{error}</p>
                            ) : doctorsOnDuty.length === 0 ? (
                                <p className="text-gray-500">Tidak ada dokter bertugas hari ini</p>
                            ) : (
                                doctorsOnDuty.map((doc, index) => (
                                    <div
                                        key={index}
                                        className="bg-green-50 rounded-lg shadow p-4 border border-green-200"
                                    >
                                        <h4 className="text-md font-bold text-green-800">{doc.nama_dokter}</h4>
                                        <p className="text-sm text-gray-700">{doc.nama_poli}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
