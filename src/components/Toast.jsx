import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((message) => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, message }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-surface border border-border shadow-lg rounded-lg px-4 py-2.5 text-sm text-ink animate-toast-in"
          >
            <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx || (() => {})
}
