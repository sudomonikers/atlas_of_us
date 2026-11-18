import { logout, useSession, ATLAS } from './api';
import { navigate, usePath } from './router';
import Home from './occupations/home';
import OccupationPage from './occupations/occupation_page';
import './app.css';

//the page for the url: an occupation at /occupations/<id>, and the occupations home everywhere else
function Page({ path }: { path: string }) {
  if (path.startsWith('/occupations/')) {
    const id = decodeURIComponent(path.slice('/occupations/'.length));
    if (id) return <OccupationPage key={id} id={id} />;
  }
  return <Home />;
}

function App() {
  const path = usePath();
  const session = useSession();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Atlas Of Us <span className="brand-tag">for Business</span>
          </a>
          <nav className="topnav" aria-label="Main">
            <a
              href="/"
              aria-current={path === '/' || path.startsWith('/occupations') ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              Occupations
            </a>
          </nav>
          <div className="account">
            {session.status === 'authenticated' && (
              <>
                <span className="account-name">{session.person.first_name}</span>
                <button className="button-quiet" onClick={logout}>
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Page path={path} />
      </main>

      <footer className="footer">
        <p>
          Occupation data from{' '}
          <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noreferrer">
            O*NET 30.0
          </a>{' '}
          by the U.S. Department of Labor, Employment and Training Administration, used under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          .
        </p>
        <p>
          <a href={ATLAS}>atlas-of-us.com</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
