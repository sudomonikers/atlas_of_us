import { logout, useSession, ATLAS } from './api';
import { navigate, usePath } from './router';
import Welcome from './welcome';
import Ready from './ready';
import Match from './match';
import './app.css';

//signed out it's the welcome; signed in it's getting your Atlas ready, then your match at /match
function Page({ path }: { path: string }) {
  if (path === '/match') return <Match />;
  return <Ready />;
}

function App() {
  const path = usePath();
  const session = useSession();

  return (
    <div className="shell">
      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          soulmates
        </a>
        {session.status === 'authenticated' && (
          <button className="button-quiet" onClick={logout}>
            Log out
          </button>
        )}
      </header>

      <main className="main">
        {session.status === 'checking' ? null : session.status === 'anonymous' ? <Welcome /> : <Page path={path} />}
      </main>

      <footer className="footer">
        <a href={ATLAS}>by Atlas Of Us</a>
      </footer>
    </div>
  );
}

export default App;
