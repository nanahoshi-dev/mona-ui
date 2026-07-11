import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { PopupAnimationSettings } from "../models/PopupSettings";

export type PopupAnimationConfig = Required<PopupAnimationSettings>;
export type PopupAnimationStrategy = ThemeStrategy<PopupAnimationConfig>;

export interface PopupStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly enter?: string | string[];
    readonly leave?: string | string[];
}

export type PopupStylesProviderConfig = PopupStyleOverrides | { readonly strategy: PopupAnimationStrategy };
