import formidable from 'formidable'
import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 })
  const [fields, files] = await form.parse(req)

  const file = Array.isArray(files.file) ? files.file[0] : files.file
  if (!file) return res.status(400).json({ detail: 'No file' })

  const eventId = req.query.event_id
  const auth = req.headers['authorization'] || req.headers['x-fingoh-auth'] || ''

  const fd = new FormData()
  fd.append('file', fs.createReadStream(file.filepath), {
    filename: file.originalFilename || 'upload.csv',
    contentType: file.mimetype || 'text/csv',
  })

  const upstream = await fetch(
    `https://web-production-93e78d.up.railway.app/api/v1/audience/upload/${eventId}`,
    { method: 'POST', headers: { 'x-fingoh-auth': auth, ...fd.getHeaders() }, body: fd }
  )

  const data = await upstream.text()
  res.status(upstream.status).setHeader('content-type', 'application/json').send(data)
}
