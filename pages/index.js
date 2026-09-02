import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase connection (Vercel UI automatically injected these)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTasks(data);
    setLoading(false);
  }

  // Add task manually (or it will appear via API)
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await fetch('/api/add-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newTask }),
    });
    if (res.ok) {
      setNewTask('');
      fetchTasks(); // Refresh list
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>📋 Team Task Dashboard</h1>
      
      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} style={{ marginBottom: '2rem', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder='e.g., "Design homepage for Sarah by Friday"'
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <button type="submit" style={{ background: '#0070f3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Add Task
        </button>
      </form>

      {/* Task List */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Add one above or via ChatGPT!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li key={task.id} style={{ border: '1px solid #eaeaea', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{task.title}</strong>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {task.assignee || 'Me'} · {task.status}
                </span>
              </div>
              {task.due_date && <div style={{ fontSize: '14px', color: '#888' }}>Due: {new Date(task.due_date).toLocaleDateString()}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
