import { useState } from 'react';
import { PRIORITIES, STATUSES, label } from '../config';
import { assigneeId, errMsg } from '../api';

export default function TaskModal({ task, users, canAssign, me, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || STATUSES[0],
    priority: task?.priority || PRIORITIES[1],
    duedate: task?.duedate ? task.duedate.slice(0, 10) : '',
    assignedTo: task ? assigneeId(task) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form };
    if (!canAssign) payload.assignedTo = me._id; 
    if (!payload.assignedTo) { setError('Please choose who to assign this task to'); setSaving(false); return; }
    try { await onSave(payload); }
    catch (err) { setError(errMsg(err)); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="max-h-full w-full max-w-md space-y-3 overflow-y-auto rounded-lg bg-white p-5 dark:bg-gray-800">
        <h2 className="text-lg font-bold dark:text-white">{task ? 'Edit task' : 'New task'}</h2>
        {error && <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        <input className="input" placeholder="Title" required maxLength={150} value={form.title} onChange={set('title')} />
        <textarea className="input" rows={3} placeholder="Description" required value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
        </div>
        <input className="input" type="date" required value={form.duedate} onChange={set('duedate')} />
        {canAssign && (
          <select className="input" required value={form.assignedTo} onChange={set('assignedTo')}>
            <option value="">Assign to...</option>
            <option value={me._id}>Myself</option>
            {users.filter((u) => u._id !== me._id).map((u) => <option key={u._id} value={u._id}>{u.name} ({label(u.role)})</option>)}
          </select>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
