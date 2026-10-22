import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { errMsg, pickList, taskApi } from '../api';
import { useAuth } from '../AuthContext';
import { getSocket } from '../socket';
import { ADMIN, MANAGER, PRIORITIES, STATUSES, USER_BASE, label } from '../config';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const PAGE_SIZE = 50;

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user.role === ADMIN || user.role === MANAGER;
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', priority: '', status: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: PAGE_SIZE };
      Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
      const { data } = await taskApi.list(user.role, params);
      setTasks(data.tasks || data.tasklist || data.data || []); 
      setPages(data.pages || data.totalPages || data.pagination?.pages || 1);
      setError('');
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [page, filters, user.role]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isManager) return;
    api.get(`${USER_BASE}/assignable`).then(({ data }) => setUsers(pickList(data, 'users'))).catch(() => {});
  }, [isManager]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => { load(); setToast('Tasks updated in real time'); setTimeout(() => setToast(''), 2500); };
    socket.onAny(handler);
    return () => socket.offAny(handler);
  }, [load]);


  const visible = useMemo(() => tasks.filter((t) =>
    (!filters.status || t.status === filters.status) &&
    (!filters.priority || t.priority === filters.priority) &&
    (!filters.search || `${t.title} ${t.description}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [tasks, filters]);


  const isPoster = (t) => String(t.poster?._id || t.poster) === String(user._id);
  const canEdit = (t) => isPoster(t);
  const canDelete = (t) => isPoster(t) || user.role === ADMIN;
  const canMove = (t) => (user.role === 'user' ? true : isPoster(t));

  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    const prev = tasks;
    setTasks(tasks.map((t) => (t._id === task._id ? { ...t, status } : t))); // optimistic
    try { await taskApi.update(user.role, task._id, { status }); }
    catch (e) { setTasks(prev); setError(errMsg(e)); }
  };

  const save = async (payload) => {
    if (modal && modal !== 'new') await taskApi.update(user.role, modal._id, payload);
    else await taskApi.create(user.role, payload);
    setModal(null);
    load();
  };

  const remove = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try { await taskApi.remove(user.role, task._id); load(); }
    catch (e) { setError(errMsg(e)); }
  };

  const onDrop = (status) => (e) => {
    e.preventDefault();
    const task = tasks.find((t) => t._id === e.dataTransfer.getData('text/plain'));
    if (task && canMove(task)) changeStatus(task, status);
  };

  const setFilter = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input !w-full sm:!w-56" placeholder="Search tasks..." value={filters.search} onChange={setFilter('search')} />
        <select className="input !w-auto" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select className="input !w-auto" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
        </select>
        <button className="btn ml-auto" onClick={() => setModal('new')}>+ New task</button>
      </div>

      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow">{toast}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.map((status) => {
            const col = visible.filter((t) => t.status === status);
            return (
              <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(status)}
                className="min-h-[200px] rounded-lg bg-gray-200 p-3 dark:bg-gray-800">
                <h2 className="mb-3 flex justify-between font-semibold text-gray-700 dark:text-gray-200">
                  {label(status)} <span className="rounded-full bg-white px-2 text-sm dark:bg-gray-700">{col.length}</span>
                </h2>
                <div className="space-y-3">
                  {col.map((t) => (
                    <TaskCard key={t._id} task={t} canEdit={canEdit(t)} canDelete={canDelete(t)} canMove={canMove(t)}
                      onEdit={setModal} onDelete={remove} onStatus={changeStatus} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="text-sm dark:text-gray-200">Page {page} of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {modal && (
        <TaskModal task={modal === 'new' ? null : modal} users={users} canAssign={isManager} me={user}
          onClose={() => setModal(null)} onSave={save} />
      )}
    </div>
  );
}
