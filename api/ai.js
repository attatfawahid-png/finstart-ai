export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, type, sector } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  // تعليمات صارمة ليتحدث الذكاء الاصطناعي بنفس لغة المستخدم
  let finalPrompt = `أنت مستشار مالي خبير. أجب دائماً بنفس اللغة التي كُتب بها السؤال أو النص المقدم. إذا كان النص بالعربية أجب بالعربية، وإذا كان بالفرنسية أجب بالفرنسية، وهكذا. \n\n`;
  finalPrompt += prompt;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finstart-ai.vercel.app',
        'X-Title': 'FinStart DZ'
      },
      body: JSON.stringify({
        model: 'openrouter/free', 
        messages: [{ role: 'user', content: finalPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Error' });

    return res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
