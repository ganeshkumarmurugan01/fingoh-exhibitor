export default async function handler(req, res) {
  const target = 'https://web-production-93e78d.up.railway.app' + req.url.replace('/api', '/api')

  const headers = { 'content-type': 'application/json' }
  if (req.headers.authorization) headers['authorization'] = req.headers.authorization

  let body = undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = JSON.stringify(req.body)
  }

  const upstream = await fetch(target, { method: req.method, headers, body, redirect: 'follow' })
  const data = await upstream.text()

  res.status(upstream.status)
    .setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
    .send(data)
}
