import { computed, inject, Injectable, isDevMode, Signal, signal } from "@angular/core";
import type { DeepPartial } from "../models/deep-partial";
import { MONA_DEFAULT_LOCALE, type MonaLocale } from "../models/mona-locale";
import type { MonaLocaleMessages } from "../models/mona-locale-messages";
import { MONA_I18N_CONFIG } from "../tokens/mona-i18n-config.token";
import { canonicalizeLocaleId, MONA_FALLBACK_LOCALE_ID, tryCanonicalizeLocaleId } from "../utilities/locale-id";
import { mergeMessages, mergeTwo } from "../utilities/merge-messages";

@Injectable({
    providedIn: "root"
})
export class MonaI18nService {
    readonly #config = inject(MONA_I18N_CONFIG);
    readonly #locale = signal<MonaLocale>(this.#config.locale ?? MONA_DEFAULT_LOCALE);
    readonly #overrides = signal<DeepPartial<MonaLocaleMessages>>(this.#config.messages ?? {});

    public readonly direction = computed(() => this.#locale().direction);
    public readonly locale = this.#locale.asReadonly();
    /**
     * Canonical BCP 47 id of the active locale. POSIX ids such as `en_US` are converted to `en-US`,
     * and invalid ids resolve to `MONA_FALLBACK_LOCALE_ID` so formatters always receive a valid tag.
     */
    public readonly localeId = computed(() => canonicalizeLocaleId(this.#locale().id));

    public constructor() {
        warnOnInvalidLocaleId(this.#locale().id);
    }

    public clearMessages(): void {
        this.#overrides.set({});
    }

    public componentMessages<K extends keyof MonaLocaleMessages>(
        namespace: K,
        fallback: MonaLocaleMessages[K]
    ): Signal<MonaLocaleMessages[K]> {
        return computed(() => {
            const localeMessages = this.#locale().messages[namespace];
            const overrideMessages = this.#overrides()[namespace];
            return mergeMessages(fallback, localeMessages, overrideMessages);
        });
    }

    public patchMessages(messages: DeepPartial<MonaLocaleMessages>): void {
        this.#overrides.update(current => mergeTwo(current, messages));
    }

    public setMessages(messages: DeepPartial<MonaLocaleMessages>): void {
        this.#overrides.set(messages);
    }

    public use(locale: MonaLocale): void {
        warnOnInvalidLocaleId(locale.id);
        this.#locale.set(locale);
    }
}

function warnOnInvalidLocaleId(localeId: string): void {
    if (isDevMode() && tryCanonicalizeLocaleId(localeId) == null) {
        console.warn(
            `[mona-ui] "${localeId}" is not a valid BCP 47 locale id. Falling back to "${MONA_FALLBACK_LOCALE_ID}".`
        );
    }
}
