export default async function handler(req, res) {
  try {
    const slug = req.query.slug || []
    const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
    const target = 'https://web-production-93e78d.up.railway.app' + path

    const auth = req.headers['authorization'] || req.headers['x-fingoh-auth'] || ''
    const isMultipart = (req.headers['content-type'] || '').includes('multipart')

    const headers = { 'x-fingoh-auth': auth }
    if (!isMultipart) headers['content-type'] = 'application/json'
    if (isMultipart) headers['content-type'] = req.headers['content-type']

    let body = undefined
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (isMultipart) {
        body = req
      } else {
        body = JSON.stringify(req.body ?? {})
      }
    }

    const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'manual', duplex: 'half' })

    if (upstream.status === 307 || upstream.status === 308) {
      const location = upstream.headers.get('location')
      const httpsLocation = location.replace('http://', 'https://')
      const upstream2 = await fetch(httpsLocation, { method: req.method, headers, body, duplex: 'half' })
      const data2 = await upstream2.text()
      return res.status(upstream2.status).setHeader('content-type', 'application/json').send(data2)
    }

    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    console.error('[proxy] CRASH:', err.message, err.stack)
    res.status(502).json({ detail: 'Proxy error: ' + err.message })
  }
}

export const config = { api: { bodyParser: false } }
