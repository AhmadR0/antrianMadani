import { semuaDokter,namaDokter } from "../controllers/DokterCrud";
import express from 'express';

const route = express.Router();

route.get('/',semuaDokter);
route.get('/dokter',namaDokter);


export default route;