import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
import { REGISTER_ROLES, label } from '../config';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', role: REGISTER_ROLES[0] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try { await register(form); }
    catch (err) { setError(errMsg(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h1 className="text-xl font-bold dark:text-white">Register</h1>
        {error && <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        <input className="input" placeholder="Name" required value={form.name} onChange={set('name')} />
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input className="input" type="number" min="1" placeholder="Age" required value={form.age} onChange={set('age')} />
        <input className="input" type="password" placeholder="Password (min 6)" minLength={6} required
          value={form.password} onChange={set('password')} />
        <select className="input" value={form.role} onChange={set('role')}>
          {REGISTER_ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
        </select>
        <button className="btn w-full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
}
