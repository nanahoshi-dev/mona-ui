import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";

export type SplitButtonVariantsFunction = typeof monaSplitButtonVariants;
export type SplitButtonVariantProps = VariantProps<SplitButtonVariantsFunction>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
export type SplitButtonStyleStrategy = ThemeStrategy<SplitButtonVariantsFunction>;

const defaultSplitButtonStrategy = createThemeStrategy<SplitButtonVariantsFunction>(
    { mona: monaSplitButtonVariants },
    monaSplitButtonVariants
);

export const splitButtonThemeVariants = (theme: ThemeStyle): SplitButtonVariantsFunction =>
    defaultSplitButtonStrategy.resolve(theme);

export const SPLIT_BUTTON_STYLE_STRATEGY = new InjectionToken<SplitButtonStyleStrategy>("SPLIT_BUTTON_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => defaultSplitButtonStrategy
});

export function provideSplitButtonStyles(strategy: SplitButtonStyleStrategy): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: SPLIT_BUTTON_STYLE_STRATEGY, useValue: strategy }]);
}
