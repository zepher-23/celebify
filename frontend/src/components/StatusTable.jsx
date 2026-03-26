import React from 'react';
import { ExternalLink, AlertCircle, CheckCircle2, Cloud, PlayCircle, Clock, Loader2, Video } from 'lucide-react';

export function StatusTable({ videos = [] }) {

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Published_to_IG':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Published' };
      case 'Failed':
        return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', icon: <AlertCircle className="w-4 h-4" />, label: 'Failed' };
      case 'Pending':
        return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Pending' };
      case 'Generating':
        return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Generating' };
      case 'Uploaded_to_Cloud':
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: <Cloud className="w-4 h-4" />, label: 'Uploaded' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: <Clock className="w-4 h-4" />, label: status };
    }
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return 'Just now';
    const d = new Date(createdAt._seconds * 1000);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 uppercase text-xs font-semibold tracking-wider text-slate-500">
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Hook Text</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {videos.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-24 text-center">
                  <PlayCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No videos in queue</p>
                  <p className="text-xs text-slate-500 mt-1">Start a new generation to see it here.</p>
                </td>
              </tr>
            ) : (
              videos.map((v) => {
                const cfg = getStatusConfig(v.status);
                return (
                  <tr key={v.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {formatDate(v.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white max-w-xs truncate">
                      {v.hookText || <span className="text-slate-500 italic font-normal">Generating via AI...</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>
                      {v.status === 'Failed' && v.errorMessage && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={v.errorMessage}>
                          {v.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {v.videoUrl && (
                          <a
                            href={v.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View Media"
                            className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-500/20 transition-colors"
                          >
                            <Cloud className="w-4 h-4" />
                          </a>
                        )}
                        {v.instagramUrl && (
                          <a
                            href={v.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View on Instagram"
                            className="p-1.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-md hover:bg-pink-500/20 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
