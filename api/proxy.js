export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const target = 'https://web-production-93e78d.up.railway.app' + path

  // DEBUG - log what we have
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || 'MISSING'
  console.log('TARGET:', target)
  console.log('AUTH:', authHeader.slice(0, 30))
  console.log('ALL HEADERS:', JSON.stringify(Object.keys(req.headers)))

  const headers = {
    'authorization': authHeader,
    'content-type': req.headers['content-type'] || 'application/json',
  }

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)

  try {
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' })
    const data = await upstream.text()
    console.log('UPSTREAM STATUS:', upstream.status)
    res.status(upstream.status)
      .setHeader('content-type', 'application/json')
      .send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}
