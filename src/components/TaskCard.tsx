import { useState } from 'react';
import {
  MoreVertical, Pencil, Trash2, Calendar, Flag,
  Circle, Clock, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Task, TaskStatus } from '../lib/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  todo: {
    label: 'To Do',
    icon: <Circle className="w-3.5 h-3.5" />,
    color: 'text-slate-400',
    bg: 'bg-slate-700',
  },
  in_progress: {
    label: 'In Progress',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
};

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400', dot: 'bg-amber-400' },
  high: { label: 'High', color: 'text-red-400', dot: 'bg-red-400' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(due_date: string | null, status: TaskStatus) {
  if (!due_date || status === 'done') return false;
  return new Date(due_date) < new Date();
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sc = statusConfig[task.status];
  const pc = priorityConfig[task.priority];
  const overdue = isOverdue(task.due_date, task.status);

  const cycleStatus = () => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    onStatusChange(task.id, next);
  };

  return (
    <div
      className={`group relative bg-slate-800/70 border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 ${
        task.status === 'done'
          ? 'border-slate-700/40 opacity-70'
          : 'border-slate-700/60 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={cycleStatus}
          title={`Status: ${sc.label}. Click to advance.`}
          className={`mt-0.5 flex-shrink-0 ${sc.color} hover:scale-110 transition-transform`}
        >
          {sc.icon}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium text-sm leading-snug ${
                task.status === 'done' ? 'line-through text-slate-500' : 'text-white'
              }`}
            >
              {task.title}
            </h3>

            {/* Menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-7 z-20 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden">
                    <button
                      onClick={() => { onEdit(task); setMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description toggle */}
          {task.description && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 mt-0.5 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
          {expanded && task.description && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
              {sc.icon}
              {sc.label}
            </span>

            {/* Priority */}
            <span className={`inline-flex items-center gap-1.5 text-xs ${pc.color}`}>
              <Flag className="w-3 h-3" />
              {pc.label}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3" />
                {overdue && 'Overdue · '}
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
