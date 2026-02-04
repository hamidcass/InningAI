import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-text">Inning<span className="logo-accent">AI</span></span>
        </NavLink>

        {/* Desktop Menu */}
        <ul className="nav-menu desktop-menu">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              Home
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/predictions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Predictions
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/search" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Player Search
            </NavLink>
          </li>
        </ul>

        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-list">
            <li className="mobile-nav-item">
              <NavLink to="/" className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu} end>
                Home
              </NavLink>
            </li>
            <li className="mobile-nav-item">
              <NavLink to="/predictions" className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu}>
                Predictions
              </NavLink>
            </li>
            <li className="mobile-nav-item">
              <NavLink to="/search" className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu}>
                Player Search
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;