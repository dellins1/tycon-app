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
2. FIND all railing section lengths — these are numbers written along or beside each line (e.g. "12ft", "8'", "10", "3.5m"). Add ALL of them together to get total linear feet. If values are in metres, convert to feet (1m = 3.28ft).
3. COUNT spindles if labelled (e.g. "24 spindles", "x24")
4. FIND railing height if noted (36 or 42 inches)

Return ONLY a valid JSON object:
{
  "linear_feet": <sum of ALL labelled section lengths as a number, null if none found>,
  "post_count": <number of post symbols counted, null if unclear>,
  "spindle_count": <number of spindles if labelled, null if not found>,
  "height_inches": <36 or 42 if noted, null if not found>,
  "sections": [<list of individual section lengths you found, e.g. [12, 8, 10]>],
  "notes": "<brief description: how many sections found, what symbols used for posts, any assumptions made>"
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
