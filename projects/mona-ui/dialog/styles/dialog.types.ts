import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    dialogBaseVariants as monaDialogBaseVariants,
    dialogBodyVariants as monaDialogBodyVariants,
    dialogCloseButtonContainerVariants as monaDialogCloseButtonContainerVariants,
    dialogContentContainerVariants as monaDialogContentContainerVariants,
    dialogContentVariants as monaDialogContentVariants,
    dialogDescriptionVariants as monaDialogDescriptionVariants,
    dialogFooterVariants as monaDialogFooterVariants,
    dialogHeaderVariants as monaDialogHeaderVariants,
    dialogIconContainerVariants as monaDialogIconContainerVariants,
    dialogIconVariants as monaDialogIconVariants,
    dialogTitleContainerVariants as monaDialogTitleContainerVariants,
    dialogTitleVariants as monaDialogTitleVariants
} from "./dialog.mona.styles";

export type DialogBaseVariantsFunction = (props?: DialogBaseVariantProps) => string;
export type DialogBaseVariantProps = VariantProps<typeof monaDialogBaseVariants>;

export type DialogContentContainerVariantsFunction = (props?: DialogContentContainerVariantProps) => string;
export type DialogContentContainerVariantProps = VariantProps<typeof monaDialogContentContainerVariants>;

export type DialogBodyVariantsFunction = (props?: DialogBodyVariantProps) => string;
export type DialogBodyVariantProps = VariantProps<typeof monaDialogBodyVariants>;

export type DialogHeaderVariantsFunction = (props?: DialogHeaderVariantProps) => string;
export type DialogHeaderVariantProps = VariantProps<typeof monaDialogHeaderVariants>;

export type DialogIconContainerVariantsFunction = (props?: DialogIconContainerVariantProps) => string;
export type DialogIconContainerVariantProps = VariantProps<typeof monaDialogIconContainerVariants>;

export type DialogIconVariantsFunction = (props?: DialogIconVariantProps) => string;
export type DialogIconVariantProps = VariantProps<typeof monaDialogIconVariants>;

export type DialogTitleContainerVariantsFunction = (props?: DialogTitleContainerVariantProps) => string;
export type DialogTitleContainerVariantProps = VariantProps<typeof monaDialogTitleContainerVariants>;

export type DialogCloseButtonContainerVariantsFunction = (props?: DialogCloseButtonContainerVariantProps) => string;
export type DialogCloseButtonContainerVariantProps = VariantProps<typeof monaDialogCloseButtonContainerVariants>;

export type DialogTitleVariantsFunction = (props?: DialogTitleVariantProps) => string;
export type DialogTitleVariantProps = VariantProps<typeof monaDialogTitleVariants>;

export type DialogDescriptionVariantsFunction = (props?: DialogDescriptionVariantProps) => string;
export type DialogDescriptionVariantProps = VariantProps<typeof monaDialogDescriptionVariants>;

export type DialogContentVariantsFunction = (props?: DialogContentVariantProps) => string;
export type DialogContentVariantProps = VariantProps<typeof monaDialogContentVariants>;

export type DialogFooterVariantsFunction = (props?: DialogFooterVariantProps) => string;
export type DialogFooterVariantProps = VariantProps<typeof monaDialogFooterVariants>;

export type DialogBaseVariantInput = VariantInputs<DialogBaseVariantProps>;
export type DialogIconContainerVariantInput = VariantInputs<DialogIconContainerVariantProps>;
export type DialogIconVariantInput = VariantInputs<DialogIconVariantProps>;

export type DialogVariantProps = DialogBaseVariantProps & DialogIconContainerVariantProps & DialogIconVariantProps;
export type DialogVariantInput = DialogBaseVariantInput & DialogIconContainerVariantInput & DialogIconVariantInput;

export interface DialogVariantsFunctions {
    readonly base: DialogBaseVariantsFunction;
    readonly body: DialogBodyVariantsFunction;
    readonly closeButtonContainer: DialogCloseButtonContainerVariantsFunction;
    readonly content: DialogContentVariantsFunction;
    readonly contentContainer: DialogContentContainerVariantsFunction;
    readonly description: DialogDescriptionVariantsFunction;
    readonly footer: DialogFooterVariantsFunction;
    readonly header: DialogHeaderVariantsFunction;
    readonly icon: DialogIconVariantsFunction;
    readonly iconContainer: DialogIconContainerVariantsFunction;
    readonly title: DialogTitleVariantsFunction;
    readonly titleContainer: DialogTitleContainerVariantsFunction;
}

export type DialogStyleStrategy = ThemeStrategy<DialogVariantsFunctions>;

export interface DialogBaseCompoundStyleOverride {
    readonly when: Partial<DialogBaseVariantProps>;
    readonly class: ClassValue;
}

export interface DialogBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<DialogBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly DialogBaseCompoundStyleOverride[];
}

export interface DialogContentContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogBodyCompoundStyleOverride {
    readonly when: Partial<DialogBodyVariantProps>;
    readonly class: ClassValue;
}

export interface DialogBodyStyleOverrides {
    readonly base?: ClassValue;
    readonly hasIcon?: Partial<Record<`${NonNullable<DialogBodyVariantProps["hasIcon"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly DialogBodyCompoundStyleOverride[];
}

export interface DialogHeaderStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogIconContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogIconCompoundStyleOverride {
    readonly when: Partial<DialogIconVariantProps>;
    readonly class: ClassValue;
}

export interface DialogIconStyleOverrides {
    readonly base?: ClassValue;
    readonly type?: Partial<Record<NonNullable<DialogIconVariantProps["type"]>, ClassValue>>;
    readonly compoundVariants?: readonly DialogIconCompoundStyleOverride[];
}

export interface DialogTitleContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogCloseButtonContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogTitleStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogDescriptionStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogContentStyleOverrides {
    readonly base?: ClassValue;
}

export interface DialogFooterCompoundStyleOverride {
    readonly when: Partial<DialogFooterVariantProps>;
    readonly class: ClassValue;
}

export interface DialogFooterStyleOverrides {
    readonly base?: ClassValue;
    readonly layout?: Partial<Record<NonNullable<DialogFooterVariantProps["layout"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<DialogFooterVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly DialogFooterCompoundStyleOverride[];
}

export interface DialogStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: DialogBaseStyleOverrides;
    readonly body?: DialogBodyStyleOverrides;
    readonly closeButtonContainer?: DialogCloseButtonContainerStyleOverrides;
    readonly content?: DialogContentStyleOverrides;
    readonly contentContainer?: DialogContentContainerStyleOverrides;
    readonly description?: DialogDescriptionStyleOverrides;
    readonly footer?: DialogFooterStyleOverrides;
    readonly header?: DialogHeaderStyleOverrides;
    readonly icon?: DialogIconStyleOverrides;
    readonly iconContainer?: DialogIconContainerStyleOverrides;
    readonly title?: DialogTitleStyleOverrides;
    readonly titleContainer?: DialogTitleContainerStyleOverrides;
}

export type DialogStylesProviderConfig = DialogStyleOverrides | { readonly strategy: DialogStyleStrategy };
