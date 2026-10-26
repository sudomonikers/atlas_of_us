import { lazy, Suspense } from 'react'
import './App.css'
import { Auth } from './auth/auth'
import Home from './home/home'
import { usePath } from './router'

//every page but home and auth is its own chunk, so the landing page doesn't download three.js and the scenes
const About = lazy(() => import('./about/about'))
const Admin = lazy(() => import('./admin/admin'))
const Blog = lazy(() => import('./blog/blog'))
const Personality = lazy(() => import('./personality/personality'))
const Profile = lazy(() => import('./profile/profile'))
const Roadmap = lazy(() => import('./roadmap/roadmap'))
const Skills = lazy(() => import('./skills/skills'))

function Page({ path }: { path: string }) {
  if (path === '/login') return <Auth mode="login" />
  if (path === '/create-account') return <Auth mode="create" />
  if (path.startsWith('/u/')) return <Profile username={decodeURIComponent(path.slice(3))} />
  if (path === '/roadmap') return <Roadmap />
  if (path === '/about') return <About />
  if (path === '/blog') return <Blog />
  if (path === '/admin' || path.startsWith('/admin/')) return <Admin />
  if (path === '/personality') return <Personality />
  if (path === '/skills' || path.startsWith('/skills/')) return <Skills />
  return <Home />
}

function App() {
  const path = usePath()

  return (
    <Suspense fallback={null}>
      <Page path={path} />
    </Suspense>
  )
}

export default App
