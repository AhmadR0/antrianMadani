// Latar halaman: warna dasar + dua cahaya lembut teal dan biru di sudut.
// Diletakkan absolute di belakang konten, tidak menangkap klik.
export default function LatarMedis() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-rs-latar">
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-teal-200/40 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 h-[720px] w-[720px] rounded-full bg-sky-200/40 blur-3xl" />
    </div>
  );
}
