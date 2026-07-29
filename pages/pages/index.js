import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '20px', padding: '8px 0', borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
          <span style={{ color: '#00ff88', fontWeight: 600, fontSize: '13px', cursor: 'pointer', borderBottom: '3px solid #00ff88', paddingBottom: '8px' }}>MEN</span>
          <span style={{ color: '#555', fontWeight: 600, fontSize: '13px', cursor: 'pointer', paddingBottom: '8px' }}>WOMEN</span>
        </div>
        <div id="sL">
          <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>⚽ Loading club matches...</p>
        </div>
      </div>
    </Layout>
  )
  }
