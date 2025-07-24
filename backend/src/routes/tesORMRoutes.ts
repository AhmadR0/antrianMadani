import express from 'express';
import { OrmCrudControler,getJadwalDokter } from '../controllers/OrmTesterControllers';


const route = express.Router();

route.get('/',OrmCrudControler);
route.get('/jadwalAntrian1',getJadwalDokter);

export default route