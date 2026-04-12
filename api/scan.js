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
              text: `You are reading a hand-drawn TOP-DOWN FLOOR PLAN sketch of a railing installation job. This is a bird's eye view looking straight down — like an architectural floor plan.

IMPORTANT CONTEXT:
- This is NOT an elevation or side view — there are no post heights
- Squares, rectangles, or small boxes at corners and joints = POSTS (viewed from above)
- Lines connecting the posts = RAILING SECTIONS (viewed from above)
- Numbers written along or near each line = the HORIZONTAL LENGTH of that railing section in feet
- Every number in this drawing refers to a railing section length, NOT a height

Your job:
1. COUNT the posts — the small squares/boxes at corners and joints
2. COUNT the railing sections — each line segment connecting two posts
3. READ the length labelled on each railing section line and ADD them all together for total linear feet
4. CALCULATE spindles — always 2 spindles per railing section
5. FIND railing height only if explicitly noted with a label like "36 inch" or "42 inch" or "36h" — otherwise leave null

Return ONLY a valid JSON object:
{
  "linear_feet": <sum of ALL section lengths as a number, null if none found>,
  "post_count": <number of post symbols counted, null if unclear>,
  "section_count": <number of railing sections between posts>,
  "spindle_count": <section_count multiplied by 2>,
  "height_inches": <36 or 42 only if explicitly labelled, otherwise null>,
  "sections": [<list of individual section lengths, e.g. [4, 6, 12]>],
  "notes": "<brief summary of what you read — list each section length, post count, spindle count>"
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
