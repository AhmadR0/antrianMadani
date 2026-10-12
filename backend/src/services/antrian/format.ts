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
