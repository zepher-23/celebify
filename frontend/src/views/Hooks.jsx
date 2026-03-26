import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, CheckCircle, Database } from 'lucide-react';

export function Hooks() {
  const [hooks, setHooks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchHooks = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/hooks');
      const data = await res.json();
      setHooks(data);
    } catch (err) {
      console.error('Failed to fetch hooks:', err);
    }
  };

  useEffect(() => {
    fetchHooks();
    const interval = setInterval(fetchHooks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/hooks/generate', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to generate. Check backend logs.');
      }
      await fetchHooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/hooks/${id}`, { method: 'DELETE' });
      setHooks(hooks.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete hook:', err);
    }
  };

  const unusedHooks = hooks.filter(h => !h.used);
  const usedHooks = hooks.filter(h => h.used);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-500" />
            Viral Hook Bank
          </h1>
          <p className="text-slate-400 mt-2">Manage the AI-generated hooks that the automation pipeline draws from natively.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating 10 Hooks...' : 'Generate 10 Hooks'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Unused Hooks */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Available Hooks Bank</h2>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              {unusedHooks.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {unusedHooks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900 border-dashed">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No unused hooks available. Auto-replenish will trigger upon next generation, or you can generate them manually.</p>
              </div>
            ) : (
              unusedHooks.map(hook => (
                <div key={hook.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all shadow-md group">
                  <p className="text-slate-200 font-medium text-sm sm:text-base leading-relaxed">
                    "{hook.text}"
                  </p>
                  <button 
                    onClick={() => handleDelete(hook.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-4 flex-shrink-0"
                    title="Remove irrelevant hook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Used/Archived Hooks */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-400">Archived (Used)</h2>
            <span className="text-slate-500 text-xs font-semibold">
              {usedHooks.length} Published
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {usedHooks.length === 0 ? (
              <p className="text-sm text-center text-slate-600 py-8 border border-slate-800 rounded-xl border-dashed">
                None used yet.
              </p>
            ) : (
              usedHooks.map(hook => (
                <div key={hook.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl opacity-60">
                  <p className="text-slate-400 text-sm line-clamp-2 italic">
                    {hook.text}
                  </p>
                  <div className="flex items-center text-emerald-500/70 text-[10px] uppercase tracking-wider font-bold mt-2">
                    <CheckCircle className="w-3 h-3 mr-1" /> Consumed
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
