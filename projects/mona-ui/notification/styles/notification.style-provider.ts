import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createNotificationStyleStrategy } from "./notification.style-strategy";
import type {
    NotificationStyleOverrides,
    NotificationStylesProviderConfig,
    NotificationStyleStrategy
} from "./notification.types";

export const NOTIFICATION_STYLE_OVERRIDES = new InjectionToken<readonly NotificationStyleOverrides[]>(
    "NOTIFICATION_STYLE_OVERRIDES"
);

export const NOTIFICATION_STYLE_STRATEGY = new InjectionToken<NotificationStyleStrategy>(
    "NOTIFICATION_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createNotificationStyleStrategy(inject(NOTIFICATION_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideNotificationStyles(config: NotificationStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: NOTIFICATION_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: NOTIFICATION_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
