import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const indicatorIconHostThemeVariants = cva(
    `h-full aspect-square flex-none inline-flex items-center justify-center self-stretch`,
    {
        variants: {
            interactive: {
                true: `
                    opacity-50
                    hover:opacity-90
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35 focus-visible:outline-none
                `,
                false: ""
            },
            preset: {
                clear: "",
                dropdown: "opacity-50",
                loading: ""
            }
        },
        defaultVariants: {
            interactive: false
        }
    }
);

export const indicatorIconSvgThemeVariants = cva(``, {
    variants: {
        loading: {
            true: "animate-[spin_2s_linear_infinite]",
            false: ""
        }
    },
    defaultVariants: {
        loading: false
    }
});

type IndicatorIconHostVariantProps = VariantProps<typeof indicatorIconHostThemeVariants>;

type IndicatorIconHostVariantInput = VariantInputs<IndicatorIconHostVariantProps>;

type IndicatorIconSvgVariantProps = VariantProps<typeof indicatorIconSvgThemeVariants>;

type IndicatorIconSvgVariantInput = VariantInputs<IndicatorIconSvgVariantProps>;

export type IndicatorIconVariantProps = IndicatorIconHostVariantProps & IndicatorIconSvgVariantProps;

export type IndicatorIconVariantInput = IndicatorIconHostVariantInput & IndicatorIconSvgVariantInput;
