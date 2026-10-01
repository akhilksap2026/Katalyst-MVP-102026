import { toast as adapter } from "../components/ui/sonner"

type ToastInput = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

/** Legacy adapter: forwards to the packaged sonner adapter (source durations); keeps no state. */
function toast({ title, description, variant = "default" }: ToastInput) {
  const message = title ?? description ?? ""
  const options = title !== undefined && description !== undefined ? { description } : undefined
  const id = variant === "destructive" ? adapter.error(message, options) : adapter(message, options)
  return { id, dismiss: () => adapter.dismiss(id) }
}

function useToast() {
  return { toast, dismiss: (id?: string | number) => adapter.dismiss(id) }
}

export { useToast, toast }
