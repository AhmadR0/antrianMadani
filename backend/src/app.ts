import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import dokteRoutes from '../src/routes/dokterRoutes'
import tesApiRoutes from '../src/routes/tesORMRoutes'
import antrianRoutes from './routes/antrianRoutes'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.use("/getDokter",dokteRoutes)
app.use('/tesApi',tesApiRoutes)
app.use('/antrian', antrianRoutes)

export default app;