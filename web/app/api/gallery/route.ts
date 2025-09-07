import { NextRequest } from 'next/server'
import { listGallery } from '@/lib/github'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  try {
    const items = await listGallery()
    return Response.json(items)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to load gallery' }), { status: 500 })
  }
}

