import type { CSSProperties } from 'react'
import './App.css'
import Admin from './admin/admin'
import { logout, useSession } from './auth/api'
import { Auth } from './auth/auth'
import { Feedback } from './feedback/feedback'
import Personality from './personality/personality'
import Profile from './profile/profile'
import { navigate, usePath } from './router'

function App() {
  const path = usePath()
  const session = useSession()

  if (path === '/login') return <Auth mode="login" />
  if (path === '/create-account') return <Auth mode="create" />
  if (path.startsWith('/u/')) return <Profile username={decodeURIComponent(path.slice(3))} />
  if (path === '/admin' || path.startsWith('/admin/')) return <Admin />

  return (
    <>
      <Personality />
      {session.status === 'authenticated' && (
        <div style={cornerStyle}>
          {session.person.admin && (
            <button className="comic-lift" style={buttonStyle} onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
          <Feedback buttonStyle={buttonStyle} />
          <button className="comic-lift" style={buttonStyle} onClick={() => navigate(`/u/${session.person.username}`)}>
            My profile
          </button>
          <button className="comic-lift" style={buttonStyle} onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </>
  )
}

const cornerStyle: CSSProperties = {
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 30,
  display: 'flex',
  gap: 12,
}

const buttonStyle: CSSProperties = {
  padding: '4px 14px',
  background: 'var(--ivory-white)',
  color: 'var(--gunmetal-black)',
  border: '3px solid var(--gunmetal-black)',
  borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  boxShadow: '3px 4px 0 var(--gunmetal-black)',
  fontFamily: 'var(--font-comic)',
  fontSize: 20,
  letterSpacing: 1,
}

export default App
