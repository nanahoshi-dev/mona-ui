import { cva } from "class-variance-authority";

type ButtonLookKey =
    | "clear"
    | "default"
    | "error"
    | "ghost"
    | "info"
    | "link"
    | "outline"
    | "primary"
    | "secondary"
    | "success"
    | "warning";
type ButtonRoundedKey = "full" | "large" | "medium" | "none" | "small";
type ButtonSizeKey = "large" | "medium" | "small";

export interface ButtonRecipeConfig {
    readonly base: string;
    readonly disabledClass: string;
    readonly iconOnlySizes: Record<ButtonSizeKey, string>;
    readonly looks: Record<ButtonLookKey, string>;
    readonly rounded: Record<ButtonRoundedKey, string>;
    readonly selectedClass: Record<ButtonLookKey, string>;
    readonly sizes: Record<ButtonSizeKey, string>;
}

/**
 * Owns the button recipe's structural shape (variant keys, per-look selected-state
 * compounding, icon-only sizing) so each theme only has to supply its own class values,
 * not re-declare the whole cva skeleton.
 */
export function createButtonRecipe(config: ButtonRecipeConfig) {
    const lookKeys = Object.keys(config.looks) as ButtonLookKey[];
    const sizeKeys = Object.keys(config.iconOnlySizes) as ButtonSizeKey[];

    return cva(config.base, {
        variants: {
            disabled: {
                true: config.disabledClass,
                false: ""
            },
            iconOnly: {
                true: "aspect-square",
                false: "aspect-auto"
            },
            loading: {
                true: "pointer-events-none",
                false: ""
            },
            look: config.looks,
            rounded: config.rounded,
            size: config.sizes,
            // Always empty: every look has a matching compound variant below, which wins via twMerge.
            selected: {
                true: ""
            }
        },
        compoundVariants: [
            ...lookKeys.map(look => ({
                look,
                selected: true as const,
                class: config.selectedClass[look]
            })),
            ...sizeKeys.map(size => ({
                iconOnly: true as const,
                loading: false as const,
                size,
                class: config.iconOnlySizes[size]
            }))
        ],
        defaultVariants: {
            look: "default" as const,
            rounded: "medium" as const,
            size: "medium" as const
        }
    });
}
