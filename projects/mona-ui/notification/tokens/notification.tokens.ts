import { InjectionToken } from "@angular/core";
import type { NotificationDefaults } from "../models/NotificationDefaults";
import type { NotificationRef } from "../models/NotificationRef";

/** The defaults used when nothing is provided with `provideNotificationDefaults()`. */
export const DEFAULT_NOTIFICATION_DEFAULTS: NotificationDefaults = {
    autoHide: true,
    durationScale: 1,
    pauseOnWindowBlur: true
};

/**
 * @description Application-wide notification settings. Provide them with `provideNotificationDefaults()`.
 */
export const NOTIFICATION_DEFAULTS = new InjectionToken<NotificationDefaults>("Mona UI notification defaults", {
    providedIn: "root",
    factory: () => DEFAULT_NOTIFICATION_DEFAULTS
});

/**
 * @description The `data` given in the notification's options, for a content component or template to inject.
 */
export const NOTIFICATION_DATA = new InjectionToken<unknown>("Mona UI notification data");

/**
 * @description The reference of the notification a content component or template is shown in.
 */
export const NOTIFICATION_REF = new InjectionToken<NotificationRef>("Mona UI notification reference");
