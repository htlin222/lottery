import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

interface BackgroundTextProps extends HTMLAttributes<HTMLDivElement> {
  text?: string
}

export function BackgroundText({
  text = "林協霆 made with love",
  className,
  ...props
}: BackgroundTextProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center pointer-events-none select-none",
        className
      )}
      {...props}
    >
      <div
        className="text-4xl font-bold text-black/5 whitespace-nowrap"
        style={{
          transform: "rotate(-45deg)",
        }}
      >
        {text}
      </div>
    </div>
  )
}
