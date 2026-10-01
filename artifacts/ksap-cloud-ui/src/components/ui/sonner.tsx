import { Toaster as Sonner, toast as sonnerToast, type ExternalToast } from "sonner"

import { useDisplay } from "../../hooks/use-display"

type ToasterProps = React.ComponentProps<typeof Sonner>
type Message = Parameters<typeof sonnerToast>[0]

/** Source durations: info/default/success 4000ms, warning 7000ms, error sticky (dismissable). */
export const TOAST_DURATION = { default: 4000, info: 4000, success: 4000, warning: 7000, error: Infinity } as const

const withDuration = (duration: number, data?: ExternalToast): ExternalToast => ({ duration, ...data })

const base = (message: Message, data?: ExternalToast) => sonnerToast(message, withDuration(TOAST_DURATION.default, data))

const toast = Object.assign(base, {
  success: (m: Message, d?: ExternalToast) => sonnerToast.success(m, withDuration(TOAST_DURATION.success, d)),
  info: (m: Message, d?: ExternalToast) => sonnerToast.info(m, withDuration(TOAST_DURATION.info, d)),
  warning: (m: Message, d?: ExternalToast) => sonnerToast.warning(m, withDuration(TOAST_DURATION.warning, d)),
  error: (m: Message, d?: ExternalToast) => sonnerToast.error(m, withDuration(TOAST_DURATION.error, { closeButton: true, ...d })),
  message: (m: Message, d?: ExternalToast) => sonnerToast.message(m, withDuration(TOAST_DURATION.default, d)),
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  dismiss: sonnerToast.dismiss,
  getHistory: sonnerToast.getHistory,
  getToasts: sonnerToast.getToasts,
})

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useDisplay()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay",
          description: "text-muted-foreground",
          actionButton: "rounded-md bg-primary text-primary-foreground",
          cancelButton: "rounded-md bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
