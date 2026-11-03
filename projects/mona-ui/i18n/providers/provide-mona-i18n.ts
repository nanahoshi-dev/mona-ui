import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from "@angular/core";
import type { MonaI18nConfig } from "../models/mona-i18n-config";
import { MonaI18nService } from "../services/mona-i18n.service";
import { MONA_I18N_CONFIG } from "../tokens/mona-i18n-config.token";

export function provideMonaI18n(config: MonaI18nConfig = {}): EnvironmentProviders {
    const initialLocale = config.initialLocale;
    return makeEnvironmentProviders([
        {
            provide: MONA_I18N_CONFIG,
            useValue: config
        },
        ...(initialLocale == null
            ? []
            : [
                  // A failed load must not stop the application from starting: it keeps the configured locale.
                  provideAppInitializer(() =>
                      inject(MonaI18nService)
                          .load(initialLocale)
                          .catch((error: unknown) =>
                              console.error(`[mona-ui] Could not load the initial locale "${initialLocale}".`, error)
                          )
                  )
              ])
    ]);
}
