// import React,()
import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.jpeg'

type Props = {
    children: React.ReactNode;
}
export default function MainLayout({ children }: Props) {

    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formarDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date);
    }
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className='min-w-screen bg-green-400 p-4 text-white font-bold py-4 px-6 flex justify-between items-center shadow'>
                <div className='text-xl font-bold flex items-center gap-2'>
                    RSUD MADANI
                    <img src={logo} alt="Logo RSUD Madani" className="h-12 w-12 object-contain" />
                </div>
                <div className='text-2xl font-mono'>
                    {formarDate(dateTime)}
                </div>
            </header>
            <main className='flex-grow text-black p-12 overflow-auto min-h-[calc(100vh-128px)]'>
                {children} {/* <-- Ini tempat render isi halaman */}
            </main>
            <footer className='w-full bg-green-500 text-white py-3 px-6 text-sm shadow text-center'>
                <span>
                    Selamat berkunjung dan sehat selalu | Kontak yang bisa dihubungi: (0451) 491605
                </span>
            </footer>

        </div>
    );
}
