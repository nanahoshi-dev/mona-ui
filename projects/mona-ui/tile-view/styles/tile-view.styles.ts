import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { cva, type VariantProps } from "class-variance-authority";

export const tileViewBaseThemeVariants = cva(
    `
        relative flex h-full w-full flex-col overflow-hidden
        bg-surface text-foreground
        border border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "text-sm",
                medium: "text-base",
                large: "text-lg"
            }
        }
    }
);

/**
 * The scrolling element, which takes the focus. The active tile shows where the keyboard is; with no tiles, the
 * element itself does, with a ring, or in contrast themes an outline drawn inside, since the host clips its overflow.
 */
export const tileViewViewportThemeVariants = cva(
    `h-full w-full outline-none focus-visible:outline-hidden [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]`,
    {
        variants: {
            empty: {
                true: "focus-visible:inset-ring-2 focus-visible:inset-ring-focus-indicator focus-visible:-outline-offset-2",
                false: ""
            }
        }
    }
);

/**
 * A tile. Selection is a background, and in contrast themes, where backgrounds and rings don't paint, a `Highlight`
 * frame; the keyboard's place is a ring, and there a dashed outline inside the frame. A tile a drag is over, where a
 * drop would do something, has the selection's tint and a frame in its color, as a file explorer shows the folder a
 * drop goes into.
 */
export const tileViewTileThemeVariants = cva(
    `
        relative flex shrink-0 cursor-default select-none flex-col overflow-hidden rounded-md text-foreground
        after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2
        after:border-transparent after:forced-color-adjust-none
        data-drop-target:bg-(--color-selected) data-drop-target:text-(--color-selected-foreground)
        data-drop-target:hover:bg-(--color-selected) data-drop-target:after:border-(--color-selected-border)
        forced-colors:data-drop-target:after:border-[Highlight]
    `,
    {
        variants: {
            selectable: { true: "", false: "" },
            selected: {
                true: `
                    bg-(--color-selected) text-(--color-selected-foreground)
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    forced-colors:after:border-[Highlight]
                `,
                false: ""
            },
            focused: {
                true: `
                    inset-ring-2 inset-ring-focus-indicator
                    forced-colors:outline-2 forced-colors:-outline-offset-4 forced-colors:outline-dashed
                    forced-colors:outline-[CanvasText]
                `,
                false: ""
            }
        },
        compoundVariants: [{ selectable: true, selected: false, class: "hover:bg-hover" }]
    }
);

type TileViewBaseVariantProps = VariantProps<typeof tileViewBaseThemeVariants>;

export type TileViewVariantProps = TileViewBaseVariantProps;

export type TileViewVariantInputs = VariantInputs<TileViewBaseVariantProps>;
