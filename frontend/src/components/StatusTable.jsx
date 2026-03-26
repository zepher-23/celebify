import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Cloud, PlayCircle, Clock, Loader2, Video } from 'lucide-react';

const StatusTable = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Published_to_IG':
        return { bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)', icon: <CheckCircle2 size={14} />, label: 'Published' };
      case 'Failed':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', icon: <AlertCircle size={14} />, label: 'Failed' };
      case 'Pending':
        return { bg: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.2)', icon: <Clock size={14} className="status-blink" />, label: 'Pending' };
      case 'Generating':
        return { bg: 'rgba(124, 77, 255, 0.08)', color: '#7c4dff', border: 'rgba(124, 77, 255, 0.2)', icon: <Loader2 size={14} className="animate-spin" />, label: 'Generating' };
      case 'Uploaded_to_Cloud':
        return { bg: 'rgba(0, 229, 255, 0.08)', color: '#00e5ff', border: 'rgba(0, 229, 255, 0.2)', icon: <Cloud size={14} />, label: 'Uploaded' };
      default:
        return { bg: 'rgba(139, 148, 158, 0.08)', color: '#8b949e', border: 'rgba(139, 148, 158, 0.2)', icon: <Clock size={14} />, label: status };
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div style={{
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Video size={18} style={{ color: '#00e5ff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Automation Queue</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {videos.length} video{videos.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <button
          onClick={fetchVideos}
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(0, 229, 255, 0.08)'; e.target.style.color = '#00e5ff'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = 'var(--text-muted)'; }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Time', 'Hook Text', 'Status', 'Actions'].map((h, i) => (
                <th key={h} style={{
                  padding: '12px 24px', fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  color: 'var(--text-muted)', textAlign: i === 3 ? 'right' : 'left',
                  background: 'rgba(13, 17, 23, 0.4)'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 && !loading ? (
              <tr>
                <td colSpan="4" style={{
                  padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)'
                }}>
                  <div className="float" style={{ marginBottom: '12px' }}>
                    <PlayCircle size={40} style={{ opacity: 0.3 }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>No videos yet</p>
                  <p style={{ fontSize: '12px', opacity: 0.6 }}>Queue your first video to get started</p>
                </td>
              </tr>
            ) : (
              videos.map((v) => {
                const statusCfg = getStatusConfig(v.status);
                return (
                  <tr key={v.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Time */}
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(v.createdAt)}
                    </td>

                    {/* Hook */}
                    <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 500 }}>
                      <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.hookText}>
                        {v.hookText || (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Generating via AI...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: statusCfg.bg, color: statusCfg.color,
                        border: `1px solid ${statusCfg.border}`
                      }}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {v.status === 'Failed' && v.errorMessage && (
                        <div style={{
                          fontSize: '10px', color: '#ef4444', marginTop: '4px',
                          maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }} title={v.errorMessage}>
                          {v.errorMessage}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {v.cloudinaryUrl && (
                          <a
                            href={v.cloudinaryUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View on Cloudinary"
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#00e5ff', textDecoration: 'none', transition: 'all 0.2s'
                            }}
                          >
                            <Cloud size={14} />
                          </a>
                        )}
                        {v.instagramUrl && (
                          <a
                            href={v.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View on Instagram"
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'rgba(124, 77, 255, 0.08)', border: '1px solid rgba(124, 77, 255, 0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#7c4dff', textDecoration: 'none', transition: 'all 0.2s'
                            }}
                          >
                            <ExternalLink size={14} />
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

      {/* Live indicator */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%', background: '#10b981'
        }} className="status-blink" />
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
};

export default StatusTable;
