import type { DeepPartial } from "./deep-partial";
import type { MonaLocale } from "./mona-locale";
import type { MonaLocaleMessages } from "./mona-locale-messages";

export interface MonaI18nConfig {
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
