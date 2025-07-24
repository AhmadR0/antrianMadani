import { Dokter } from "../models/DokterModels";
import { Request,Response } from "express";

export const semuaDokter = async (req: Request, res: Response) => {
  try {
    const dokter = await Dokter.findAll();
    res.json(dokter);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil data dokter' });
  }
};

export const namaDokter = async (req: Request, res: Response) =>{
    try {
        const namaDokter = await Dokter.findAll({
            attributes:['nm_dokter']
        })
        res.json(namaDokter)
    } catch (error) {
        res.status(500).json({ error: 'Gagal ambil data dokter' });
    }
}