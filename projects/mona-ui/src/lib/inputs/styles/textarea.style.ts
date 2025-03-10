import { cva } from "class-variance-authority";

export const textAreaVariants = cva(
    `
        rounded-md border bg-transparent px-3 py-1
        border-input
        placeholder:text-muted-foreground
        selection:bg-primary selection:text-primary-foreground
        text-base shadow-xs
        transition-[color,box-shadow] ease-in-out duration-300
        outline-none
        disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
        md:text-sm
        focus-visible:ring-1 focus-visible:ring-ring/90
    `
);
