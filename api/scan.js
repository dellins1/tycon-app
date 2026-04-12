export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { base64, mediaType } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `You are reading a hand-drawn site sketch for a railing installation job.

Your job:
1. COUNT the number of posts — posts are drawn as squares, circles, dots, or any repeated symbol at the ends/joints of lines
2. COUNT the number of railing sections — a section is each line segment between two posts
3. FIND all railing section lengths — numbers written along or beside each line (e.g. "12ft", "8'", "10"). Add ALL of them together for total linear feet. Convert metres to feet if needed (1m = 3.28ft).
4. CALCULATE spindles — always 2 spindles per railing section
5. FIND railing height if noted (36 or 42 inches)

Return ONLY a valid JSON object:
{
  "linear_feet": <sum of ALL labelled section lengths as a number, null if none found>,
  "post_count": <number of post symbols counted, null if unclear>,
  "section_count": <number of railing sections between posts>,
  "spindle_count": <section_count multiplied by 2>,
  "height_inches": <36 or 42 if noted, null if not found>,
  "sections": [<list of individual section lengths found, e.g. [12, 8, 10]>],
  "notes": "<brief summary: sections found, post count, spindle count, any assumptions>"
}

Only return the JSON. No explanation.`
            }
          ]
        }]
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `API error ${response.status}: ${rawText}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = JSON.parse(rawText);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
