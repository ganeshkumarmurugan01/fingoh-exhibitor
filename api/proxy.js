export default async function handler(req, res) {
  try {
    const slug = req.query.slug || []
    const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
    const target = 'https://web-production-93e78d.up.railway.app' + path

    console.log('[proxy] method:', req.method)
    console.log('[proxy] slug:', JSON.stringify(req.query.slug))
    console.log('[proxy] path:', path)
    console.log('[proxy] target:', target)
    console.log('[proxy] body:', JSON.stringify(req.body))

    const auth = req.headers['authorization'] || req.headers['x-fingoh-auth'] || ''
    const isMultipart = (req.headers['content-type'] || '').includes('multipart')
    const headers = isMultipart
      ? { 'x-fingoh-auth': auth, 'content-type': req.headers['content-type'] }
      : { 'content-type': 'application/json', 'x-fingoh-auth': auth }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {})

    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'manual' })

    console.log('[proxy] upstream status:', upstream.status)
    console.log('[proxy] upstream location:', upstream.headers.get('location'))

    if (upstream.status === 307 || upstream.status === 308) {
      const location = upstream.headers.get('location')
      console.log('[proxy] following redirect to:', location)
      const httpsLocation = location.replace('http://', 'https://')
      const upstream2 = await fetch(httpsLocation, { method: req.method, headers, body })
      console.log('[proxy] redirected status:', upstream2.status)
      const data2 = await upstream2.text()
      console.log('[proxy] redirected body:', data2)
      return res.status(upstream2.status).setHeader('content-type', 'application/json').send(data2)
    }

    const data = await upstream.text()
    console.log('[proxy] response body:', data)
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    console.error('[proxy] CRASH:', err.message, err.stack)
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: true } }
