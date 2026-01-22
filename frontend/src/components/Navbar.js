import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎲</span>
          <span className="brand-text">Random Tanlash</span>
        </Link>

        {user && (
          <>
            <div className="navbar-links">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Bosh sahifa
              </Link>
              <Link
                to="/goliblar"
                className={`nav-link ${isActive('/goliblar') ? 'active' : ''}`}
              >
                G'oliblar
              </Link>
              <Link
                to="/viloyatlar"
                className={`nav-link ${isActive('/viloyatlar') ? 'active' : ''}`}
              >
                Viloyatlar
              </Link>
              <Link
                to="/tumanlar"
                className={`nav-link ${isActive('/tumanlar') ? 'active' : ''}`}
              >
                Tumanlar
              </Link>
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/ishtirokchilar"
                    className={`nav-link ${isActive('/admin/ishtirokchilar') ? 'active' : ''}`}
                  >
                    Ishtirokchilar
                  </Link>
                  <Link
                    to="/admin/upload"
                    className={`nav-link ${isActive('/admin/upload') ? 'active' : ''}`}
                  >
                    Excel yuklash
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                  >
                    Foydalanuvchilar
                  </Link>
                </>
              )}
            </div>

            <div className="navbar-user">
              <span className="user-info">
                <span className="user-name">{user.username}</span>
                <span className={`user-role ${user.role}`}>
                  {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                </span>
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Chiqish
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
