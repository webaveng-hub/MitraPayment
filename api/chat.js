const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(body, status = 200) {
  return { status, headers, body: JSON.stringify(body) };
}

function clean(value, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validChatId(value) {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(value);
}

async function redis(command, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis belum dikonfigurasi');
  const response = await fetch(`${url}/${command}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Upstash Redis request gagal');
  const result = await response.json();
  return result.result;
}

async function getMessages(chatId) {
  const rows = await redis('lrange', `mp:chat:${chatId}`, '0', '99');
  return (rows || []).map((row) => JSON.parse(row)).reverse();
}

async function addMessage(chatId, from, text) {
  const message = { id: crypto.randomUUID(), from, text, at: new Date().toISOString() };
  await redis('lpush', `mp:chat:${chatId}`, JSON.stringify(message));
  await redis('ltrim', `mp:chat:${chatId}`, '0', '99');
  await redis('expire', `mp:chat:${chatId}`, '2592000');
  await redis('sadd', 'mp:chats', chatId);
  return message;
}

function isAdmin(request) {
  const expected = process.env.CHAT_ADMIN_TOKEN;
  return Boolean(expected && request.headers.get('x-admin-token') === expected);
}

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const chatId = clean(url.searchParams.get('chatId'), 80);

    if (request.method === 'GET' && url.searchParams.get('admin') === '1') {
      if (!isAdmin(request)) return json({ error: 'Token admin tidak valid' }, 401);
      const ids = (await redis('smembers', 'mp:chats')) || [];
      const conversations = await Promise.all(ids.slice(0, 100).map(async (id) => ({
        chatId: id,
        messages: await getMessages(id),
      })));
      return json({ conversations: conversations.filter((item) => item.messages.length) });
    }

    if (!validChatId(chatId)) return json({ error: 'chatId tidak valid' }, 400);

    if (request.method === 'GET') return json({ messages: await getMessages(chatId) });

    if (request.method === 'POST') {
      const payload = await request.json();
      const text = clean(payload.text);
      if (!text) return json({ error: 'Pesan tidak boleh kosong' }, 400);
      if (text.length > 1000) return json({ error: 'Pesan terlalu panjang' }, 400);
      const from = isAdmin(request) ? 'admin' : 'visitor';
      return json({ message: await addMessage(chatId, from, text) }, 201);
    }

    return json({ error: 'Method tidak didukung' }, 405);
  } catch (error) {
    console.error('[v0] Chat API error:', error.message);
    return json({ error: 'Layanan chat sedang tidak tersedia' }, 500);
  }
}
