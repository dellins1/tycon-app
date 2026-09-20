import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

let schemaReady = null;
function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id BIGINT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

export default async function handler(req, res) {
  if (!connectionString) {
    res.status(500).json({ error: 'Database is not configured (missing DATABASE_URL).' });
    return;
  }

  const sql = neon(connectionString);

  try {
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT payload FROM quotes ORDER BY id DESC`;
      res.status(200).json(rows.map((r) => r.payload));
      return;
    }

    if (req.method === 'POST') {
      const quote = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      if (!quote || quote.id === undefined || quote.id === null) {
        res.status(400).json({ error: 'Quote must include an id.' });
        return;
      }
      const id = Number(quote.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'Quote id must be numeric.' });
        return;
      }
      await sql`
        INSERT INTO quotes (id, payload, updated_at)
        VALUES (${id}, ${sql.json(quote)}, now())
        ON CONFLICT (id) DO UPDATE SET payload = ${sql.json(quote)}, updated_at = now()
      `;
      res.status(200).json({ ok: true, id });
      return;
    }

    if (req.method === 'DELETE') {
      const idParam = req.query && req.query.id;
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'A numeric id query param is required.' });
        return;
      }
      await sql`DELETE FROM quotes WHERE id = ${id}`;
      res.status(200).json({ ok: true, id });
      return;
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
