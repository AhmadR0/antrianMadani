import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Display from '../pages/Display';
import Cek from '../pages/Cek';
import InfoBed from '../pages/InfoBed';
import InfoJadwal from '../pages/InfoJadwal';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/display/:kd_poli" element={<Display />} />
        <Route path="/info/bed" element={<InfoBed />} />
        <Route path="/info/jadwal" element={<InfoJadwal />} />
        <Route path="/cek" element={<Cek />} />
      </Routes>
    </BrowserRouter>
  );
}
