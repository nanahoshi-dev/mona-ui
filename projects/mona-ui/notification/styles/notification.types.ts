import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    notificationActionVariants as monaNotificationActionVariants,
    notificationBaseVariants as monaNotificationBaseVariants,
    notificationBodyVariants as monaNotificationBodyVariants,
    notificationContainerBaseVariants as monaNotificationContainerBaseVariants,
    notificationContentVariants as monaNotificationContentVariants,
    notificationHeaderVariants as monaNotificationHeaderVariants,
    notificationIconVariants as monaNotificationIconVariants,
    notificationTextVariants as monaNotificationTextVariants
} from "./notification.mona.styles";

export type NotificationContainerBaseVariantsFunction = (props?: NotificationContainerBaseVariantProps) => string;
export type NotificationContainerBaseVariantProps = VariantProps<typeof monaNotificationContainerBaseVariants>;

export type NotificationActionVariantsFunction = (props?: NotificationActionVariantProps) => string;
export type NotificationActionVariantProps = VariantProps<typeof monaNotificationActionVariants>;

export type NotificationBaseVariantsFunction = (props?: NotificationBaseVariantProps) => string;
export type NotificationBaseVariantProps = VariantProps<typeof monaNotificationBaseVariants>;

export type NotificationBodyVariantsFunction = (props?: NotificationBodyVariantProps) => string;
export type NotificationBodyVariantProps = VariantProps<typeof monaNotificationBodyVariants>;

export type NotificationContentVariantsFunction = (props?: NotificationContentVariantProps) => string;
export type NotificationContentVariantProps = VariantProps<typeof monaNotificationContentVariants>;

export type NotificationHeaderVariantsFunction = (props?: NotificationHeaderVariantProps) => string;
export type NotificationHeaderVariantProps = VariantProps<typeof monaNotificationHeaderVariants>;

export type NotificationIconVariantsFunction = (props?: NotificationIconVariantProps) => string;
export type NotificationIconVariantProps = VariantProps<typeof monaNotificationIconVariants>;

export type NotificationTextVariantsFunction = (props?: NotificationTextVariantProps) => string;
export type NotificationTextVariantProps = VariantProps<typeof monaNotificationTextVariants>;

export interface NotificationVariantsFunctions {
    readonly action: NotificationActionVariantsFunction;
    readonly base: NotificationBaseVariantsFunction;
    readonly body: NotificationBodyVariantsFunction;
    readonly container: NotificationContainerBaseVariantsFunction;
    readonly content: NotificationContentVariantsFunction;
    readonly header: NotificationHeaderVariantsFunction;
    readonly icon: NotificationIconVariantsFunction;
    readonly text: NotificationTextVariantsFunction;
}

export type NotificationStyleStrategy = ThemeStrategy<NotificationVariantsFunctions>;

export interface NotificationContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly position?: Partial<Record<NonNullable<NotificationContainerBaseVariantProps["position"]>, ClassValue>>;
    readonly positionType?: Partial<
        Record<NonNullable<NotificationContainerBaseVariantProps["positionType"]>, ClassValue>
    >;
}

export interface NotificationActionStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationBodyStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationContentStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationHeaderStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationIconStyleOverrides {
    readonly base?: ClassValue;
    readonly type?: Partial<Record<NonNullable<NotificationIconVariantProps["type"]>, ClassValue>>;
}

export interface NotificationTextStyleOverrides {
    readonly base?: ClassValue;
}

export interface NotificationStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly action?: NotificationActionStyleOverrides;
    readonly base?: NotificationBaseStyleOverrides;
    readonly body?: NotificationBodyStyleOverrides;
    readonly container?: NotificationContainerStyleOverrides;
    readonly content?: NotificationContentStyleOverrides;
    readonly header?: NotificationHeaderStyleOverrides;
    readonly icon?: NotificationIconStyleOverrides;
    readonly text?: NotificationTextStyleOverrides;
}

export type NotificationStylesProviderConfig =
    | NotificationStyleOverrides
    | { readonly strategy: NotificationStyleStrategy };
