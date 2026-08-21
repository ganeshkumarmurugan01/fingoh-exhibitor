export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 120,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  try {
    const chunks = []
    await new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    const buffer = Buffer.concat(chunks)
    const contentType = req.headers['content-type'] || ''
    const eventId = req.query.event_id
    const auth = req.headers['authorization'] || req.headers['x-fingoh-auth'] || ''

    const backendUrl = process.env.BACKEND_URL || 'https://api.fingoh.ai'
    const slug = req.query.slug

    let uploadUrl
    if (slug === 'v1/products/upload-asset') {
      uploadUrl = `${backendUrl}/api/v1/products/upload-asset`
    } else if (slug === 'v1/products/upload-logo') {
      uploadUrl = `${backendUrl}/api/v1/products/upload-logo`
    } else if (slug === 'v1/products/upload-banner') {
      uploadUrl = `${backendUrl}/api/v1/products/upload-banner`
    } else {
      uploadUrl = `${backendUrl}/api/v1/audience/upload/${eventId}`
    }

    const upstream = await fetch(
      uploadUrl,
      {
        method: 'POST',
        headers: { 'x-fingoh-auth': auth, 'content-type': contentType },
        body: buffer,
        signal: AbortSignal.timeout(115000),
      }
    )

    const data = await upstream.text()
    res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
}
