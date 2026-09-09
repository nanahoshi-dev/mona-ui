import { InjectionToken } from "@angular/core";
import type { MonaI18nConfig } from "../models/mona-i18n-config";

export const MONA_I18N_CONFIG = new InjectionToken<MonaI18nConfig>("MONA_I18N_CONFIG", {
    factory: () => ({})
});
