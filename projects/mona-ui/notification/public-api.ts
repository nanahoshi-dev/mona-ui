/*
 * Public API Surface of @nanahoshi/mona-ui/notification
 */

export * from "./services/notification.service";

export * from "./models/NotificationOptions";
export * from "./models/NotificationPosition";
export * from "./models/NotificationRef";
export * from "./models/NotificationType";

export {
    createNotificationStyleStrategy,
    NOTIFICATION_STYLE_OVERRIDES,
    NOTIFICATION_STYLE_STRATEGY,
    provideNotificationStyles
} from "./styles/notification.styles";
export type {
    NotificationActionStyleOverrides,
    NotificationActionVariantProps,
    NotificationBaseStyleOverrides,
    NotificationBaseVariantProps,
    NotificationBodyStyleOverrides,
    NotificationBodyVariantProps,
    NotificationContainerBaseVariantProps,
    NotificationContainerStyleOverrides,
    NotificationContentStyleOverrides,
    NotificationContentVariantProps,
    NotificationHeaderStyleOverrides,
    NotificationHeaderVariantProps,
    NotificationIconStyleOverrides,
    NotificationIconVariantProps,
    NotificationStyleOverrides,
    NotificationStylesProviderConfig,
    NotificationStyleStrategy,
    NotificationTextStyleOverrides,
    NotificationTextVariantProps,
    NotificationVariantsFunctions
} from "./styles/notification.styles";
