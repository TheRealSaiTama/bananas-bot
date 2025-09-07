export async function tts(text: string, voiceId: string, apiKey: string): Promise<Uint8Array> {
  if (!apiKey) throw new Error('Missing ElevenLabs API key')
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'accept': 'audio/mpeg',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model_id: 'eleven_multilingual_v2',
      text
    })
  })
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`)
  const ab = await res.arrayBuffer()
  return new Uint8Array(ab)
}

