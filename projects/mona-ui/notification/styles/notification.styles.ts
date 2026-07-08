import { ThemeStyle } from "@mirei/mona-ui/theme";
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

export const notificationContainerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationContainerBaseVariants;
        default:
            return monaNotificationContainerBaseVariants;
    }
};

export const notificationActionThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationActionVariants;
        default:
            return monaNotificationActionVariants;
    }
};

export const notificationBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationBaseVariants;
        default:
            return monaNotificationBaseVariants;
    }
};

export const notificationBodyThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationBodyVariants;
        default:
            return monaNotificationBodyVariants;
    }
};

export const notificationContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationContentVariants;
        default:
            return monaNotificationContentVariants;
    }
};

export const notificationHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationHeaderVariants;
        default:
            return monaNotificationHeaderVariants;
    }
};

export const notificationIconThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationIconVariants;
        default:
            return monaNotificationIconVariants;
    }
};

export const notificationTextThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNotificationTextVariants;
        default:
            return monaNotificationTextVariants;
    }
};

// type NotificationBaseVariantProps = VariantProps<ReturnType<typeof notificationBaseThemeVariants>>;
// type NotificationBaseVariantInput = VariantInputs<NotificationBaseVariantProps>;
//
// export type NotificationVariantProps = NotificationBaseVariantProps;
// export type NotificationVariantInput = NotificationBaseVariantInput;
