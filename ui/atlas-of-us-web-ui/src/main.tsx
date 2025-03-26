import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

//pages
import { Community } from './pages/Community/Community.tsx';
import { Login } from './pages/Login/Login.tsx';
import { Signup } from './pages/Signup/Signup.tsx';
import { Profile } from './pages/Profile/Profile.tsx';
import { Graph } from './pages/Graph/Graph.tsx';
import { Roadmap } from './pages/Roadmap/Roadmap.tsx';
import { Contact } from './pages/Contact/Contact.tsx';
import { PageNotFound } from './pages/PageNotFound/PageNotFound.tsx';
import { GlobalProvider } from './GlobalProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <GlobalProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Graph" />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Community" element={<Community />} />
        <Route path="/Graph" element={<Graph />} />
        <Route path="/Roadmap" element={<Roadmap />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  </GlobalProvider>
)
