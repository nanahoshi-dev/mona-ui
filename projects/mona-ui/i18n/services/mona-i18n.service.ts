import { computed, inject, Injectable, isDevMode, Signal, signal } from "@angular/core";
import type { DeepPartial } from "../models/deep-partial";
import type { MonaMessageOverrideOptions } from "../models/mona-i18n-config";
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
    readonly #localeOverrides = signal<ReadonlyMap<string, DeepPartial<MonaLocaleMessages>>>(
        createLocaleOverrides(this.#config.localeMessages)
    );
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

    /**
     * Removes overrides. With `options.locale`, only that locale's overrides are removed; without it, every
     * override is removed, global and per locale.
     */
    public clearMessages(options?: MonaMessageOverrideOptions): void {
        if (options?.locale == null) {
            this.#overrides.set({});
            this.#localeOverrides.set(new Map());
            return;
        }
        const localeId = canonicalizeLocaleId(options.locale);
        this.#localeOverrides.update(current => {
            const next = new Map(current);
            next.delete(localeId);
            return next;
        });
    }

    public componentMessages<K extends keyof MonaLocaleMessages>(
        namespace: K,
        fallback: MonaLocaleMessages[K]
    ): Signal<MonaLocaleMessages[K]> {
        return computed(() => {
            const localeMessages = this.#locale().messages[namespace];
            const overrideMessages = this.#overrides()[namespace];
            const localeOverrideMessages = this.#localeOverrides().get(this.localeId())?.[namespace];
            const merged = mergeMessages(fallback, localeMessages, overrideMessages);
            return mergeTwo<MonaLocaleMessages[K]>(merged, localeOverrideMessages);
        });
    }

    /**
     * Merges overrides into the existing ones. With `options.locale`, they apply only while that locale is
     * active, so overrides patched for German do not show after switching to English.
     */
    public patchMessages(messages: DeepPartial<MonaLocaleMessages>, options?: MonaMessageOverrideOptions): void {
        if (options?.locale == null) {
            this.#overrides.update(current => mergeTwo(current, messages));
            return;
        }
        const localeId = canonicalizeLocaleId(options.locale);
        this.#localeOverrides.update(current =>
            new Map(current).set(localeId, mergeTwo(current.get(localeId) ?? {}, messages))
        );
    }

    /**
     * Replaces the existing overrides. With `options.locale`, only that locale's overrides are replaced.
     */
    public setMessages(messages: DeepPartial<MonaLocaleMessages>, options?: MonaMessageOverrideOptions): void {
        if (options?.locale == null) {
            this.#overrides.set(messages);
            return;
        }
        const localeId = canonicalizeLocaleId(options.locale);
        this.#localeOverrides.update(current => new Map(current).set(localeId, messages));
    }

    public use(locale: MonaLocale): void {
        warnOnInvalidLocaleId(locale.id);
        this.#locale.set(locale);
    }
}

function createLocaleOverrides(
    localeMessages: Readonly<Record<string, DeepPartial<MonaLocaleMessages>>> | undefined
): ReadonlyMap<string, DeepPartial<MonaLocaleMessages>> {
    const overrides = new Map<string, DeepPartial<MonaLocaleMessages>>();
    for (const [localeId, messages] of Object.entries(localeMessages ?? {})) {
        const canonicalId = canonicalizeLocaleId(localeId);
        overrides.set(canonicalId, mergeTwo(overrides.get(canonicalId) ?? {}, messages));
    }
    return overrides;
}

function warnOnInvalidLocaleId(localeId: string): void {
    if (isDevMode() && tryCanonicalizeLocaleId(localeId) == null) {
        console.warn(
            `[mona-ui] "${localeId}" is not a valid BCP 47 locale id. Falling back to "${MONA_FALLBACK_LOCALE_ID}".`
        );
    }
}
