import './App.css'
import About from './about/about'
import Admin from './admin/admin'
import { Auth } from './auth/auth'
import Blog from './blog/blog'
import Home from './home/home'
import Personality from './personality/personality'
import Profile from './profile/profile'
import Roadmap from './roadmap/roadmap'
import { usePath } from './router'

function App() {
  const path = usePath()

  if (path === '/login') return <Auth mode="login" />
  if (path === '/create-account') return <Auth mode="create" />
  if (path.startsWith('/u/')) return <Profile username={decodeURIComponent(path.slice(3))} />
  if (path === '/roadmap') return <Roadmap />
  if (path === '/about') return <About />
  if (path === '/blog') return <Blog />
  if (path === '/admin' || path.startsWith('/admin/')) return <Admin />
  if (path === '/personality') return <Personality />
  return <Home />
}

export default App
