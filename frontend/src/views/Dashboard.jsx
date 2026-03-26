import React, { useState, useEffect } from 'react';
import { QueueForm } from '../components/QueueForm';
import { StatusTable } from '../components/StatusTable';
import { Target, CheckCircle2 } from 'lucide-react';

export function Dashboard({ activeAccount }) {
  const [videos, setVideos] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [videosRes, schedulesRes] = await Promise.all([
        fetch('http://localhost:3000/api/videos'),
        fetch('http://localhost:3000/api/schedules')
      ]);
      setVideos(await videosRes.json());
      setSchedules(await schedulesRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQueueSuccess = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Pipeline Overview</h1>
        <p className="text-slate-400 mt-2">Manage your automated reel generations and current queue status.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Generator Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">New Generation</h2>
            </div>
            <div className="p-5">
              <QueueForm activeAccount={activeAccount} onSuccess={handleQueueSuccess} />
            </div>
          </div>

          {/* Daily Schedule Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Today's Progress</h2>
            </div>
            <div className="p-5 space-y-4">
              {schedules.length === 0 ? (
                <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                  <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No active schedules.</p>
                  <p className="text-xs text-slate-500 mt-1">Configure automation using the "Schedule" toggle above to track next uploads.</p>
                </div>
              ) : (
                schedules.map((schedule) => {
                  const percent = Math.min(100, Math.round((schedule.completedToday / schedule.runsPerDay) * 100));
                  const isDone = schedule.completedToday >= schedule.runsPerDay;

                  return (
                    <div key={schedule.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-white truncate max-w-[150px]" title={schedule.igAccountId}>
                            {schedule.igAccountId}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {schedule.completedToday} / {schedule.runsPerDay}
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {isDone && (
                        <p className="text-xs text-emerald-400 flex items-center mt-3 mb-2">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> All target runs completed today.
                        </p>
                      )}

                      <div className="mt-3 space-y-3 pt-2 border-t border-slate-700/50">
                        {schedule.upcomingRuns && schedule.upcomingRuns.map((run, idx) => (
                          <div key={run.id || idx} className="text-xs">
                            <p className="text-slate-400 mb-1 flex items-center justify-between">
                              <span className="font-semibold text-slate-300">Target Time:</span> 
                              <span>{run.time}</span>
                            </p>
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 break-words">
                              <span className="font-semibold text-slate-300 block mb-1">Assigned Hook:</span>
                              <span className="italic text-indigo-300">"{run.hookText}"</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Status Table (Right Column) */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
          <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Automations</h2>
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>System Active</span>
            </div>
          </div>
          <div className="p-0">
            <StatusTable videos={videos} />
          </div>
        </div>
      </div>

    </div>
  );
}
