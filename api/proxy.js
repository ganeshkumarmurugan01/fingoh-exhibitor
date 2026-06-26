export default async function handler(req, res) {
  const slug = req.query.slug || []
  const path = '/api/' + (Array.isArray(slug) ? slug.join('/') : slug)
  const target = 'https://web-production-93e78d.up.railway.app' + path

  const auth = req.headers['authorization'] || ''
  const headers = {
    'content-type': 'application/json',
    'x-fingoh-auth': auth,
  }

  const body = ['GET', 'HEAD'].includes(req.method) 
    ? undefined 
    : JSON.stringify(req.body ?? {})

  const upstream = await fetch(target, { method: req.method, headers, body })
  const data = await upstream.text()
  res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
}

export const config = { api: { bodyParser: true } }
