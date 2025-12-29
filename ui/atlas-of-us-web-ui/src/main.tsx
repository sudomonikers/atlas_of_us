import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

//pages
import { Community } from './pages/site_pages/Community/Community.tsx';
import { Login } from './pages/auth_pages/Login/Login.tsx';
import { Signup } from './pages/auth_pages/Signup/Signup.tsx';
import { CreateAccount } from './pages/auth_pages/CreateAccount/CreateAccount.tsx';
import { Profile } from './pages/graph_pages/Profile/Profile.tsx';
import { Graph } from './pages/graph_pages/Graph/Graph.tsx';
import { Roadmap } from './pages/site_pages/Roadmap/Roadmap.tsx';
import { Contact } from './pages/site_pages/Contact/Contact.tsx';
import { PageNotFound } from './pages/site_pages/PageNotFound/PageNotFound.tsx';
import { GlobalProvider, useGlobal } from './GlobalProvider.tsx';
import { Blog } from './pages/site_pages/Blog/Blog.tsx';
import { Assessment } from './pages/graph_pages/Assessment/Assessment.tsx';
import { Domain } from './pages/graph_pages/Domain/Domain.tsx';
import { DomainCreator } from './pages/graph_pages/DomainCreator/DomainCreator.tsx';
import { DomainGenerator } from './pages/graph_pages/DomainGenerator/DomainGenerator.tsx';

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
        <Route path="/Domain" element={
          <PrivateRoute>
            <Domain />
            </PrivateRoute>
        } />
        <Route path="/Domain/:domainName" element={
          <PrivateRoute>
            <Domain />
          </PrivateRoute>
        } />
        <Route path="/DomainCreator" element={
          <PrivateRoute>
            <DomainCreator />
          </PrivateRoute>
        } />
        <Route path="/DomainCreator/:domainName" element={
          <PrivateRoute>
            <DomainCreator />
          </PrivateRoute>
        } />
        <Route path="/DomainGenerator/:domainName" element={
          <PrivateRoute>
            <DomainGenerator />
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
