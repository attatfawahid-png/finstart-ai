export default async function handler(req, res) {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is missing in Vercel settings.' });
  }

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
        // نموذج مجاني مضمون ومستقر
        model: 'deepseek/deepseek-chat-v3-0324:free', 
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    // إذا رفض OpenRouter الطلب، سنرسل رسالة الخطأ الحقيقية إلى الواجهة
    if (!response.ok) {
        const errorMessage = data.error?.message || `OpenRouter Error: ${response.status}`;
        console.error('OpenRouter API Error:', errorMessage);
        return res.status(response.status).json({ error: errorMessage });
    }

    if (!data.choices || data.choices.length === 0) {
        return res.status(500).json({ error: 'No response from AI model' });
    }

    res.status(200).json({ result: data.choices[0].message.content });
    
  } catch (error) {
    console.error("Internal Server Error: ", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
