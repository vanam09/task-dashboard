// pages/api/add-task.js
export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Missing task description' });
  }

  // Initialize Supabase INSIDE the handler
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  async function callAI(messages) {
    const openAiKey = process.env.OPENAI_API_KEY;
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;

    if (openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.1,
          }),
        });
        if (response.ok) return await response.json();
      } catch (e) { console.log('OpenAI failed, falling back to DeepSeek'); }
    }

    if (deepSeekKey) {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepSeekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.1,
        }),
      });
      if (!response.ok) throw new Error('DeepSeek failed');
      return await response.json();
    }

    throw new Error('No AI API keys configured');
  }

  try {
    const systemPrompt = {
      role: 'system',
      content: `You are a task parser. Extract title, assignee (name or null if not mentioned), and due_date (YYYY-MM-DD). Return a JSON object with keys: title, assignee, due_date. If assignee is not specified, set to null. If due_date not specified, set to null. Only output JSON.`
    };
    const userMessage = { role: 'user', content: description };

    const aiResponse = await callAI([systemPrompt, userMessage]);
    const parsed = JSON.parse(aiResponse.choices[0].message.content);

    // 🔥 FIX: Use 'date' column name (matches your Supabase table)
    const { error } = await supabase.from('tasks').insert({
      title: parsed.title,
      assignee: parsed.assignee || null,
      date: parsed.due_date || null,  // <-- Changed from 'due_date' to 'date'
      status: 'pending',
    });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to add task: ' + err.message });
  }
}
