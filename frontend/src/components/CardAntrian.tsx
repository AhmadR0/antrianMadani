interface Props{
    nomor: string;
    nama: string;
    status: 'Dipanggil' | 'Menunggu';
}

export const CardAntrian = ({ nomor, nama, status }: Props) => {
    return (
        <div className="p-4 bg-white text-black rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold">{nomor}</h2>
        <p className="text-lg">{nama}</p>
        <span className={`text-sm font-semibold ${status === "Dipanggil" ? "text-green-600" : "text-yellow-500"}`}>
            {status}
        </span>
        </div>
    );
}