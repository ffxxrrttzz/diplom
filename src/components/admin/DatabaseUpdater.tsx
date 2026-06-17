'use client';

import { useState } from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DatabaseUpdater({ onUpdate }: { onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'top' | 'popular'>('top');
  const [limit, setLimit] = useState(30); // значение по умолчанию

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
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка синхронизации');

      setMessage(`✅ Успешно!\n\n` +
                 `Обработано: ${data.processed}\n` +
                 `Новых добавлено: ${data.added}\n` +
                 `Обновлено: ${data.updated}\n\n` +
                 `${data.message || ''}`);
      
      onUpdate?.();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Database className="w-8 h-8 text-emerald-400" />
        <h2 className="text-2xl font-semibold">Массовая синхронизация Kinopoisk</h2>
      </div>

      <div className="space-y-6">
        {/* Выбор режима */}
        <div>
          <p className="text-gray-400 mb-2">Режим синхронизации</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('top')} 
              className={`flex-1 py-3 rounded-2xl font-medium transition ${mode === 'top' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              ТОП-250
            </button>
            <button 
              onClick={() => setMode('popular')} 
              className={`flex-1 py-3 rounded-2xl font-medium transition ${mode === 'popular' ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              Популярные
            </button>
          </div>
        </div>

        {/* Выбор количества */}
        <div>
          <p className="text-gray-400 mb-2">Количество тайтлов</p>
          <div className="flex gap-3">
            {[10, 25, 50, 75, 100].map((num) => (
              <button
                key={num}
                onClick={() => setLimit(num)}
                className={`px-5 py-2.5 rounded-2xl font-medium transition flex-1 ${
                  limit === num 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
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
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded-2xl px-5 py-3 text-center focus:outline-none focus:border-emerald-500"
            placeholder="Или введите своё значение (макс. 150)"
          />
        </div>
      </div>

      <button
        onClick={runMassUpdate}
        disabled={loading}
        className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-2xl font-medium flex items-center justify-center gap-3 text-lg transition disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RefreshCw className="animate-spin" size={24} />
            Синхронизация... (может занять время)
          </>
        ) : (
          <>
            <RefreshCw size={24} />
            Запустить синхронизацию ({limit} тайтлов)
          </>
        )}
      </button>

      {message && (
        <pre className="mt-6 p-5 bg-gray-950 border border-gray-800 rounded-2xl text-sm whitespace-pre-wrap overflow-auto max-h-80 font-mono">
          {message}
        </pre>
      )}

      <p className="text-xs text-gray-500 mt-6 text-center">
        Рекомендуется не больше 100 за один запуск (ограничения API)
      </p>
    </div>
  );
}