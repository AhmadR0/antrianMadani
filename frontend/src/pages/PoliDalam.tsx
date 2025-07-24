// src/pages/PoliDalam.tsx
import MainLayout from "../layouts/MainLayout";
import { speakAntrian } from "../controllers/SpeechToText";

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

    const doctorsOnDuty = [
        { name: "dr. Rina, SpPD", specialization: "Penyakit Dalam" },
        { name: "dr. Andi, SpPD", specialization: "Penyakit Dalam" },
    ];


    const handleClick = () => {
        speakAntrian(currentQueue.number, currentQueue.name, "Poli Penyakit dalam")
    }


    return (
        <MainLayout>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <h1 className="text-2xl font-bold text-center text-green-600">Antrian Poliklinik</h1>

                {/* Nomor antrian aktif */}
                <button 
         className="p-0 m-0 text-red-300" 
         onClick={handleClick}
         >
             tes 
         </button>
                <div className="bg-white rounded-2xl shadow p-6 text-center w-full max-w-md mx-auto flex flex-col justify-center min-h-[172px]">
                    <p className="text-gray-500 mb-2 text-base">Sedang Dilayani</p>
                    <h2 className="text-5xl font-bold text-green-700">{currentQueue.name}</h2>
                    <p className="text-xl text-gray-700 mt-2 font-semibold">Poli dalam</p>
                </div>




                <div className="text-xl flex items-between gap-2">
                    {/* Daftar antrian selanjutnya */}

                    {/* Daftar Dokter Bertugas */}
                    <div className="bg-white rounded-xl shadow p-4 w-full max-w-3xl mx-auto">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Dokter yang Bertugas</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {doctorsOnDuty.map((doc, index) => (
                                <div key={index} className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
                                    <h4 className="text-md font-bold text-green-800">{doc.name}</h4>
                                    <p className="text-sm text-gray-700">{doc.specialization}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
