import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const DATA_PATH = 'twain-vakantieplanner/entries.json';
const PEOPLE = ['Jens', 'Stijn', 'Hermann'];
const TYPES = ['vacation', 'home'];

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Missing BLOB_READ_WRITE_TOKEN. Connect a private Vercel Blob store to this project.'
    });
  }

  try {
    if (req.method === 'GET') {
      const snapshot = await readPlanner();
      return res.status(200).json({
        entries: snapshot.entries,
        updatedAt: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const entries = await handlePost(body);

      return res.status(200).json({ ok: true, entries: entries });
    }

    if (req.method === 'DELETE') {
      const body = parseBody(req);
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      const entries = await updatePlanner(function (currentEntries) {
        return currentEntries.filter(function (entry) {
          return entry.id !== id;
        });
      });

      return res.status(200).json({ ok: true, entries: entries });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }
  return req.body;
}

async function handlePost(body) {
  if (body && body.action === 'delete') {
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      throw new Error('Missing id');
    }

    return updatePlanner(function (currentEntries) {
      return currentEntries.filter(function (entry) {
        return entry.id !== id;
      });
    });
  }

  const incomingEntries = Array.isArray(body && body.entries)
    ? body.entries
    : [body];

  const validatedEntries = incomingEntries.map(validateEntry);

  return updatePlanner(function (currentEntries) {
    const nextEntries = currentEntries.slice();
    validatedEntries.forEach(function (entry) {
      const duplicate = nextEntries.some(function (currentEntry) {
        return currentEntry.person === entry.person &&
          currentEntry.type === entry.type &&
          currentEntry.start === entry.start &&
          currentEntry.end === entry.end &&
          (currentEntry.note || '') === (entry.note || '');
      });

      if (!duplicate) {
        nextEntries.push({
          id: createId(),
          person: entry.person,
          type: entry.type,
          start: entry.start,
          end: entry.end,
          note: entry.note,
          createdAt: new Date().toISOString()
        });
      }
    });
    return sortEntries(nextEntries);
  });
}

function validateEntry(payload) {
  const person = typeof payload.person === 'string' ? payload.person.trim() : '';
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const start = typeof payload.start === 'string' ? payload.start.trim() : '';
  const end = typeof payload.end === 'string' ? payload.end.trim() : '';
  const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 240) : '';

  if (!PEOPLE.includes(person)) {
    throw new Error('Invalid person');
  }
  if (!TYPES.includes(type)) {
    throw new Error('Invalid type');
  }
  if (!isIsoDate(start) || !isIsoDate(end)) {
    throw new Error('Invalid date');
  }
  if (end < start) {
    throw new Error('End date cannot be before start date');
  }

  return { person, type, start, end, note };
}

async function readPlanner() {
  const result = await get(DATA_PATH, { access: 'private' }).catch(function (error) {
    if (isMissingBlob(error)) return null;
    throw error;
  });

  if (!result) {
    return { entries: [], etag: null };
  }

  const raw = await new Response(result.stream).text();
  let parsed = [];

  try {
    parsed = JSON.parse(raw || '[]');
  } catch (error) {
    parsed = [];
  }

  return {
    entries: Array.isArray(parsed) ? parsed.filter(isValidStoredEntry) : [],
    etag: result.blob && result.blob.etag ? result.blob.etag : null
  };
}

async function updatePlanner(mutator) {
  let lastConflict = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await readPlanner();
    const nextEntries = sortEntries(mutator(snapshot.entries.slice())).filter(isValidStoredEntry);

    try {
      await put(DATA_PATH, JSON.stringify(nextEntries, null, 2), {
        access: 'private',
        allowOverwrite: true,
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
        contentType: 'application/json',
        ifMatch: snapshot.etag || undefined
      });
      return nextEntries;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        lastConflict = error;
        continue;
      }
      throw error;
    }
  }

  throw lastConflict || new Error('Could not save planner due to concurrent updates');
}

function isValidStoredEntry(entry) {
  return Boolean(
    entry &&
    typeof entry.id === 'string' &&
    PEOPLE.includes(entry.person) &&
    TYPES.includes(entry.type) &&
    isIsoDate(entry.start) &&
    isIsoDate(entry.end) &&
    entry.end >= entry.start
  );
}

function sortEntries(entries) {
  return entries.slice().sort(function (a, b) {
    if (a.start !== b.start) return a.start.localeCompare(b.start);
    if (a.person !== b.person) return PEOPLE.indexOf(a.person) - PEOPLE.indexOf(b.person);
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMissingBlob(error) {
  return Boolean(
    error &&
    typeof error.message === 'string' &&
    (error.message.includes('not found') || error.message.includes('404'))
  );
}
