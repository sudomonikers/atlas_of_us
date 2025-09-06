import "./nav.css";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useGlobal } from '../../GlobalProvider';

export function NavBar() {
  const { setSearchText, loggedIn, logout } = useGlobal();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

   const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
   const debouncedSetSearchText = (value: string) => {
     if (debounceTimeout.current) {
       clearTimeout(debounceTimeout.current);
     }
 
     debounceTimeout.current = setTimeout(() => {
       setSearchText(value);
     }, 300); // Adjust the delay as needed (e.g., 300ms)
   };

  const login = () => {
    navigate('/Login')
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigation = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <>
      <nav>
        <input
          type="text"
          id="globalInput"
          className="nav-input"
          onChange={(e) => debouncedSetSearchText(e.target.value)}
        />
        {!loggedIn && (
          <button className="login-button" onClick={login}>
            Login
          </button>
        )}
        <button
          className="hamburger-button"
          onClick={toggleMenu}
          aria-label="Menu Toggle"
        >
          <svg viewBox="0 0 100 100" width="40">
            <path
              className={`line ${!menuOpen ? "line-burger1" : "line-cross1"}`}
              d="M 10 25 H 90"
            />
            <path
              className={`line ${!menuOpen ? "line-burger2" : "line-cross2"}`}
              d="M 10 75 H 90"
            />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="nav-container slide-in">
          <ul>
            <li>
              <Link
                to="/Graph"
                onClick={handleNavigation}
                data-text="Atlas Of Us"
              >
                Atlas Of Us
              </Link>
            </li>
            <li>
              <Link
                to="/Profile"
                onClick={handleNavigation}
                data-text="My Profile"
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to="/Community"
                onClick={handleNavigation}
                data-text="Community"
              >
                Community
              </Link>
            </li>
            <li>
              <Link
                to="/Contact"
                onClick={handleNavigation}
                data-text="Get In Touch"
              >
                Get In Touch
              </Link>
            </li>
            <li>
              <Link
                to="/Roadmap"
                onClick={handleNavigation}
                data-text="Roadmap"
              >
                Roadmap
              </Link>
            </li>
            <li>
              <Link
                to="/Blog"
                onClick={handleNavigation}
                data-text="Blog"
              >
                Blog
              </Link>
            </li>
            {loggedIn && (
              <li className="logout-item">
                <button
                  className="logout-button"
                  onClick={handleLogout}
                  data-text="Logout"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}