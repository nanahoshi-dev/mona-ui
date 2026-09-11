import type { DeepPartial } from "./deep-partial";
import type { MonaTextDirection } from "./mona-direction";
import type { MonaLocaleMessages } from "./mona-locale-messages";

export interface MonaLocale {
    readonly direction: MonaTextDirection;
    readonly id: string;
    readonly messages: DeepPartial<MonaLocaleMessages>;
}

export const MONA_DEFAULT_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "en-US",
    messages: {}
};
