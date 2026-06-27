const getRawBody = require('raw-body')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  try {
    const buffer = await getRawBody(req)
    const contentType = req.headers['content-type'] || ''
    const eventId = req.query.event_id
    const auth = req.headers['authorization'] || req.headers['x-fingoh-auth'] || ''

    const upstream = await fetch(
      `https://web-production-93e78d.up.railway.app/api/v1/audience/upload/${eventId}`,
      {
        method: 'POST',
        headers: { 'x-fingoh-auth': auth, 'content-type': contentType },
        body: buffer,
      }
    )

    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
}

module.exports.config = { api: { bodyParser: false } }
