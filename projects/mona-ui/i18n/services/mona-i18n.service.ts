import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import type { DeepPartial } from "../models/deep-partial";
import { MONA_DEFAULT_LOCALE, type MonaLocale } from "../models/mona-locale";
import type { MonaLocaleMessages } from "../models/mona-locale-messages";
import { MONA_I18N_CONFIG } from "../tokens/mona-i18n-config.token";
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
    public readonly localeId = computed(() => this.#locale().id);

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
        this.#locale.set(locale);
    }
}
