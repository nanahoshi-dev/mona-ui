import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    notificationContainerBaseVariants as monaNotificationContainerBaseVariants,
    notificationActionVariants as monaNotificationActionVariants,
    notificationBaseVariants as monaNotificationBaseVariants,
    notificationBodyVariants as monaNotificationBodyVariants,
    notificationContentVariants as monaNotificationContentVariants,
    notificationHeaderVariants as monaNotificationHeaderVariants,
    notificationIconVariants as monaNotificationIconVariants,
    notificationTextVariants as monaNotificationTextVariants
} from "./notification.mona.styles";

export const reinaNotificationContainerBaseVariants = createInheritedVariants(
    monaNotificationContainerBaseVariants,
    {}
);

export const reinaNotificationActionVariants = createInheritedVariants(monaNotificationActionVariants, {});

export const reinaNotificationBaseVariants = createInheritedVariants(monaNotificationBaseVariants, {
    add: "shadow-sm rounded-lg border-input-border",
    remove: "shadow-md border-border"
});

export const reinaNotificationBodyVariants = createInheritedVariants(monaNotificationBodyVariants, {});

export const reinaNotificationContentVariants = createInheritedVariants(monaNotificationContentVariants, {});

export const reinaNotificationHeaderVariants = createInheritedVariants(monaNotificationHeaderVariants, {});

export const reinaNotificationIconVariants = createInheritedVariants(monaNotificationIconVariants, {});

export const reinaNotificationTextVariants = createInheritedVariants(monaNotificationTextVariants, {});
