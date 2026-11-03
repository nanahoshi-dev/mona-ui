import type { DeepPartial } from "./deep-partial";
import type { MonaLocale } from "./mona-locale";
import type { MonaLocaleMessages } from "./mona-locale-messages";

export interface MonaI18nConfig {
    /**
     * Locale id loaded with {@link MonaI18nConfig.loadLocale} before the application starts, so the first render
     * is already localized. When loading fails, the application starts with {@link MonaI18nConfig.locale} (or
     * English) and the error is logged.
     */
    readonly initialLocale?: string;
    /**
     * Loads a locale by id for `MonaI18nService.load()` and {@link MonaI18nConfig.initialLocale}. Use
     * `loadMonaLocale` from `@nanahoshi/mona-ui/locales` for the official locales, or any function that resolves
     * to a `MonaLocale`, such as one that fetches a catalog over HTTP.
     */
    readonly loadLocale?: (localeId: string) => Promise<MonaLocale>;
    readonly locale?: MonaLocale;
    /**
     * Overrides applied only while the locale with that id is active, keyed by locale id such as "de-DE".
     * They take precedence over {@link MonaI18nConfig.messages}.
     */
    readonly localeMessages?: Readonly<Record<string, DeepPartial<MonaLocaleMessages>>>;
    /** Overrides applied whatever the active locale is. */
    readonly messages?: DeepPartial<MonaLocaleMessages>;
}

export interface MonaMessageOverrideOptions {
    /**
     * Locale id the overrides apply to. When omitted, the overrides apply to every locale.
     * Ids are canonicalized, so `de_DE` and `de-DE` address the same overrides.
     */
    readonly locale?: string;
}
