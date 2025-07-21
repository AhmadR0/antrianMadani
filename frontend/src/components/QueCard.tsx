// src/components/QueueCard.tsx
type QueueCardProps = {
  title: string;
  number: string;
};

export default function QueueCard({ title, number }: QueueCardProps) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <span className="text-4xl font-bold text-blue-600">{number}</span>
    </div>
  );
}
