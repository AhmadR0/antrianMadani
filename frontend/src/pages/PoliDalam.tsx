import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { speakAntrian } from "../controllers/SpeechToText";

type DokterTugas = {
    nama_dokter: string;
    nama_poli: string;
};

export default function PoliDalamPage() {
    const currentQueue = {
        number: "A012",
        name: "Ahmad Radifa",
    };

    const nextQueues = [
        { number: "A013", name: "Budi" },
        { number: "A014", name: "Citra" },
        { number: "A015", name: "Dewi" },
    ];

    const [doctorsOnDuty, setDoctorsOnDuty] = useState<DokterTugas[]>([]);

    const handleClick = () => {
        speakAntrian(currentQueue.number, currentQueue.name, "Poli Penyakit dalam");
    };

    useEffect(() => {
        const fetchDokter = async () => {
            try {
                const response = await fetch("http://localhost:8000/tesApi/jadwalAntrian1");
                const data = await response.json();
                setDoctorsOnDuty(data); // Data dari controller kamu yang udah benar
            } catch (err) {
                console.error("Gagal ambil data dokter dari API", err);
            }
        };

        fetchDokter();
    }, []);

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto p-2 space-y-4">
                <h1 className="text-2xl font-bold text-center text-green-600">Antrian Poliklinik</h1>

                {/* <button className="p-0 m-0 text-red-300" onClick={handleClick}>
                    tes
                </button> */}

                {/* Antrian Aktif */}
                <div className="bg-white rounded-2xl shadow p-6 text-center w-full max-w-md mx-auto flex flex-col justify-center min-h-[172px]">
                    <p className="text-gray-500 mb-2 text-base">Sedang Dilayani</p>
                    <h2 className="text-5xl font-bold text-green-700">{currentQueue.name}</h2>
                    <p className="text-xl text-gray-700 mt-2 font-semibold">Poli dalam</p>
                </div>

                {/* Dokter Bertugas */}
                <div className="text-xl flex items-between gap-2">
                    <div className="bg-white rounded-xl shadow p-8 w-full max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold mb-6 text-gray-700 text-center">Dokter yang Bertugas</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {doctorsOnDuty.length === 0 ? (
                                <p className="text-gray-500">Loading data dokter...</p>
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
