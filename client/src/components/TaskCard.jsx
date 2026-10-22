import { STATUSES, label } from '../config';

const prio = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function TaskCard({ task, canEdit, canDelete, canMove, onEdit, onDelete, onStatus }) {
  const overdue = task.duedate && task.status !== 'completed' && new Date(task.duedate) < new Date();
  return (
    <div
      draggable={canMove}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task._id)}
      className={`rounded border bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-gray-700 ${canMove ? 'cursor-grab' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold dark:text-white">{task.title}</h3>
        <span className={`rounded px-2 py-0.5 text-xs ${prio[task.priority] || ''}`}>{label(task.priority)}</span>
      </div>
      {task.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{task.description}</p>}
      <div className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        {task.duedate && (
          <p className={overdue ? 'font-medium text-red-600' : ''}>Due: {new Date(task.duedate).toLocaleDateString()}</p>
        )}
        {task.assignedTo?.name && <p>Assigned to: {task.assignedTo.name}</p>}
        {task.poster?.name && <p>Created by: {task.poster.name}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        
        {canMove ? (
          <select className="input !w-auto !py-1 text-xs" value={task.status} onChange={(e) => onStatus(task, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        ) : <span />}
        <div className="flex gap-2 text-xs">
          {canEdit && <button onClick={() => onEdit(task)} className="text-blue-600 hover:underline">Edit</button>}
          {canDelete && <button onClick={() => onDelete(task)} className="text-red-600 hover:underline">Delete</button>}
        </div>
      </div>
    </div>
  );
}
