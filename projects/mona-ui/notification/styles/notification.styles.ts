import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    notificationActionVariants as annaNotificationActionVariants,
    notificationBaseVariants as annaNotificationBaseVariants,
    notificationBodyVariants as annaNotificationBodyVariants,
    notificationContainerBaseVariants as annaNotificationContainerBaseVariants,
    notificationContentVariants as annaNotificationContentVariants,
    notificationHeaderVariants as annaNotificationHeaderVariants,
    notificationIconVariants as annaNotificationIconVariants,
    notificationTextVariants as annaNotificationTextVariants
} from "./notification.anna.styles";
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

export const notificationContainerBaseThemeVariants = createThemeStrategy({
    anna: annaNotificationContainerBaseVariants,
    mona: monaNotificationContainerBaseVariants
});

export const notificationActionThemeVariants = createThemeStrategy({
    anna: annaNotificationActionVariants,
    mona: monaNotificationActionVariants
});

export const notificationBaseThemeVariants = createThemeStrategy({
    anna: annaNotificationBaseVariants,
    mona: monaNotificationBaseVariants
});

export const notificationBodyThemeVariants = createThemeStrategy({
    anna: annaNotificationBodyVariants,
    mona: monaNotificationBodyVariants
});

export const notificationContentThemeVariants = createThemeStrategy({
    anna: annaNotificationContentVariants,
    mona: monaNotificationContentVariants
});

export const notificationHeaderThemeVariants = createThemeStrategy({
    anna: annaNotificationHeaderVariants,
    mona: monaNotificationHeaderVariants
});

export const notificationIconThemeVariants = createThemeStrategy({
    anna: annaNotificationIconVariants,
    mona: monaNotificationIconVariants
});

export const notificationTextThemeVariants = createThemeStrategy({
    anna: annaNotificationTextVariants,
    mona: monaNotificationTextVariants
});

// type NotificationBaseVariantProps = VariantProps<ReturnType<typeof notificationBaseThemeVariants>>;
// type NotificationBaseVariantInput = VariantInputs<NotificationBaseVariantProps>;
//
// export type NotificationVariantProps = NotificationBaseVariantProps;
// export type NotificationVariantInput = NotificationBaseVariantInput;
