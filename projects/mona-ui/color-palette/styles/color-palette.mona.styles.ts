import { cva } from "class-variance-authority";

export const colorPaletteBaseVariants = cva(
    `
        grid gap-0.125 p-0.0625
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[disabled='true']:pointer-events-none
        data-[readonly='true']:cursor-default
        data-[invalid='true']:border
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2
        data-[invalid='true']:ring-error/35
    `
);

export const colorPaletteItemVariants = cva(
    `
        cursor-pointer
        transition-[transform,border-color,outline-color] ease-in-out duration-150 motion-reduce:transition-none
        data-[readonly='true']:cursor-default
        data-[selected='true']:border
        data-[selected='true']:border-border
        data-[selected='true']:outline
        data-[selected='true']:outline-2
        data-[selected='true']:outline-foreground
        data-[selected='true']:scale-90
        hover:border hover:border-border

        focus:not-data-[selected='true']:border
        focus:not-data-[selected='true']:border-foreground
        focus:not-data-[selected='true']:outline-none
        focus:not-data-[selected='true']:z-1
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);
