"use client"

import * as React from "react"
import { PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  const toggleSidebar = React.useCallback(() => {
    setOpen((current) => !current)
  }, [])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggleSidebar,
    }),
    [open, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div data-slot="sidebar-wrapper" className={cn("flex min-h-screen w-full", className)} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  className,
  collapsible = "icon",
  side = "left",
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  collapsible?: "icon" | "offcanvas" | "none"
  side?: "left" | "right"
}) {
  const { open } = useSidebar()
  const hiddenClass = !open && collapsible === "offcanvas"
    ? side === "left"
      ? "-translate-x-full opacity-0"
      : "translate-x-full opacity-0"
    : "translate-x-0 opacity-100"
  const widthClass = open ? "w-64" : collapsible === "icon" ? "w-16" : "w-64"

  return (
    <aside
      data-slot="sidebar"
      data-open={open}
      data-side={side}
      data-collapsible={collapsible}
      className={cn(
        "relative z-20 flex h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        side === "right" && "border-l border-r-0",
        widthClass,
        hiddenClass,
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="sidebar-inset" className={cn("min-w-0 flex-1 bg-background", className)} {...props} />
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn("shrink-0", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("border-b p-3", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("flex-1 overflow-y-auto p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("border-t p-3", className)} {...props} />
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-separator" className={cn("my-2 h-px bg-border", className)} {...props} />
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="sidebar-group" className={cn("space-y-2 px-1 py-2", className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-label" className={cn("px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("space-y-1", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("space-y-1", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props} />
}

function SidebarMenuButton({
  className,
  isActive = false,
  component: Component = "button",
  ...props
}: {
  component?: React.ElementType
  isActive?: boolean
  className?: string
} & Record<string, unknown>) {
  return (
    <Component
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
}