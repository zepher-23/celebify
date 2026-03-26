import React from 'react';
import QueueForm from './components/QueueForm';
import StatusTable from './components/StatusTable';
import { Zap, ArrowRight, Sparkles, Video, Cloud, Share2 } from 'lucide-react';

function App() {
  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13, 17, 23, 0.8)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={20} color="#0d1117" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 900 }}>
              CELEBIFY<span className="gradient-text">PIPE</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontFamily: 'monospace'
            }}>
              v1.0.0
            </span>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: '#10b981'
            }} className="pulse-glow" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 0'
      }}>
        <div style={{ maxWidth: '600px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.2, marginBottom: '12px' }}>
            Instagram Reel <br />
            <span className="gradient-text">Automation Pipeline</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            Generate AI-powered hooks, render videos via CelebifyAI, and publish directly to Instagram — fully automated.
          </p>

          {/* Pipeline steps */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap'
          }}>
            {[
              { icon: <Sparkles size={14} />, label: 'AI Hook' },
              { icon: <Video size={14} />, label: 'Generate' },
              { icon: <Cloud size={14} />, label: 'Upload' },
              { icon: <Share2 size={14} />, label: 'Publish' },
            ].map((step, i) => (
              <React.Fragment key={step.label}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'
                }}>
                  <span style={{ color: '#00e5ff' }}>{step.icon}</span>
                  {step.label}
                </div>
                {i < 3 && <ArrowRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
          gap: '24px',
          paddingBottom: '60px'
        }}>
          {/* Left Column */}
          <div>
            <div style={{ position: 'sticky', top: '84px' }}>
              <QueueForm />
            </div>
          </div>

          {/* Right Column */}
          <div>
            <StatusTable />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px', textAlign: 'center',
        fontSize: '12px', color: 'var(--text-muted)'
      }}>
        © 2026 CelebifyPipe. Built with AI-powered automation.
      </footer>
    </div>
  );
}

export default App;
