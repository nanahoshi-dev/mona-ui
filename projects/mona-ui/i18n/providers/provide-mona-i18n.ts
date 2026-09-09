import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import type { MonaI18nConfig } from "../models/mona-i18n-config";
import { MONA_I18N_CONFIG } from "../tokens/mona-i18n-config.token";

export function provideMonaI18n(config: MonaI18nConfig = {}): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: MONA_I18N_CONFIG,
            useValue: config
        }
    ]);
}
