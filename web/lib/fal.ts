// Minimal Fal.ai wrappers. Uses @fal-ai/client if available; otherwise REST fallback.

export async function edit(imageBytes: Uint8Array, mime: string, prompt: string, apiKey: string): Promise<Uint8Array> {
  if (!apiKey) throw new Error('Missing Fal.ai API key')
  // Use REST job submit endpoint
  const submitUrl = 'https://fal.run/fal-ai/nano-banana/edit'
  const form = new FormData()
  form.set('prompt', prompt)
  form.set('image', new Blob([imageBytes], { type: mime }), 'image')
  const res = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Authorization': `Key ${apiKey}` },
    body: form
  })
  if (!res.ok) throw new Error(`Fal submit failed ${res.status}`)
  const job = await res.json() as { id: string, status: string, result?: any }
  const result = await pollJob(job.id, apiKey)
  const url = result?.images?.[0]?.url || result?.image?.url
  if (!url) throw new Error('Fal job returned no image')
  const img = await fetch(url)
  if (!img.ok) throw new Error(`Fal image fetch failed ${img.status}`)
  const ab = await img.arrayBuffer()
  return new Uint8Array(ab)
}

async function pollJob(id: string, apiKey: string, timeoutMs = 60_000): Promise<any> {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const r = await fetch(`https://fal.run/v1/jobs/${id}`, { headers: { 'Authorization': `Key ${apiKey}` } })
    if (!r.ok) throw new Error(`Fal poll failed ${r.status}`)
    const j = await r.json()
    if (j.status === 'succeeded') return j.result
    if (j.status === 'failed' || j.status === 'error') throw new Error('Fal job failed')
    await new Promise(r => setTimeout(r, 1200))
  }
  throw new Error('Fal job timeout')
}

