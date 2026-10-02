import MapLibreView from './MapLibreView'

// Punto de entrada estable para el resto de la app ("Map UI"): hoy renderiza MapLibreView, pero
// si en el futuro se necesita otra implementacion (ej. una variante mas ligera para un mapa
// pequeño), el resto de las paginas siguen importando MapView sin cambios.
export default function MapView(props) {
  return <MapLibreView {...props} />
}
