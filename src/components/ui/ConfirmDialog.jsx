import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { Label, Textarea } from './Field'

/**
 * Confirmacion para operaciones criticas (dar de alta, asignar turno, dar de baja, etc.).
 * Uso normal (resuelve boolean): const { confirm, ConfirmDialogElement } = useConfirm();
 * if (await confirm({title, message})) { ... }
 * Uso con texto libre (ej. motivo de baja): pasar requireInput: true + inputLabel - resuelve el
 * texto escrito al confirmar, o null si se cancela (nunca un string vacio por cancelar, para que
 * "if (reason === null) return" distinga cancelar de confirmar sin escribir nada).
 * Renderizar <ConfirmDialogElement /> una vez en el componente en cualquier caso.
 */
export function useConfirm() {
  const [state, setState] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const resolver = useRef(null)

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirmar', danger = false, requireInput = false, inputLabel, inputPlaceholder }) => {
    setState({ title, message, confirmLabel, danger, requireInput, inputLabel, inputPlaceholder })
    setInputValue('')
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const handle = (confirmed) => {
    const result = state?.requireInput ? (confirmed ? inputValue : null) : confirmed
    setState(null)
    resolver.current?.(result)
    resolver.current = null
  }

  // Se guarda el estado/handle "mas reciente" en un ref para que el componente devuelto abajo
  // tenga SIEMPRE la misma identidad entre renders. Si no, cada tecla escrita en el textarea
  // actualizaba inputValue -> re-renderizaba el componente que llama a useConfirm() ->
  // ConfirmDialogElement se volvia a crear como una funcion nueva -> React la trataba como un
  // componente distinto y remontaba el Modal entero desde cero, perdiendo el foco despues de
  // cada letra (eso es lo que se veia en "bloquear/desbloquear" al escribir el motivo).
  const latest = useRef()
  latest.current = { state, inputValue, handle }

  const ConfirmDialogElement = useRef(() => {
    const { state, inputValue, handle } = latest.current
    return (
      <Modal open={Boolean(state)} onClose={() => handle(false)} title={state?.title}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${state?.danger ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm text-ink-600">{state?.message}</p>
          </div>
          {state?.requireInput && (
            <div>
              {state.inputLabel && <Label>{state.inputLabel}</Label>}
              <Textarea
                rows={2}
                maxLength={300}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={state.inputPlaceholder}
                autoFocus
              />
            </div>
          )}
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
  }).current

  return { confirm, ConfirmDialogElement }
}
