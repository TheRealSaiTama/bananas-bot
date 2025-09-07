"use client"
import { useCallback, useRef, useState } from 'react'

type Props = {
  name: string
  accept?: string
  maxBytes?: number
  onFile: (file: File | null) => void
}

export default function UploadDropzone({ name, accept = 'image/png,image/jpeg', maxBytes = 6 * 1024 * 1024, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback((f: File) => {
    if (!accept.split(',').some(a => f.type === a)) return 'Only PNG/JPG allowed'
    if (f.size > maxBytes) return 'Max 6MB file size'
    return null
  }, [accept, maxBytes])

  const onPick = (f: File | null) => {
    if (!f) { setFile(null); onFile(null); return }
    const err = validate(f)
    if (err) { setError(err); return }
    setError(null)
    setFile(f)
    onFile(f)
  }

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-neutral-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-neutral-50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) onPick(f)
        }}
      >
        {file ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(file)} alt="preview" className="w-16 h-16 object-cover rounded-xl border" />
            <div className="text-left text-sm">
              <div className="font-medium truncate max-w-[180px]">{file.name}</div>
              <div className="text-neutral-500">{(file.size/1024).toFixed(1)} KB</div>
            </div>
            <button type="button" className="btn ml-auto" onClick={(e) => { e.stopPropagation(); setFile(null); onFile(null) }}>Remove</button>
          </div>
        ) : (
          <div className="text-sm text-neutral-600">
            <div className="font-medium mb-1">Drag & drop image here</div>
            <div>or click to choose PNG/JPG (≤6MB)</div>
          </div>
        )}
        <input ref={inputRef} name={name} type="file" accept={accept} className="hidden" onChange={(e)=>onPick(e.target.files?.[0] || null)} />
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  )
}

