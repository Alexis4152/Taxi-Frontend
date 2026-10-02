import { useMemo, useRef } from 'react'
import { Camera, User } from 'lucide-react'

/**
 * Selector de foto: en celular, el atributo "capture" ofrece abrir la camara directamente (el
 * usuario tambien puede elegir de su galeria - el navegador decide como presentar la opcion).
 */
export default function PhotoPicker({ value, onChange, existingUrl, size = 96, rounded = 'rounded-full' }) {
  const inputRef = useRef(null)

  const previewUrl = useMemo(() => {
    if (value) return URL.createObjectURL(value)
    return existingUrl || null
  }, [value, existingUrl])

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-ink-200 bg-ink-50 text-ink-300 ${rounded}`}
        style={{ width: size, height: size }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-8 w-8" />
        )}
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white">
          <Camera className="h-3 w-3" />
        </span>
      </button>
      <div className="text-xs text-ink-500">
        <p className="font-medium text-ink-700">Foto de perfil</p>
        <p>Toca el círculo para tomar una foto o subir una desde tu galería.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  )
}
