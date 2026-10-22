import { useCallback, useEffect, useState } from 'react';
import api, { errMsg, pickList } from '../api';
import { ADMIN_BASE, label } from '../config';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (role) params.role = role;
      const { data } = await api.get(`${ADMIN_BASE}/getuserlist`, { params });
      setUsers(pickList(data, 'users'));
      setPages(data.pages || 1);
      setTotal(data.totalUsers ?? 0);
      setError('');
    } catch (e) { setError(errMsg(e)); }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} and all their tasks?`)) return;
    try { await api.delete(`${ADMIN_BASE}/deleteuser/${u._id}`); load(); }
    catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-bold dark:text-white">Users ({total})</h1>
        <input className="input !w-full sm:!w-52" placeholder="Search name or email" value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select className="input !w-auto" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
        </select>
      </div>
      {error && <p className="mb-2 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm dark:text-gray-200">
          <thead className="border-b dark:border-gray-600">
            <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Joined</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b dark:border-gray-700">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{label(u.role)}</td>
                <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td className="p-2 text-right"><button onClick={() => remove(u)} className="text-red-600 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="text-sm dark:text-gray-200">Page {page} of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
