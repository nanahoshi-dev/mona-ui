import { cva } from "class-variance-authority";

export const colorPaletteBaseVariants = cva(
    `
        grid gap-0.125 p-0.0625
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[readonly='true']:cursor-default
        data-[invalid='true']:border
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-1
        data-[invalid='true']:ring-error
    `
);

export const colorPaletteItemVariants = cva(
    `
        cursor-pointer
        transition-transform
        data-[readonly='true']:cursor-default
        data-[selected='true']:scale-90
        data-[selected='true']:border-2 data-[selected='true']:border-black/90
        data-[selected='true']:outline data-[selected='true']:outline-2 data-[selected='true']:outline-white/90
        hover:scale-95

        focus-visible:z-1
        focus-visible:not-data-[selected='true']:border-2
        focus-visible:not-data-[selected='true']:border-black/90
        focus-visible:not-data-[selected='true']:outline
        focus-visible:not-data-[selected='true']:outline-2
        focus-visible:not-data-[selected='true']:outline-white/90
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded",
                large: "rounded-[4px]",
                full: "rounded-full"
            }
        }
    }
);
