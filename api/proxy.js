export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const target = 'https://web-production-93e78d.up.railway.app' + path

  const auth = req.headers['authorization'] || ''
  const headers = {
    'content-type': 'application/json',
    'x-fingoh-auth': auth,
  }

  // req.body is already parsed by Vercel - stringify it once
  let body = undefined
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' })
    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}
