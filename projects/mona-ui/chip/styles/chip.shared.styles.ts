import { cva } from "class-variance-authority";

type ChipLookKey = "default" | "error" | "ghost" | "info" | "outline" | "primary" | "secondary" | "success" | "warning";
type ChipRoundedKey = "full" | "large" | "medium" | "none" | "small";
type ChipSizeKey = "large" | "medium" | "small";

export interface ChipRecipeConfig {
    readonly base: string;
    readonly disabledClass: string;
    readonly looks: Record<ChipLookKey, string>;
    readonly rounded: Record<ChipRoundedKey, string>;
    readonly selectedClass: Record<ChipLookKey, string>;
    readonly sizes: Record<ChipSizeKey, string>;
}

/**
 * Owns the chip recipe's structural shape (variant keys, per-look selected-state
 * compounding) so each theme only has to supply its own class values.
 */
export function createChipRecipe(config: ChipRecipeConfig) {
    const lookKeys = Object.keys(config.looks) as ChipLookKey[];

    return cva(config.base, {
        variants: {
            disabled: {
                true: config.disabledClass,
                false: ""
            },
            look: config.looks,
            rounded: config.rounded,
            size: config.sizes,
            selected: {
                true: "",
                false: ""
            }
        },
        compoundVariants: lookKeys.map(look => ({
            look,
            selected: true as const,
            class: config.selectedClass[look]
        })),
        defaultVariants: {
            selected: false as const
        }
    });
}
