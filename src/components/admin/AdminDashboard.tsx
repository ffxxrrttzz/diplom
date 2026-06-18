'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, FileText, Star, MessageSquare, RefreshCw, X } from 'lucide-react';
import StatsCard from './StatsCard';
import UserManagement from './UserManagement';
import DatabaseUpdater from './DatabaseUpdater';

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_stats', {
        from_date: dateFrom || null,
        to_date: dateTo || null,
      });

      if (error) console.error('Ошибка статистики:', error);
      else setStats(data?.[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetDates = () => {
    setDateFrom('');
    setDateTo('');
  };

  useEffect(() => {
    fetchStats();
  }, [dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-[#09090b] py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl text-[#d9d9d9] font-bold">Админ-панель</h1>
            <p className="text-gray-400 mt-1">Управление платформой</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-800 text-[#d9d9d9] rounded-2xl transition disabled:opacity-70"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>

        {/* Фильтр по датам */}
        <div className="flex items-end gap-4 mb-10">
          <div>
            <p className="text-sm text-gray-400 mb-1">С</p>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#121216]  rounded-xl px-5 py-3 text-[#d9d9d9]"
            />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">По</p>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#121216] rounded-xl px-5 py-3 text-[#d9d9d9]"
            />
          </div>

          <button
            onClick={resetDates}
            className="mb-1 px-5 py-3 text-[#d9d9d9] bg-purple-600 hover:bg-purple-800 rounded-xl flex items-center gap-2 transition"
          >
            <X size={18} />
            Сбросить
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard icon={Users} label="Всего пользователей" value={stats?.total_users ?? 0} />
          <StatsCard icon={FileText} label="Постов" value={stats?.total_posts ?? 0} />
          <StatsCard icon={Star} label="Оценок" value={stats?.total_ratings ?? 0} />
          <StatsCard icon={MessageSquare} label="Тредов" value={stats?.total_threads ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DatabaseUpdater onUpdate={fetchStats} />
          <UserManagement />
        </div>
      </div>
    </div>
  );
}