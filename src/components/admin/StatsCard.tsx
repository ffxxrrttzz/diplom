import { LucideIcon } from 'lucide-react';

export default function StatsCard({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: LucideIcon; 
  label: string; 
  value: number | string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-violet-500/10 rounded-2xl">
          <Icon className="w-9 h-9 text-violet-400" />
        </div>
        <div>
          <p className="text-gray-400 text-lg">{label}</p>
          <p className="text-5xl font-bold mt-2 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}