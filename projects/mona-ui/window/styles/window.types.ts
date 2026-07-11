import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    windowBaseVariants as monaWindowBaseVariants,
    windowContentContainerVariants as monaWindowContentContainerVariants,
    windowContentVariants as monaWindowContentVariants,
    windowResizerVariants as monaWindowResizerVariants,
    windowTitleBarActionVariants as monaWindowTitleBarActionVariants,
    windowTitleBarVariants as monaWindowTitleBarVariants,
    windowTitleContainerVariants as monaWindowTitleContainerVariants,
    windowTitleVariants as monaWindowTitleVariants
} from "./window.mona.styles";

export type WindowBaseVariantsFunction = (props?: WindowBaseVariantProps) => string;
export type WindowBaseVariantProps = VariantProps<typeof monaWindowBaseVariants>;

export type WindowContentContainerVariantsFunction = (props?: WindowContentContainerVariantProps) => string;
export type WindowContentContainerVariantProps = VariantProps<typeof monaWindowContentContainerVariants>;

export type WindowContentVariantsFunction = (props?: WindowContentVariantProps) => string;
export type WindowContentVariantProps = VariantProps<typeof monaWindowContentVariants>;

export type WindowResizerVariantsFunction = (props?: WindowResizerVariantProps) => string;
export type WindowResizerVariantProps = VariantProps<typeof monaWindowResizerVariants>;

export type WindowTitleBarActionVariantsFunction = (props?: WindowTitleBarActionVariantProps) => string;
export type WindowTitleBarActionVariantProps = VariantProps<typeof monaWindowTitleBarActionVariants>;

export type WindowTitleBarVariantsFunction = (props?: WindowTitleBarVariantProps) => string;
export type WindowTitleBarVariantProps = VariantProps<typeof monaWindowTitleBarVariants>;

export type WindowTitleContainerVariantsFunction = (props?: WindowTitleContainerVariantProps) => string;
export type WindowTitleContainerVariantProps = VariantProps<typeof monaWindowTitleContainerVariants>;

export type WindowTitleVariantsFunction = (props?: WindowTitleVariantProps) => string;
export type WindowTitleVariantProps = VariantProps<typeof monaWindowTitleVariants>;

export type WindowBaseVariantInput = VariantInputs<WindowBaseVariantProps>;
export type WindowContentContainerVariantInput = VariantInputs<WindowContentContainerVariantProps>;
export type WindowResizerVariantInput = VariantInputs<WindowResizerVariantProps>;
export type WindowTitleBarActionVariantInput = VariantInputs<WindowTitleBarActionVariantProps>;
export type WindowTitleBarVariantInput = VariantInputs<WindowTitleBarVariantProps>;
export type WindowTitleContainerVariantInput = VariantInputs<WindowTitleContainerVariantProps>;
export type WindowTitleVariantInput = VariantInputs<WindowTitleVariantProps>;

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

export interface WindowVariantsFunctions {
    readonly base: WindowBaseVariantsFunction;
    readonly content: WindowContentVariantsFunction;
    readonly contentContainer: WindowContentContainerVariantsFunction;
    readonly resizer: WindowResizerVariantsFunction;
    readonly title: WindowTitleVariantsFunction;
    readonly titleBar: WindowTitleBarVariantsFunction;
    readonly titleBarAction: WindowTitleBarActionVariantsFunction;
    readonly titleContainer: WindowTitleContainerVariantsFunction;
}

export type WindowStyleStrategy = ThemeStrategy<WindowVariantsFunctions>;

export interface WindowBaseCompoundStyleOverride {
    readonly when: Partial<WindowBaseVariantProps>;
    readonly class: ClassValue;
}

export interface WindowBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<WindowBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly WindowBaseCompoundStyleOverride[];
}

export interface WindowContentContainerCompoundStyleOverride {
    readonly when: Partial<WindowContentContainerVariantProps>;
    readonly class: ClassValue;
}

export interface WindowContentContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<WindowContentContainerVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly WindowContentContainerCompoundStyleOverride[];
}

export interface WindowContentStyleOverrides {
    readonly base?: ClassValue;
}

export interface WindowResizerCompoundStyleOverride {
    readonly when: Partial<WindowResizerVariantProps>;
    readonly class: ClassValue;
}

export interface WindowResizerStyleOverrides {
    readonly base?: ClassValue;
    readonly position?: Partial<Record<NonNullable<WindowResizerVariantProps["position"]>, ClassValue>>;
    readonly compoundVariants?: readonly WindowResizerCompoundStyleOverride[];
}

export interface WindowTitleBarActionStyleOverrides {
    readonly base?: ClassValue;
}

export interface WindowTitleBarCompoundStyleOverride {
    readonly when: Partial<WindowTitleBarVariantProps>;
    readonly class: ClassValue;
}

export interface WindowTitleBarStyleOverrides {
    readonly base?: ClassValue;
    readonly look?: Partial<Record<NonNullable<WindowTitleBarVariantProps["look"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<WindowTitleBarVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly WindowTitleBarCompoundStyleOverride[];
}

export interface WindowTitleContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface WindowTitleCompoundStyleOverride {
    readonly when: Partial<WindowTitleVariantProps>;
    readonly class: ClassValue;
}

export interface WindowTitleStyleOverrides {
    readonly base?: ClassValue;
    readonly look?: Partial<Record<NonNullable<WindowTitleVariantProps["look"]>, ClassValue>>;
    readonly compoundVariants?: readonly WindowTitleCompoundStyleOverride[];
}

export interface WindowStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: WindowBaseStyleOverrides;
    readonly content?: WindowContentStyleOverrides;
    readonly contentContainer?: WindowContentContainerStyleOverrides;
    readonly resizer?: WindowResizerStyleOverrides;
    readonly title?: WindowTitleStyleOverrides;
    readonly titleBar?: WindowTitleBarStyleOverrides;
    readonly titleBarAction?: WindowTitleBarActionStyleOverrides;
    readonly titleContainer?: WindowTitleContainerStyleOverrides;
}

export type WindowStylesProviderConfig = WindowStyleOverrides | { readonly strategy: WindowStyleStrategy };
