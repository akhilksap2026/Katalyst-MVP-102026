import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-caption", "text-body", "text-subheading", "text-heading", "text-title", "text-display"],
      h: ["h-control", "h-target", "h-hairline"],
      w: ["w-hairline"],
      "min-h": ["min-h-textarea"],
      "max-w": ["max-w-page", "max-w-sheet"],
      size: ["size-control", "size-icon-xs", "size-icon-sm", "size-icon-md", "size-icon-lg", "size-icon-xl"],
      shadow: ["shadow-overlay", "shadow-critical"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}
