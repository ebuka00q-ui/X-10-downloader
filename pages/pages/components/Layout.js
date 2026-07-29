import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  const tabs = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Sports', path: '/sports', icon: '⚽' },
    { name: 'Favorites', path: '/favorites', icon: '⭐' },
    { name: 'Watch', path: '/watch', icon: '▶️' },
    { name: 'Account', path: '/account', icon: '👤' },
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
      {/* HEADER */}
      <div style={{ padding: '10px 16px 8px', background: '#0a0a0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,255,136,0.15)' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, background: 'linear-gradient(135deg,#66ffaa,#00cc66)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬇️ X10</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={() => alert('🤖 X10 AI - Coming soon!')}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#00ff88,#00cc66)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', border: '2px solid rgba(0,255,136,0.3)' }}
          >
            AI
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 14px', background: 'rgba(10,10,15,0.97)', borderTop: '1px solid rgba(0,255,136,0.12)', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 20 }}>
        {tabs.map((tab) => {
          const isActive = router.pathname === tab.path
          return (
            <Link key={tab.path} href={tab.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: isActive ? '#00ff88' : '#555', fontSize: '9px', cursor: 'pointer', padding: '4px 12px', border: 0, background: 'none', fontFamily: 'inherit', textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', textShadow: isActive ? '0 0 30px rgba(0,255,136,0.4)' : 'none' }}>{tab.icon}</span>
              {tab.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
