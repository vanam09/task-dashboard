export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Missing task description' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // 🔥 Mock: Use description as title, no AI parsing
    const { error } = await supabase.from('tasks').insert({
      title: description,
      assignee: 'Me',
      date: null,
      status: 'pending',
    });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to add task: ' + err.message });
  }
}
