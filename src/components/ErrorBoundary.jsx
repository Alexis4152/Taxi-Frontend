import { Component } from 'react'
import { RefreshCw } from 'lucide-react'
import Button from './ui/Button'
import Logo from './ui/Logo'

// Ultimo recurso: si algo truena al renderizar, esto evita que la pantalla se quede en blanco sin
// ninguna pista - siempre se ve algo con que reaccionar (recargar) en vez de una pagina vacia.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error capturado por ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center">
          <Logo withWordmark={false} size={48} />
          <div>
            <p className="text-sm font-semibold text-ink-900">Algo salió mal</p>
            <p className="mt-1 max-w-xs text-xs text-ink-500">Ocurrió un error inesperado. Intenta recargar la página.</p>
          </div>
          <Button variant="brand" icon={RefreshCw} onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
