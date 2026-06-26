export default async function handler(req, res) {
  try {
    const slug = req.query.slug || []
    const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
    const target = 'https://web-production-93e78d.up.railway.app' + path 

    const auth = req.headers['authorization'] || ''
    const headers = { 'content-type': 'application/json', 'x-fingoh-auth': auth }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {})

    // First attempt
    let upstream = await fetch(target, { method: req.method, headers, body, redirect: 'manual' })
    
    // If 307, follow manually forcing HTTPS
    if (upstream.status === 307 || upstream.status === 308) {
      const location = upstream.headers.get('location')
      const httpsLocation = location.replace('http://', 'https://')
      upstream = await fetch(httpsLocation, { method: req.method, headers, body })
    }

    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: true } }
