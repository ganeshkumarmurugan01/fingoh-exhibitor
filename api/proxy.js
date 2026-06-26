export default async function handler(req, res) {
  try {
    const slug = req.query.slug || []
    const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
    // Add trailing slash to avoid 307 redirect which loses POST body
    const target = 'https://web-production-93e78d.up.railway.app' + path + (path.endsWith('/') ? '' : '/')

    const auth = req.headers['authorization'] || ''
    const headers = { 'content-type': 'application/json', 'x-fingoh-auth': auth }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {})

    const upstream = await fetch(target, { method: req.method, headers, body })
    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    console.error('Proxy error:', err.message, err.stack)
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: true } }
