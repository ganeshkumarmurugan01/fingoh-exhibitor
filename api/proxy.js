export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  const target = 'https://web-production-93e78d.up.railway.app' + url.pathname + url.search

  const proxyHeaders = {
    'content-type': req.headers.get('content-type') || 'application/json',
  }

  const auth = req.headers.get('authorization')
  if (auth) proxyHeaders['authorization'] = auth

  const res = await fetch(target, {
    method: req.method,
    headers: proxyHeaders,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    redirect: 'follow',
  })

  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  })
}
