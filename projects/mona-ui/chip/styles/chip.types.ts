import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { chipVariants as monaChipVariants } from "./chip.mona.styles";

export type ChipVariantsFunction = (props?: ChipVariantProps) => string;
export type ChipVariantProps = VariantProps<typeof monaChipVariants>;
export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
export type ChipStyleStrategy = ThemeStrategy<ChipVariantsFunction>;

export interface ChipStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<"true" | "false", ClassValue>>;
    readonly look?: Partial<Record<NonNullable<ChipVariantProps["look"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ChipVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ChipVariantProps["size"]>, ClassValue>>;
    readonly selected?: Partial<Record<"true" | "false", ClassValue>>;
    readonly compoundVariants?: readonly ChipCompoundStyleOverride[];
}

export interface ChipCompoundStyleOverride {
    readonly when: Partial<ChipVariantProps>;
    readonly class: ClassValue;
}

export type ChipStylesProviderConfig = ChipStyleOverrides | { readonly strategy: ChipStyleStrategy };
