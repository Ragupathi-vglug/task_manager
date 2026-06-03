import { useState } from 'react';
import { X, Calendar, Flag, AlignLeft, Type } from 'lucide-react';
import type { Task, TaskInsert, TaskPriority, TaskStatus } from '../lib/types';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskInsert) => Promise<void>;
  onClose: () => void;
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
];

const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <Type className="w-3.5 h-3.5" />
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
              className="w-full bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, notes, or context..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-900/50 border border-slate-600/50 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Flag className="w-3.5 h-3.5" />
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-900/50 border border-slate-600/50 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-lg shadow-sky-500/20"
            >
              {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
