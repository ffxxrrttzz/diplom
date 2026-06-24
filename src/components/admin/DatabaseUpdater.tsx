'use client';

import { useState } from 'react';
import { RefreshCw, Database, Film } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DatabaseUpdater({ onUpdate }: { onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'top' | 'popular'>('top');
  const [limit, setLimit] = useState(30);

  const runMassUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/update-kinopoisk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode, 
          limit: Number(limit),
          requirePoster: true   // ← новое
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка синхронизации');

      setMessage(`✅ Успешно!\n\n` +
                 `Обработано: ${data.processed}\n` +
                 `Добавлено: ${data.added}\n` +
                 `Обновлено: ${data.updated}\n` +
                 `Пропущено (без постера): ${data.skipped || 0}\n\n` +
                 `${data.message || ''}`);
      
      onUpdate?.();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runSeasonUpdate = async () => {
    setLoadingSeasons(true);
    setMessage('Запуск синхронизации сезонов и серий...');

    try {
      const res = await fetch('/api/admin/update-seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка');

      setMessage(`✅ Сезоны и серии обновлены!\n\n` +
                 `Обработано сериалов: ${data.processed}\n` +
                 `Добавлено сезонов: ${data.seasonsAdded}\n` +
                 `Добавлено серий: ${data.episodesAdded}`);
      
      onUpdate?.();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoadingSeasons(false);
    }
  };

  return (
    <div className="bg-[#121216] rounded-3xl p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Database className="text-purple-500" size={28} />
        <h2 className="text-2xl text-[#d9d9d9] font-semibold">Синхронизация с Kinopoisk</h2>
      </div>

      <div className="space-y-8 flex-1">
        {/* Основная синхронизация */}
        <div className="space-y-6">
          <div>
            <p className="text-gray-400 mb-2">Режим синхронизации</p>
            <div className="flex gap-2">
              <button onClick={() => setMode('top')} className={`flex-1 py-3 rounded-2xl font-medium transition ${mode === 'top' ? 'bg-purple-600' : 'bg-[#09090b] hover:bg-zinc-800'}`}>
                ТОП-250
              </button>
              <button onClick={() => setMode('popular')} className={`flex-1 py-3 rounded-2xl font-medium transition ${mode === 'popular' ? 'bg-purple-600' : 'bg-[#09090b] hover:bg-zinc-800'}`}>
                Популярные
              </button>
            </div>
          </div>

          <div>
            <p className="text-gray-400 mb-2">Количество тайтлов</p>
            <div className="flex gap-3 flex-wrap">
              {[10, 25, 50, 75, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => setLimit(num)}
                  className={`px-6 py-2.5 rounded-2xl font-medium transition ${limit === num ? 'bg-purple-600' : 'bg-[#09090b] hover:bg-zinc-800'}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="5"
              max="150"
              value={limit}
              onChange={(e) => setLimit(Math.min(150, Math.max(5, Number(e.target.value))))}
              className="mt-3 w-full bg-[#09090b] rounded-2xl px-5 py-3 text-center focus:outline-none focus:border-purple-600"
            />
          </div>

          <button
            onClick={runMassUpdate}
            disabled={loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-2xl font-medium flex items-center justify-center gap-3 transition"
          >
            {loading ? (
              <> <RefreshCw className="animate-spin" size={24} /> Синхронизация...</>
            ) : (
              <> <Film size={24} /> Синхронизировать {limit} тайтлов (только с постером) </>
            )}
          </button>
        </div>

        {/* Синхронизация сезонов */}
        <div className="pt-6 border-t border-zinc-800">
          <button
            onClick={runSeasonUpdate}
            disabled={loadingSeasons}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 rounded-2xl font-medium flex items-center justify-center gap-3 transition"
          >
            {loadingSeasons ? (
              <> <RefreshCw className="animate-spin" size={24} /> Обновление сезонов...</>
            ) : (
              <> <Database size={24} /> Синхронизировать сезоны и серии </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Обновляет сезоны и эпизоды для уже существующих сериалов/аниме
          </p>
        </div>
      </div>

      {message && (
        <pre className="mt-6 p-5 bg-gray-950 border border-gray-800 rounded-2xl text-sm whitespace-pre-wrap overflow-auto max-h-80 font-mono">
          {message}
        </pre>
      )}
    </div>
  );
}