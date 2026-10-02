import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * Confirmacion para operaciones criticas (dar de alta, asignar turno, dar de baja, etc.).
 * Uso: const { confirm, ConfirmDialogElement } = useConfirm(); ... if (await confirm({title, message})) { ... }
 * y renderizar <ConfirmDialogElement /> una vez en el componente.
 */
export function useConfirm() {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirmar', danger = false }) => {
    setState({ title, message, confirmLabel, danger })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const handle = (value) => {
    setState(null)
    resolver.current?.(value)
    resolver.current = null
  }

  const ConfirmDialogElement = () => (
    <Modal open={Boolean(state)} onClose={() => handle(false)} title={state?.title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${state?.danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm text-ink-600">{state?.message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => handle(false)}>
            Cancelar
          </Button>
          <Button variant={state?.danger ? 'danger' : 'brand'} onClick={() => handle(true)}>
            {state?.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )

  return { confirm, ConfirmDialogElement }
}
