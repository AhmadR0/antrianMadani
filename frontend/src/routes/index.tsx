import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Display from '../pages/Display';
import Cek from '../pages/Cek';
import PoliDalam from '../pages/PoliDalam';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/display/:kd_poli" element={<Display />} />
        <Route path="/cek" element={<Cek />} />
        {/* Halaman percobaan lama, dibiarkan sampai layar per poli jadi */}
        <Route path="/poli-dalam" element={<PoliDalam />} />
      </Routes>
    </BrowserRouter>
  );
}
