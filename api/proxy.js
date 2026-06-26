export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  
  // Always add trailing slash to avoid Railway's 307 redirect
  const trailingSlash = path.endsWith('/') ? path : path + '/'
  const target = 'https://web-production-93e78d.up.railway.app' + trailingSlash

  const auth = req.headers['authorization'] || ''
  const headers = {
    'content-type': 'application/json',
    'x-fingoh-auth': auth,
  }

  let body = undefined
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = JSON.stringify(req.body ?? {})
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body })
    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: true } }
