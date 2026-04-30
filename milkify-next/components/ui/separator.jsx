"use client"

import * as React from "react"

const Separator = React.forwardRef(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <div
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={`shrink-0 bg-slate-200 dark:bg-slate-800 ${
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
      } ${className}`}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
