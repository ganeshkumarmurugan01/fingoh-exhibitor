export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const target = 'https://web-production-93e78d.up.railway.app' + path

  // Vercel may strip Authorization - check x-forwarded-authorization as fallback
  const auth = req.headers['authorization'] 
    || req.headers['x-forwarded-authorization']
    || req.headers['x-auth-token']
    || ''

  console.log('TARGET:', target)
  console.log('AUTH present:', !!auth, auth.slice(0, 20))

  const headers = { 'content-type': 'application/json' }
  if (auth) headers['authorization'] = auth

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)

  try {
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' })
    const data = await upstream.text()
    console.log('UPSTREAM STATUS:', upstream.status, 'PATH:', path)
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}
