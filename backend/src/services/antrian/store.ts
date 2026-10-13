import { EventEmitter } from 'events';
import { Panggilan } from './types';

// Satu-satunya pemilik "state" antrian di sisi web.
// Khanza hanya menulis sinyal ke antripoli; detail dan riwayat disimpan di sini (memori).
// Satu layar TV = satu poli, jadi semua pembacaan diindeks dengan kd_poli.
class AntrianStore extends EventEmitter {
  private urut = 0;
  private terakhirPerPoli = new Map<string, Panggilan>(); // key: kd_poli
  private riwayat: Panggilan[] = [];
  private readonly MAKS_RIWAYAT = 200;

  nextId() { return ++this.urut; }

  catat(p: Panggilan, umumkan: boolean) {
    this.terakhirPerPoli.set(p.kd_poli, p);
    this.riwayat.unshift(p);
    if (this.riwayat.length > this.MAKS_RIWAYAT) this.riwayat.pop();
    if (umumkan) this.emit('panggil', p);
  }

  // Panggilan terakhir satu poli, atau null kalau belum ada sejak backend menyala.
  terakhir(kdPoli: string): Panggilan | null {
    return this.terakhirPerPoli.get(kdPoli) ?? null;
  }

  // Riwayat satu poli, terbaru dulu (termasuk yang terakhir).
  riwayatUntuk(kdPoli: string, limit = 10): Panggilan[] {
    return this.riwayat.filter((p) => p.kd_poli === kdPoli).slice(0, limit);
  }
}

export const antrianStore = new AntrianStore();
