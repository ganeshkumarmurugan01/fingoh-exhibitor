export default async function handler(req, res) {
  // When rewrite /api/(.*) → /api/proxy, original path is in req.url still
  // but we need to reconstruct it from the query slug
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const qs = new URL(req.url, 'http://localhost').search
  const target = 'https://web-production-93e78d.up.railway.app' + path + qs

  const headers = {}
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization']
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)

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
