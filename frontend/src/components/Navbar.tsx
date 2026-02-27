import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-diamond" aria-hidden="true"></span>
          <span className="logo-text">Inning<span className="logo-accent">AI</span></span>
        </NavLink>

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
