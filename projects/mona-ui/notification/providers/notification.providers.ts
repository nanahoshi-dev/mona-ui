import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import type { NotificationDefaults } from "../models/NotificationDefaults";
import { DEFAULT_NOTIFICATION_DEFAULTS, NOTIFICATION_DEFAULTS } from "../tokens/notification.tokens";

/**
 * Sets application-wide notification behavior: whether timed notifications close on their own, how much longer they
 * stay, how many show at once, and whether the countdown pauses while the window is in the background.
 */
export function provideNotificationDefaults(defaults: Partial<NotificationDefaults>): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: NOTIFICATION_DEFAULTS, useValue: { ...DEFAULT_NOTIFICATION_DEFAULTS, ...defaults } }
    ]);
}
