"use client"

import { CheckCircleIcon, ChevronDownIcon, CircleIcon, Code, XCircleIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
/**
 * @title React AI Sandbox
 * @credit {"name": "Vercel", "url": "https://ai-sdk.dev/elements", "license": {"name": "Apache License 2.0", "url": "https://www.apache.org/licenses/LICENSE-2.0"}}
 * @description React AI sandbox component for displaying code execution environments with tabbed output
 * @opening Show code execution in a sandboxed environment—perfect for code interpreters, notebook cells, or AI-generated code previews. This component wraps a collapsible section with a status indicator (running, completed, error), then provides tabs for switching between different outputs like code, preview, console, or files. Great for displaying results from code execution tools or AI-generated runnable snippets.
 * @related [
 *   {"href":"/ai/code-block","title":"React AI Code Block","description":"Syntax highlighted code"},
 *   {"href":"/ai/terminal","title":"React AI Terminal","description":"Command output display"},
 *   {"href":"/ai/tool","title":"React AI Tool","description":"Tool execution display"},
 *   {"href":"/ai/artifact","title":"React AI Artifact","description":"Generated content container"},
 *   {"href":"/ai/test-results","title":"React AI Test Results","description":"Test output display"},
 *   {"href":"/ai/stack-trace","title":"React AI Stack Trace","description":"Error stack traces"}
 * ]
 * @questions [
 *   {"id":"sandbox-tabs","title":"How do I organize outputs?","answer":"Use SandboxTabs with SandboxTabsList and SandboxTabContent. Common tabs: 'code' for source, 'preview' for rendered output, 'console' for logs, 'files' for generated files."},
 *   {"id":"sandbox-status","title":"What states are available?","answer":"The header shows running (pulsing), completed (green check), or error (red X) status badges. Pass the state prop to SandboxHeader."},
 *   {"id":"sandbox-collapse","title":"Is it collapsible?","answer":"Yes, Sandbox uses Collapsible. Defaults to open. Click the header to toggle. Great for hiding verbose output after execution completes."},
 *   {"id":"sandbox-styling","title":"Can I customize the tabs?","answer":"SandboxTabsTrigger uses standard shadcn styling with bottom border highlight on active state. Override className on any component."}
 * ]
 */
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type SandboxState = "running" | "completed" | "error"

const getStatusBadge = (status: SandboxState) => {
  const labels: Record<SandboxState, string> = {
    running: "Running",
    completed: "Completed",
    error: "Error",
  }

  const icons: Record<SandboxState, ReactNode> = {
    running: <CircleIcon className="size-3 animate-pulse text-blue-600" />,
    completed: <CheckCircleIcon className="size-3 text-green-600" />,
    error: <XCircleIcon className="size-3 text-red-600" />,
  }

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  )
}

export type SandboxProps = ComponentProps<typeof Collapsible>

export const Sandbox = ({ className, ...props }: SandboxProps) => (
  <Collapsible
    className={cn("not-prose group mb-4 w-full overflow-hidden rounded-md border", className)}
    defaultOpen
    {...props}
  />
)

export interface SandboxHeaderProps {
  title?: string
  state: SandboxState
  className?: string
}

export const SandboxHeader = ({ className, title, state, ...props }: SandboxHeaderProps) => (
  <CollapsibleTrigger
    className={cn("flex w-full items-center justify-between gap-4 p-3", className)}
    {...props}
  >
    <div className="flex items-center gap-2">
      <Code className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{title}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
)

export type SandboxContentProps = ComponentProps<typeof CollapsibleContent>

export const SandboxContent = ({ className, ...props }: SandboxContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className,
    )}
    {...props}
  />
)

export type SandboxTabsProps = ComponentProps<typeof Tabs>

export const SandboxTabs = ({ className, ...props }: SandboxTabsProps) => (
  <Tabs className={cn("w-full gap-0", className)} {...props} />
)

export type SandboxTabsBarProps = ComponentProps<"div">

export const SandboxTabsBar = ({ className, ...props }: SandboxTabsBarProps) => (
  <div
    className={cn("flex w-full items-center border-border border-t border-b", className)}
    {...props}
  />
)

export type SandboxTabsListProps = ComponentProps<typeof TabsList>

export const SandboxTabsList = ({ className, ...props }: SandboxTabsListProps) => (
  <TabsList
    className={cn("h-auto rounded-none border-0 bg-transparent p-0", className)}
    {...props}
  />
)

export type SandboxTabsTriggerProps = ComponentProps<typeof TabsTrigger>

export const SandboxTabsTrigger = ({ className, ...props }: SandboxTabsTriggerProps) => (
  <TabsTrigger
    className={cn(
      "rounded-none border-0 border-transparent border-b-2 px-4 py-2 font-medium text-muted-foreground text-sm transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
      className,
    )}
    {...props}
  />
)

export type SandboxTabContentProps = ComponentProps<typeof TabsContent>

export const SandboxTabContent = ({ className, ...props }: SandboxTabContentProps) => (
  <TabsContent className={cn("mt-0 text-sm", className)} {...props} />
)

/** Demo component for preview */
export default function SandboxDemo() {
  const sampleCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`

  const sampleOutput = `> fibonacci(10)
55`

  return (
    <div className="w-full max-w-lg p-4">
      <Sandbox>
        <SandboxHeader title="Code Execution" state="completed" />
        <SandboxContent>
          <SandboxTabs defaultValue="code">
            <SandboxTabsBar>
              <SandboxTabsList>
                <SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
                <SandboxTabsTrigger value="console">Console</SandboxTabsTrigger>
              </SandboxTabsList>
            </SandboxTabsBar>
            <SandboxTabContent value="code">
              <pre className="overflow-auto bg-muted/30 p-4 font-mono text-xs">{sampleCode}</pre>
            </SandboxTabContent>
            <SandboxTabContent value="console">
              <pre className="overflow-auto bg-muted/30 p-4 font-mono text-xs text-green-600">
                {sampleOutput}
              </pre>
            </SandboxTabContent>
          </SandboxTabs>
        </SandboxContent>
      </Sandbox>
    </div>
  )
}
