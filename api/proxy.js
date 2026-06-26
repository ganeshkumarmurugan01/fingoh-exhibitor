export default async function handler(req, res) {
  // req.url is like /api/v1/staff - forward as-is to Railway
  const target = 'https://web-production-93e78d.up.railway.app' + req.url

  const headers = {}
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization']
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']

  let body = undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = JSON.stringify(req.body)
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' })
    const data = await upstream.text()
    res.status(upstream.status)
      .setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
      .send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}
