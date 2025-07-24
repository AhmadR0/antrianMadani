import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import dokteRoutes from '../src/routes/dokterRoutes'
import tesApiRoutes from '../src/routes/tesORMRoutes'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.use("/getDokter",dokteRoutes)
app.use('/tesApi',tesApiRoutes)

export default app;