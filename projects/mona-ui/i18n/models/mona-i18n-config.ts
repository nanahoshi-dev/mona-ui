import type { DeepPartial } from "./deep-partial";
import type { MonaLocale } from "./mona-locale";
import type { MonaLocaleMessages } from "./mona-locale-messages";

export interface MonaI18nConfig {
    readonly locale?: MonaLocale;
    readonly messages?: DeepPartial<MonaLocaleMessages>;
}
