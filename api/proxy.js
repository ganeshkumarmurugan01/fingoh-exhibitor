export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  
  // Try with trailing slash first to avoid redirect
  const target = 'https://web-production-93e78d.up.railway.app' + path + '/'

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
    const upstream = await fetch(target, { 
      method: req.method, 
      headers, 
      body, 
      redirect: 'manual'  // don't follow redirects
    })
    
    // If redirect, retry with the location
    if (upstream.status === 307 || upstream.status === 308) {
      const location = upstream.headers.get('location')
      const retryUrl = location.startsWith('http') 
        ? location.replace('http://', 'https://') 
        : 'https://web-production-93e78d.up.railway.app' + location
      const retry = await fetch(retryUrl, { method: req.method, headers, body })
      const data = await retry.text()
      return res.status(retry.status).setHeader('content-type', 'application/json').send(data)
    }

    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: true } }
