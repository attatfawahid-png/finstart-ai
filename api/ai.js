export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, type, sector } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  let finalPrompt = prompt;

  try {
    // ميزة البحث عن المنافسين عبر Tavily
    if (type === 'competitors') {
      const searchQuery = `Top competitors in ${sector} in Algeria, including their pricing, features, and employee count.`;
      
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tavilyKey}` },
        body: JSON.stringify({ query: searchQuery, search_depth: "advanced", include_raw_content: true, max_results: 5 })
      });

      const tavilyData = await tavilyResponse.json();
      let searchContext = tavilyData.results ? tavilyData.results.map(r => `[المصدر]: ${r.title} (${r.url})\n${r.content}`).join('\n\n') : "لا توجد نتائج.";

      finalPrompt = `أنت محلل استخبارات تنافسية. بناءً على نتائج البحث الحقيقية عن قطاع "${sector}" في الجزائر:\n${searchContext}\n\nالمطلوب: استخرج بيانات أفضل منافسين وترتيبها في مصفوفة JSON نقية فقط (بدون أي نصوص إضافية أو \`\`\`json). كل كائن يحتوي على: name, employees, funding, pricing, features, strengths, weaknesses, source_url. اكتب النتائج بنفس لغة القطاع المدخل. إذا لم تجد رقماً، اكتب "غير متوفر".`;
    } else {
      // تعليمات صارمة للغة
      finalPrompt = `أنت مستشار مالي خبير. أجب دائماً بنفس اللغة التي كُتب بها النص التالي:\n\n${prompt}`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finstart-ai.vercel.app',
        'X-Title': 'FinStart DZ'
      },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'user', content: finalPrompt }] })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Error' });

    return res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
