import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from './Field'
import { suggestAddress } from '../../services/geocodingService'

/**
 * Campo de direccion con autocompletado real: muestra una lista de direcciones cercanas segun lo
 * que el usuario va escribiendo, con preferencia por lo cercano a `near` (ver backend
 * GeocodingController.suggest), y solo aplica la que el mismo elija de la lista - nunca selecciona
 * sola la primera coincidencia como hacia el buscador anterior de un solo resultado. El debounce es
 * propio de cada instancia (no compartido a nivel modulo), para poder tener mas de un campo de
 * estos montado a la vez sin que uno le pise la busqueda al otro.
 */
export default function AddressAutocomplete({ value, onChange, onSelect, near, placeholder, autoFocus }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const requestIdRef = useRef(0)
  const debounceTimerRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const handleChange = (e) => {
    const text = e.target.value
    onChange(text)
    clearTimeout(debounceTimerRef.current)
    if (text.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const requestId = ++requestIdRef.current
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await suggestAddress(text, near)
        // Si el usuario ya siguio escribiendo, esta respuesta quedo vieja - se ignora para no
        // pisar la lista con resultados de una busqueda anterior que llego tarde.
        if (requestId !== requestIdRef.current) return
        setSuggestions(results)
        setOpen(true)
      } catch {
        if (requestId === requestIdRef.current) setSuggestions([])
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    }, 400)
  }

  const handleSelect = (result) => {
    setOpen(false)
    setSuggestions([])
    onSelect(result)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        icon={MapPin}
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onFocus={(e) => {
          // Selecciona todo el texto al enfocar, para poder borrar y escribir una nueva busqueda
          // de un tiro (un clic/tab) en vez de tener que borrar letra por letra.
          e.target.select()
          if (suggestions.length > 0) setOpen(true)
        }}
        onMouseUp={(e) => {
          // onFocus de arriba solo dispara la primera vez que se entra al campo - sin esto, un
          // clic posterior sobre el campo ya enfocado solo movia el cursor (y el doble clic solo
          // seleccionaba una palabra), en vez de volver a seleccionar todo el texto.
          e.preventDefault()
          e.target.select()
        }}
        placeholder={placeholder}
        endAdornment={loading ? <Loader2 className="h-4 w-4 animate-spin text-ink-400" /> : null}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-start gap-2 border-b border-ink-50 px-3 py-2.5 text-left text-sm text-ink-700 last:border-0 hover:bg-ink-50"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
              <span className="truncate">{s.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
