
import MainLayout from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

const poliList = [
  {
    name: "Antrian 1",
    route: "/poli-dalam",
    description: "Menangani penyakit dalam seperti diabetes, hipertensi, dll",
  },
  {
    name: "Antrian 2",
    route: "/poli-gigi",
    description: "Layanan kesehatan gigi dan mulut",
  },
  {
    name: "Antrian 3",
    route: "/poli-anak",
    description: "Khusus untuk anak-anak & bayi",
  },
  // Tambah poli lain sesuai kebutuhan
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleClick = (route: string) => {
    navigate(route);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-8">Pilih Poli Antrian</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {poliList.map((poli, index) => (
            <div
              key={index}
              onClick={() => handleClick(poli.route)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-green-200 p-6"
            >
              <h2 className="text-xl font-bold text-green-800">{poli.name}</h2>
              <p className="text-gray-600 mt-2 text-sm">{poli.description}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
