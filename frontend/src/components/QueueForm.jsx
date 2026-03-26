import React, { useState } from 'react';
import axios from 'axios';
import { Send, Sparkles, Zap, AtSign, Loader2 } from 'lucide-react';

const QueueForm = () => {
  const [topic, setTopic] = useState('');
  const [customHook, setCustomHook] = useState('');
  const [igAccountId, setIgAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await axios.post('/api/videos/generate', {
        topic,
        customHook,
        igAccountId
      });
      setTopic('');
      setCustomHook('');
      setIgAccountId('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Submission Error:", error);
      alert('Failed to queue video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Decorative accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'var(--accent-gradient)'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={20} color="#0d1117" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Create New Reel</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>AI-powered video generation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* IG Account ID */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <AtSign size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Instagram Account ID
          </label>
          <input
            type="text"
            className="input-modern"
            placeholder="Defaults to .env ID if empty"
            value={igAccountId}
            onChange={(e) => setIgAccountId(e.target.value)}
          />
        </div>

        {/* Topic */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            AI Topic
          </label>
          <input
            type="text"
            className="input-modern"
            placeholder="e.g. Life hacks, Motivation..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.6 }}>
            Leave empty if providing a custom hook below
          </p>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>or custom</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Custom Hook */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Custom Hook Text
          </label>
          <textarea
            className="input-modern"
            style={{ minHeight: '80px', resize: 'vertical' }}
            placeholder="Write your own hook text..."
            value={customHook}
            onChange={(e) => setCustomHook(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!topic && !customHook)}
          className="btn-glow"
          style={{
            width: '100%', padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '14px'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Queueing...
            </>
          ) : (
            <>
              <Send size={16} />
              Queue Video
            </>
          )}
        </button>

        {/* Success Toast */}
        {success && (
          <div style={{
            marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)',
            fontSize: '13px', color: '#00e5ff', textAlign: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            ✓ Video queued successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default QueueForm;
