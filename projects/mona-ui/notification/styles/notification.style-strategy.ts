import { createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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
import {
    reinaNotificationActionVariants,
    reinaNotificationBaseVariants,
    reinaNotificationBodyVariants,
    reinaNotificationContainerBaseVariants,
    reinaNotificationContentVariants,
    reinaNotificationHeaderVariants,
    reinaNotificationIconVariants,
    reinaNotificationTextVariants
} from "./notification.reina.styles";
import {
    createNotificationActionVariants,
    createNotificationBaseVariants,
    createNotificationBodyVariants,
    createNotificationContainerVariants,
    createNotificationContentVariants,
    createNotificationHeaderVariants,
    createNotificationIconVariants,
    createNotificationTextVariants
} from "./notification.style-composition";
import type {
    NotificationStyleOverrides,
    NotificationStyleStrategy,
    NotificationVariantsFunctions
} from "./notification.types";

export function createNotificationStyleStrategy(
    overrides: readonly NotificationStyleOverrides[] = []
): NotificationStyleStrategy {
    const mona: NotificationVariantsFunctions = {
        action: createNotificationActionVariants(monaNotificationActionVariants, overrides, "mona"),
        base: createNotificationBaseVariants(monaNotificationBaseVariants, overrides, "mona"),
        body: createNotificationBodyVariants(monaNotificationBodyVariants, overrides, "mona"),
        container: createNotificationContainerVariants(monaNotificationContainerBaseVariants, overrides, "mona"),
        content: createNotificationContentVariants(monaNotificationContentVariants, overrides, "mona"),
        header: createNotificationHeaderVariants(monaNotificationHeaderVariants, overrides, "mona"),
        icon: createNotificationIconVariants(monaNotificationIconVariants, overrides, "mona"),
        text: createNotificationTextVariants(monaNotificationTextVariants, overrides, "mona")
    };
    const reina: NotificationVariantsFunctions = {
        action: createNotificationActionVariants(reinaNotificationActionVariants, overrides, "reina"),
        base: createNotificationBaseVariants(reinaNotificationBaseVariants, overrides, "reina"),
        body: createNotificationBodyVariants(reinaNotificationBodyVariants, overrides, "reina"),
        container: createNotificationContainerVariants(reinaNotificationContainerBaseVariants, overrides, "reina"),
        content: createNotificationContentVariants(reinaNotificationContentVariants, overrides, "reina"),
        header: createNotificationHeaderVariants(reinaNotificationHeaderVariants, overrides, "reina"),
        icon: createNotificationIconVariants(reinaNotificationIconVariants, overrides, "reina"),
        text: createNotificationTextVariants(reinaNotificationTextVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<NotificationVariantsFunctions>(mona, { reina: reina });
}
