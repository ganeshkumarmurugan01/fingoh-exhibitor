export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  // /api/v1/staff → /api/v1/staff (keep full path, just forward as-is)
  const target = 'https://web-production-93e78d.up.railway.app' + url.pathname + url.search

  const headers = new Headers(req.headers)
  headers.delete('host')

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
  })

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  })
}
