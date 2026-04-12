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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `You are reading a hand-drawn site sketch for a railing installation job. Extract any measurements you can find.

Return ONLY a valid JSON object with these fields (use null if not found):
{
  "linear_feet": <total linear feet of railing as a number>,
  "post_count": <number of posts as a number>,
  "spindle_count": <number of spindles as a number>,
  "height_inches": <railing height, either 36 or 42 as a number>,
  "notes": "<brief description of what you read from the sketch>"
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
