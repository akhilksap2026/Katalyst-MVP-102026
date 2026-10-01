"use client"

import * as React from "react"
import * as MenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils"

const ContextMenu = MenuPrimitive.Root

const ContextMenuTrigger = MenuPrimitive.Trigger

const ContextMenuGroup = MenuPrimitive.Group

const ContextMenuPortal = MenuPrimitive.Portal

const ContextMenuSub = MenuPrimitive.Sub

const ContextMenuRadioGroup = MenuPrimitive.RadioGroup

const ITEM =
  "relative flex h-control cursor-default select-none items-center gap-2 rounded-md px-2 text-body font-normal outline-none transition-colors duration-100 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:text-disabled [&_svg]:pointer-events-none [&_svg]:size-icon-md [&_svg]:shrink-0"
const PANEL =
  "z-50 min-w-32 overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-overlay"

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenuPrimitive.SubTrigger
    ref={ref}
    data-slot="context-menu-sub-trigger"
    className={cn(ITEM, "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", inset && "pl-8", className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </MenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = MenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.SubContent
    ref={ref}
    data-slot="context-menu-sub-content"
    className={cn(PANEL, className)}
    {...props}
  />
))
ContextMenuSubContent.displayName = MenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={ref}
      data-slot="context-menu-content"
      className={cn(PANEL, "max-h-[var(--radix-context-menu-content-available-height)]", className)}
      {...props}
    />
  </MenuPrimitive.Portal>
))
ContextMenuContent.displayName = MenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    data-slot="context-menu-item"
    className={cn(ITEM, inset && "pl-8", className)}
    {...props}
  />
))
ContextMenuItem.displayName = MenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenuPrimitive.CheckboxItem
    ref={ref}
    data-slot="context-menu-checkbox-item"
    className={cn(ITEM, "pl-8", className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <Check />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName = MenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenuPrimitive.RadioItem
    ref={ref}
    data-slot="context-menu-radio-item"
    className={cn(ITEM, "pl-8", className)}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <Circle className="size-icon-xs fill-current" />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = MenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Label
    ref={ref}
    data-slot="context-menu-label"
    className={cn("px-2 py-1 text-caption font-semibold text-muted-foreground", inset && "pl-8", className)}
    {...props}
  />
))
ContextMenuLabel.displayName = MenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    data-slot="context-menu-separator"
    className={cn("-mx-1 my-1 h-hairline bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = MenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn("ml-auto text-caption font-normal text-muted-foreground", className)}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
