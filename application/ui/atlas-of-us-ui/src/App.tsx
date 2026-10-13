import type { CSSProperties } from 'react'
import './App.css'
import { logout, useSession } from './auth/api'
import { Auth } from './auth/auth'
import { Feedback } from './feedback/feedback'
import Personality from './personality/personality'
import { usePath } from './router'

function App() {
  const path = usePath()
  const session = useSession()

  if (path === '/login') return <Auth mode="login" />
  if (path === '/create-account') return <Auth mode="create" />

  return (
    <>
      <Personality />
      {session.status === 'authenticated' && (
        <div style={cornerStyle}>
          <Feedback buttonStyle={buttonStyle} />
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
