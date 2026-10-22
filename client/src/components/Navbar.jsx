import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ADMIN, label } from '../config';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <nav className="bg-white shadow dark:bg-gray-800">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold text-blue-600">TaskManager</Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300">Tasks</Link>
          {user.role === ADMIN && (
            <Link to="/users" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300">Users</Link>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-700 dark:text-gray-200">
            {user.name} <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{label(user.role)}</span>
          </span>
          <button onClick={toggle} className="btn-ghost !px-2 !py-1">{dark ? '☀️' : '🌙'}</button>
          <button onClick={logout} className="btn-ghost !px-3 !py-1">Logout</button>
        </div>
      </div>
    </nav>
  );
}
