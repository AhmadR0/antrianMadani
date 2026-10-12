// Penyamaran nama pasien untuk layar publik (format A + pengaman nama satu kata).
// "Nyonya NI KADEK DARMANI" -> "Nyonya NI K. D."
// "Tuan JAELANTI"           -> "Tuan J*******"   (nama satu kata tetap disamarkan)
// Sapaan di depan (Tuan/Nyonya/Nona/Anak/Bayi atau singkatannya) dipertahankan.

const SAPAAN = new Set(['tuan', 'nyonya', 'nona', 'anak', 'bayi', 'tn', 'tn.', 'ny', 'ny.', 'nn', 'nn.', 'an', 'an.', 'by', 'by.']);

export function samarkanNama(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return '';

  let sapaan = '';
  if (SAPAAN.has(kata[0].toLowerCase())) sapaan = kata.shift() as string;
  if (kata.length === 0) return sapaan;

  let hasil: string;
  if (kata.length === 1) {
    const k = kata[0];
    hasil = k[0] + '*'.repeat(Math.min(Math.max(k.length - 1, 2), 7));
  } else {
    hasil = [kata[0], ...kata.slice(1).map((k) => k[0].toUpperCase() + '.')].join(' ');
  }
  return sapaan ? `${sapaan} ${hasil}` : hasil;
}
