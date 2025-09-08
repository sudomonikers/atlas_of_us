import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

//pages
import { Community } from './pages/Community/Community.tsx';
import { Login } from './pages/Login/Login.tsx';
import { Signup } from './pages/Signup/Signup.tsx';
import { CreateAccount } from './pages/CreateAccount/CreateAccount.tsx';
import { Profile } from './pages/Profile/Profile.tsx';
import { Graph } from './pages/Graph/Graph.tsx';
import { Roadmap } from './pages/Roadmap/Roadmap.tsx';
import { Contact } from './pages/Contact/Contact.tsx';
import { PageNotFound } from './pages/PageNotFound/PageNotFound.tsx';
import { GlobalProvider, useGlobal } from './GlobalProvider.tsx';
import { Blog } from './pages/Blog/Blog.tsx';
import { Assessment } from './pages/Assessment/Assessment.tsx';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { loggedIn } = useGlobal();
  
  if (!loggedIn) {
    return <Navigate to="/Login" replace />;
  } else {
    return children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GlobalProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Graph" replace />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Create" element={<CreateAccount />} />
        <Route path="/Profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/Assessment" element={
          <PrivateRoute>
            <Assessment />
          </PrivateRoute>
        } />
        <Route path="/Community" element={<Community />} />
        <Route path="/Graph" element={
          <PrivateRoute>
            <Graph />
          </PrivateRoute>
        } />
        <Route path="/Roadmap" element={<Roadmap />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Blog" element={<Blog />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  </GlobalProvider>
)
