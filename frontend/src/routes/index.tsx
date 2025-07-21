import {Route,Routes,BrowserRouter} from 'react-router-dom';
import HomePage from '../pages/HomePages';
import PoliDalam from '../pages/PoliDalam';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/poli-dalam" element={<PoliDalam />} />
        {/* Tambahkan route lain seperti /poli-gigi, /poli-anak, dll */}
      </Routes>
    </BrowserRouter>
  );
}
