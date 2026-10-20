// Mengikuti kebiasaan aplikasi lama: gelar singkat dibaca penuh saat dipanggil.
const GELAR: Array<[RegExp, string]> = [
  [/^Tn\.?\s*/i, 'Tuan '],
  [/^Ny\.?\s*/i, 'Nyonya '],
  [/^Nn\.?\s*/i, 'Nona '],
  [/^An\.?\s*/i, 'Anak '],
  [/^By\.?\s*/i, 'Bayi '],
];

export const formatNamaPasien = (nama: string | null | undefined): string => {
  let n = (nama ?? '').trim();
  for (const [re, ganti] of GELAR) {
    if (re.test(n)) { n = n.replace(re, ganti); break; }
  }
  return n.replace(/\s+/g, ' ').trim();
};

// Huruf kapital semua ("SITI AMINAH") kadang dieja per huruf oleh mesin TTS; ubah ke Kapital Tiap Kata.
export const teksUcapNama = (nama: string): string =>
  nama.toLowerCase().replace(/(^|\s)(\S)/g, (_m, spasi: string, h: string) => spasi + h.toUpperCase());

// "KLINIK BEDAH" -> "Poli Bedah"
export const teksUcapPoli = (nm_poli: string): string =>
  'Poli ' + teksUcapNama(nm_poli.replace(/^\s*(klinik|poli)\s+/i, '').trim());

// Kalimat panggilan. Kebijakan RS: pasien dipanggil dengan NAMA. Di poli yang namanya disamarkan,
// nama tidak disebut (nomor urutnya dibunyikan TV dari klip lokal), hanya arah tujuan.
export const kalimatPanggilan = (nm_pasien: string, nm_poli: string, sebutNama: boolean): string =>
  sebutNama
    ? `Atas nama ${teksUcapNama(nm_pasien)}, silakan menuju ${teksUcapPoli(nm_poli)}.`
    : `Silakan menuju ${teksUcapPoli(nm_poli)}.`;
