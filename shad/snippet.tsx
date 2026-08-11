"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
/**
 * @title React AI Snippet
 * @credit {"name": "Vercel", "url": "https://ai-sdk.dev/elements", "license": {"name": "Apache License 2.0", "url": "https://www.apache.org/licenses/LICENSE-2.0"}}
 * @description React AI snippet component for displaying copyable code snippets and CLI commands
 * @opening Need to show an installation command, API key, or quick code snippet? This component gives you a clean inline input with a copy button. Perfect for "npm install" commands, environment variable values, or any short code users need to grab. The input is read-only, monospace font, and the copy button shows a checkmark after copying. Wrap it in an addon for labels like "$" for shell commands or "API_KEY" for environment variables.
 * @related [
 *   {"href":"/ai/code-block","title":"React AI Code Block","description":"Full syntax highlighting"},
 *   {"href":"/ai/terminal","title":"React AI Terminal","description":"Command output display"},
 *   {"href":"/ai/artifact","title":"React AI Artifact","description":"Generated content container"},
 *   {"href":"/ai/tool","title":"React AI Tool","description":"Tool execution display"},
 *   {"href":"/ai/message","title":"React AI Message","description":"Chat message bubbles"},
 *   {"href":"/ai/context","title":"React AI Context","description":"File context display"}
 * ]
 * @questions [
 *   {"id":"snippet-copy","title":"How does the copy button work?","answer":"Click it and the code prop value gets copied to clipboard. Shows a checkmark for 2 seconds (configurable via timeout prop), then reverts to copy icon."},
 *   {"id":"snippet-addon","title":"What is SnippetAddon for?","answer":"Adds a prefix label like '$' for shell commands or 'API_KEY=' for environment variables. Uses shadcn/ui InputGroup styling for consistent look."},
 *   {"id":"snippet-styling","title":"Can I customize the appearance?","answer":"className on any subcomponent. Default uses monospace font, muted text for labels. The input is read-only so it can't be edited."},
 *   {"id":"snippet-long","title":"What about long snippets?","answer":"For multi-line or syntax-highlighted code, use CodeBlock instead. Snippet is meant for single-line commands and values."}
 * ]
 */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SnippetContextType {
  code: string
}

const SnippetContext = createContext<SnippetContextType>({
  code: "",
})

export type SnippetProps = HTMLAttributes<HTMLDivElement> & {
  code: string
}

export const Snippet = ({ code, className, children, ...props }: SnippetProps) => (
  <SnippetContext.Provider value={{ code }}>
    <div className={cn("flex items-center font-mono", className)} {...props}>
      {children}
    </div>
  </SnippetContext.Provider>
)

export type SnippetAddonProps = HTMLAttributes<HTMLDivElement>

export const SnippetAddon = ({ className, ...props }: SnippetAddonProps) => (
  <div
    className={cn(
      "flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-muted-foreground text-sm",
      className,
    )}
    {...props}
  />
)

export type SnippetTextProps = HTMLAttributes<HTMLSpanElement>

export const SnippetText = ({ className, ...props }: SnippetTextProps) => (
  <span className={cn("font-normal text-muted-foreground", className)} {...props} />
)

export type SnippetInputProps = Omit<ComponentProps<typeof Input>, "readOnly" | "value">

export const SnippetInput = ({ className, ...props }: SnippetInputProps) => {
  const { code } = useContext(SnippetContext)

  return (
    <Input
      className={cn("rounded-none border-r-0 text-foreground", className)}
      readOnly
      value={code}
      {...props}
    />
  )
}

export type SnippetCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export const SnippetCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: SnippetCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<number>(0)
  const { code } = useContext(SnippetContext)

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"))
      return
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code)
        setIsCopied(true)
        onCopy?.()
        timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout)
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <Button
      aria-label="Copy"
      className={cn("rounded-l-none", className)}
      onClick={copyToClipboard}
      size="icon"
      title="Copy"
      variant="outline"
      {...props}
    >
      {children ?? <Icon className="size-3.5" />}
    </Button>
  )
}

/** Demo component for preview */
export default function SnippetDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 p-4">
      <Snippet code="npm install @shadcn/ui">
        <SnippetAddon>
          <SnippetText>$</SnippetText>
        </SnippetAddon>
        <SnippetInput />
        <SnippetCopyButton />
      </Snippet>

      <Snippet code="sk-proj-abc123xyz789">
        <SnippetAddon>
          <SnippetText>API_KEY</SnippetText>
        </SnippetAddon>
        <SnippetInput />
        <SnippetCopyButton />
      </Snippet>
    </div>
  )
}
