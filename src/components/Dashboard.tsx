import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskInsert, TaskStatus } from '../lib/types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import {
  Plus, Search, SlidersHorizontal, CheckSquare,
  LogOut, User, Loader2, ListFilter, X,
} from 'lucide-react';
import type { User as SupaUser } from '@supabase/supabase-js';

interface Props {
  user: SupaUser;
}

type FilterStatus = 'all' | TaskStatus;
type SortKey = 'created_at' | 'due_date' | 'priority' | 'title';

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function Dashboard({ user }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const handleCreate = async (data: TaskInsert) => {
    const { error } = await supabase.from('tasks').insert({ ...data, user_id: user.id });
    if (error) throw error;
  };

  const handleUpdate = async (data: TaskInsert) => {
    if (!editingTask) return;
    const { error } = await supabase.from('tasks').update(data).eq('id', editingTask.id);
    if (error) throw error;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
  };

  const handleSignOut = () => supabase.auth.signOut();

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const filtered = tasks
    .filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortKey === 'title') return a.title.localeCompare(b.title);
      if (sortKey === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'todo', label: 'To Do', count: stats.todo },
    { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
    { key: 'done', label: 'Done', count: stats.done },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">TaskFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-semibold text-sky-400">
                {initials}
              </div>
              <span className="text-sm text-slate-300 hidden sm:block">{displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-sky-400' },
            { label: 'To Do', value: stats.todo, color: 'text-slate-300' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-400' },
            { label: 'Done', value: stats.done, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* New task */}
            <button
              onClick={() => { setEditingTask(null); setShowForm(true); }}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="created_at">Date Created</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-5">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                filterStatus === tab.key
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filterStatus === tab.key ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading tasks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {tasks.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-white font-semibold mb-1">No tasks yet</h3>
                <p className="text-slate-500 text-sm mb-4">Create your first task to get started</p>
                <button
                  onClick={() => { setEditingTask(null); setShowForm(true); }}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Create Task
                </button>
              </>
            ) : (
              <>
                <User className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No tasks match your filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={t => { setEditingTask(t); setShowForm(true); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <TaskForm
          task={editingTask ?? undefined}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
