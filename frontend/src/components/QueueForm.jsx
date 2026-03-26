import React, { useState } from 'react';
import axios from 'axios';
import { Send, Sparkles, Loader2, Calendar } from 'lucide-react';

export function QueueForm({ activeAccount, onSuccess }) {
  const [topic, setTopic] = useState('');
  const [customHook, setCustomHook] = useState('');
  
  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [runsPerDay, setRunsPerDay] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAccount) {
      alert("Please select an active Instagram account first from the top navbar.");
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      const payload = {
        topic,
        customHook,
        igAccountId: activeAccount,
        isScheduled,
        runsPerDay: isScheduled ? runsPerDay : null
      };

      await axios.post('/api/videos/generate', payload);
      
      setTopic('');
      setCustomHook('');
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Submission Error:", error);
      alert('Failed to queue video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Topic Input */}
        <div>
          <label className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Topic
          </label>
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
            placeholder="e.g. Life hacks, Motivation..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1.5">Leave empty if providing a custom hook below.</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-500 uppercase">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Custom Hook */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Custom Hook Text
          </label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all min-h-[100px] resize-y"
            placeholder="Write your exact hook text here..."
            value={customHook}
            onChange={(e) => setCustomHook(e.target.value)}
          />
        </div>

        {/* Scheduling Options */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm font-medium text-white">
              <Calendar className="w-4 h-4 text-indigo-400 mr-2" />
              Scheduling
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {isScheduled && (
            <div className="pl-6 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs text-slate-400 mb-2">Runs per day</label>
              <div className="flex items-center space-x-3">
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={runsPerDay}
                  onChange={(e) => setRunsPerDay(e.target.value)}
                  className="w-full accent-indigo-500"
                />
                <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {runsPerDay}x
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/10"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> {isScheduled ? 'Save Schedule' : 'Queue Now'}</>
          )}
        </button>

        {success && (
          <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center animate-in fade-in">
            {isScheduled ? 'Successfully scheduled automation!' : 'Video queued successfully!'}
          </div>
        )}
      </form>
    </div>
  );
}

