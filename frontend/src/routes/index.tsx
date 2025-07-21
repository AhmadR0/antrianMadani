import {Route,Routes,BrowserRouter} from 'react-router-dom';
import PoliDalam from '../pages/PoliDalam';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoliDalam />} />
        {/* <Route path="/farmasi" element={<Farmasi />} /> */}
        
      </Routes>
    </BrowserRouter>
  );
}