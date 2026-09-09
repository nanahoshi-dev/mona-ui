import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const windowBaseThemeVariants = cva(
    `
        flex h-full w-full flex-col
        ${themeOverlaySurfaceClasses} text-foreground
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const windowContentContainerThemeVariants = cva(
    `
        relative flex h-full w-full flex-col
        border border-border
        shadow-(--shadow-overlay)
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        }
    }
);

export const windowContentThemeVariants = cva(
    `
        flex-1 overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
    `
);

export const windowResizerThemeVariants = cva(
    `
        absolute flex
    `,
    {
        variants: {
            position: {
                east: "inset-y-0 -end-0.5 w-2 cursor-ew-resize rtl:-start-0.5 rtl:end-auto",
                north: "inset-x-0 -top-0.5 h-2 cursor-ns-resize",
                south: "inset-x-0 -bottom-0.5 h-2 cursor-ns-resize",
                west: "inset-y-0 -start-0.5 w-2 cursor-ew-resize rtl:-end-0.5 rtl:start-auto",
                northeast: "-top-0.5 -end-0.5 w-2 h-2 cursor-nesw-resize rtl:-start-0.5 rtl:end-auto",
                northwest: "-top-0.5 -start-0.5 w-2 h-2 cursor-nwse-resize rtl:-end-0.5 rtl:start-auto",
                southeast: "-bottom-0.5 -end-0.5 w-2 h-2 cursor-nwse-resize rtl:-start-0.5 rtl:end-auto",
                southwest: "-bottom-0.5 -start-0.5 w-2 h-2 cursor-nesw-resize rtl:-end-0.5 rtl:start-auto"
            }
        }
    }
);

export const windowTitleBarActionThemeVariants = cva(
    `
        flex items-center justify-evenly
    `
);

export const windowTitleBarThemeVariants = cva(
    `
        flex items-center justify-start
        overflow-hidden px-2 py-1 text-sm
        border-b border-border-subtle
    `,
    {
        variants: {
            look: {
                default: "bg-surface-muted text-foreground",
                primary: "bg-primary text-primary-foreground"
            },
            rounded: {
                none: "rounded-ss-none rounded-se-none",
                small: "rounded-ss-sm rounded-se-sm",
                medium: "rounded-ss-md rounded-se-md",
                large: "rounded-ss-lg rounded-se-lg"
            }
        }
    }
);

export const windowTitleContainerThemeVariants = cva(
    `
        flex h-full flex-1 items-center overflow-hidden
        cursor-default select-none text-ellipsis
    `
);

export const windowTitleThemeVariants = cva(
    `
        overflow-hidden text-ellipsis whitespace-nowrap font-semibold
    `,
    {
        variants: {
            look: {
                default: "text-foreground",
                primary: "text-primary-foreground"
            }
        }
    }
);

type WindowBaseVariantProps = VariantProps<typeof windowBaseThemeVariants>;

type WindowBaseVariantInput = VariantInputs<WindowBaseVariantProps>;

type WindowContentContainerVariantProps = VariantProps<typeof windowContentContainerThemeVariants>;

type WindowContentContainerVariantInput = VariantInputs<WindowContentContainerVariantProps>;

type WindowContentVariantProps = VariantProps<typeof windowContentThemeVariants>;

export type WindowResizerVariantProps = VariantProps<typeof windowResizerThemeVariants>;

type WindowResizerVariantInput = VariantInputs<WindowResizerVariantProps>;

type WindowTitleBarActionVariantProps = VariantProps<typeof windowTitleBarActionThemeVariants>;

type WindowTitleBarActionVariantInput = VariantInputs<WindowTitleBarActionVariantProps>;

type WindowTitleBarVariantProps = VariantProps<typeof windowTitleBarThemeVariants>;

type WindowTitleBarVariantInput = VariantInputs<WindowTitleBarVariantProps>;

type WindowTitleContainerVariantProps = VariantProps<typeof windowTitleContainerThemeVariants>;

type WindowTitleContainerVariantInput = VariantInputs<WindowTitleContainerVariantProps>;

type WindowTitleVariantProps = VariantProps<typeof windowTitleThemeVariants>;

type WindowTitleVariantInput = VariantInputs<WindowTitleVariantProps>;

export type WindowVariantProps = WindowBaseVariantProps &
    WindowContentContainerVariantProps &
    WindowContentVariantProps &
    WindowResizerVariantProps &
    WindowTitleBarActionVariantProps &
    WindowTitleBarVariantProps &
    WindowTitleContainerVariantProps &
    WindowTitleVariantProps;

export type WindowVariantInput = WindowBaseVariantInput &
    WindowContentContainerVariantInput &
    Omit<WindowResizerVariantInput, "position"> &
    WindowTitleBarVariantInput &
    WindowTitleContainerVariantInput &
    WindowTitleBarActionVariantInput &
    WindowTitleVariantInput;

export type WindowContentVariantInput = Omit<WindowVariantInput, "look" | "position" | "rounded">;
