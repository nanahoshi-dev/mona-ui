import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    notificationActionVariants as monaNotificationActionVariants,
    notificationBaseVariants as monaNotificationBaseVariants,
    notificationBodyVariants as monaNotificationBodyVariants,
    notificationContainerBaseVariants as monaNotificationContainerBaseVariants,
    notificationContentVariants as monaNotificationContentVariants,
    notificationHeaderVariants as monaNotificationHeaderVariants,
    notificationIconVariants as monaNotificationIconVariants,
    notificationTextVariants as monaNotificationTextVariants
} from "./notification.mona.styles";

const notificationContainerBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationContainerBaseVariants },
    monaNotificationContainerBaseVariants
);

export const notificationContainerBaseThemeVariants = (theme: ThemeStyle) =>
    notificationContainerBaseThemeVariantsStrategy.resolve(theme);

const notificationActionThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationActionVariants },
    monaNotificationActionVariants
);

export const notificationActionThemeVariants = (theme: ThemeStyle) =>
    notificationActionThemeVariantsStrategy.resolve(theme);

const notificationBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationBaseVariants },
    monaNotificationBaseVariants
);

export const notificationBaseThemeVariants = (theme: ThemeStyle) =>
    notificationBaseThemeVariantsStrategy.resolve(theme);

const notificationBodyThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationBodyVariants },
    monaNotificationBodyVariants
);

export const notificationBodyThemeVariants = (theme: ThemeStyle) =>
    notificationBodyThemeVariantsStrategy.resolve(theme);

const notificationContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationContentVariants },
    monaNotificationContentVariants
);

export const notificationContentThemeVariants = (theme: ThemeStyle) =>
    notificationContentThemeVariantsStrategy.resolve(theme);

const notificationHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationHeaderVariants },
    monaNotificationHeaderVariants
);

export const notificationHeaderThemeVariants = (theme: ThemeStyle) =>
    notificationHeaderThemeVariantsStrategy.resolve(theme);

const notificationIconThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationIconVariants },
    monaNotificationIconVariants
);

export const notificationIconThemeVariants = (theme: ThemeStyle) =>
    notificationIconThemeVariantsStrategy.resolve(theme);

const notificationTextThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNotificationTextVariants },
    monaNotificationTextVariants
);

export const notificationTextThemeVariants = (theme: ThemeStyle) =>
    notificationTextThemeVariantsStrategy.resolve(theme);

// type NotificationBaseVariantProps = VariantProps<ReturnType<typeof notificationBaseThemeVariants>>;
// type NotificationBaseVariantInput = VariantInputs<NotificationBaseVariantProps>;
//
// export type NotificationVariantProps = NotificationBaseVariantProps;
// export type NotificationVariantInput = NotificationBaseVariantInput;
