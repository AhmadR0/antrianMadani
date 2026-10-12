import { EventEmitter } from 'events';
import { Panggilan } from './types';

// Satu-satunya pemilik "state" antrian di sisi web.
// Khanza hanya menulis sinyal ke antripoli; detail dan riwayat disimpan di sini (memori).
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

  terakhir(kdPoli: string[]): Panggilan[] {
    return kdPoli
      .map((k) => this.terakhirPerPoli.get(k))
      .filter((p): p is Panggilan => !!p);
  }

  riwayatUntuk(kdPoli: string[], limit = 20): Panggilan[] {
    const set = new Set(kdPoli);
    return this.riwayat.filter((p) => set.has(p.kd_poli)).slice(0, limit);
  }
}

export const antrianStore = new AntrianStore();
