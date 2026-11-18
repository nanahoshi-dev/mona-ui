import { cva, type VariantProps } from "class-variance-authority";

/** A line paints with its background, which forced colors drop, so it takes the text color there. */
const LINE_CLASSES = "bg-border forced-colors:bg-[CanvasText]";

export const separatorThemeVariants = cva("shrink-0", {
    variants: {
        labelled: {
            false: LINE_CLASSES,
            true: "flex w-full items-center gap-3 text-xs text-muted-foreground"
        },
        orientation: {
            horizontal: "",
            vertical: ""
        }
    },
    compoundVariants: [
        { labelled: false, orientation: "horizontal", class: "block h-px w-full" },
        { labelled: false, orientation: "vertical", class: "inline-block w-px self-stretch" }
    ],
    defaultVariants: {
        labelled: false,
        orientation: "horizontal"
    }
});

/** The lines on either side of a label. */
export const SEPARATOR_LABEL_LINE_CLASSES = `h-px flex-1 ${LINE_CLASSES}`;

export type SeparatorVariantProps = VariantProps<typeof separatorThemeVariants>;
