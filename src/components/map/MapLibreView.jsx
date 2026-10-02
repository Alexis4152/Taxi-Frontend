import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, AlertTriangle, LocateFixed } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as mapService from '../../services/mapService'

/**
 * Unico componente de mapa de la app ("Map UI" del diagrama origen->destino->routing). Habla
 * solo con mapService.js, nunca con maplibre-gl directamente. Los tiles son vectoriales de
 * OpenFreeMap (ver src/config.js) - sin API key, basados en OpenStreetMap.
 */
export default function MapLibreView({
  origin,
  destination,
  driver,
  availableDrivers = [],
  routeGeometry,
  height = 'clamp(240px, 42dvh, 420px)',
  onMapClick,
  pickingLabel,
  myLocation,
  defaultCenter,
  defaultZoom,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick
  const [mapError, setMapError] = useState(null)
  const webglSupported = mapService.isWebglSupported()
  const myLocationRef = useRef(myLocation)
  myLocationRef.current = myLocation

  const handleRecenter = () => {
    const map = mapRef.current
    if (map && myLocationRef.current) mapService.fitToPoints(map, [myLocationRef.current])
  }

  useEffect(() => {
    if (!webglSupported) return undefined

    const map = mapService.createMap(containerRef.current, {
      center: origin ? [origin.lng, origin.lat] : defaultCenter ? [defaultCenter.lng, defaultCenter.lat] : undefined,
      zoom: defaultZoom,
      onError: setMapError,
    })
    mapRef.current = map

    const handleClick = (e) => onMapClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
      mapService.destroyMap(map)
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglSupported])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (origin) mapService.upsertMarker(map, 'origin', { ...origin, kind: 'user' })
    else mapService.removeMarker(map, 'origin')
  }, [origin])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (destination) mapService.upsertMarker(map, 'destination', { ...destination, kind: 'destination' })
    else mapService.removeMarker(map, 'destination')
  }, [destination])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (driver) mapService.upsertMarker(map, 'assigned-driver', { ...driver, kind: 'assigned-taxi' })
    else mapService.removeMarker(map, 'assigned-driver')
  }, [driver])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    mapService.removeAllMarkers(map, (id) => id.startsWith('available-'))
    availableDrivers.forEach((d) => {
      mapService.upsertMarker(map, `available-${d.driverId}`, { lat: d.lat, lng: d.lng, kind: 'available-taxi' })
    })
  }, [availableDrivers])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      if (routeGeometry?.length) mapService.drawRoute(map, routeGeometry)
      else mapService.clearRoute(map)
    }
    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [routeGeometry])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const points = [origin, destination, driver, ...availableDrivers.map((d) => ({ lat: d.lat, lng: d.lng }))].filter(Boolean)
    if (points.length === 0) return
    const run = () => mapService.fitToPoints(map, points)
    if (map.isStyleLoaded()) run()
    else map.once('load', run)
    // Solo se reencuadra cuando aparece/desaparece un origen/destino/operador o cambia la
    // cantidad de operadores disponibles - no en cada actualizacion de posicion, para que el
    // mapa no salte de zoom/centro mientras el usuario lo esta viendo.
  }, [origin, destination, driver, availableDrivers.length])

  if (!webglSupported) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-6 text-center"
        style={{ height }}
      >
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="text-sm font-medium text-ink-700">Tu navegador no soporta WebGL</p>
        <p className="max-w-xs text-xs text-ink-400">
          El mapa necesita WebGL para dibujarse. Prueba con otro navegador o activa la aceleración por
          hardware en la configuración de este.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100 shadow-sm shadow-ink-900/[0.03]">
      {onMapClick && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow">
          <MousePointerClick className="h-3.5 w-3.5" />
          {pickingLabel || 'Toca el mapa para elegir el punto'}
        </span>
      )}
      {mapError && (
        <span className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-red-600/90 px-2.5 py-1.5 text-[11px] font-medium text-white shadow">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          No se pudo cargar el mapa: {mapError}
        </span>
      )}
      {myLocation && (
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Ir a mi ubicación"
          title="Ir a mi ubicación"
          className="absolute bottom-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-700 shadow-md hover:bg-ink-50"
        >
          <LocateFixed className="h-4.5 w-4.5" />
        </button>
      )}
      <div ref={containerRef} style={{ height }} />
    </div>
  )
}
