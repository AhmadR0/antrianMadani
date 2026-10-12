type Props = { teks: string };

// Teks berjalan di bawah layar. Animasi CSS murni (rs-marquee di index.css), tanpa <marquee>.
export default function RunningText({ teks }: Props) {
  return (
    <div className="flex h-16 items-center overflow-hidden rounded-2xl bg-rs-primer text-white shadow-md">
      <div className="rs-marquee whitespace-nowrap text-2xl font-semibold">{teks}</div>
    </div>
  );
}
