import { canonicalizeLocaleId, type MonaLocale, type MonaTextDirection } from "@nanahoshi/mona-ui/i18n";

/**
 * Official catalogs by canonical id. Each is its own entry point, so the dynamic imports give bundlers one chunk
 * per locale, downloaded only when that locale is loaded.
 */
const OFFICIAL_LOCALE_LOADERS: Readonly<Record<string, () => Promise<MonaLocale>>> = {
    "ar-SA": () => import("@nanahoshi/mona-ui/locales/ar-sa").then(m => m.MONA_AR_SA_LOCALE),
    "de-DE": () => import("@nanahoshi/mona-ui/locales/de-de").then(m => m.MONA_DE_DE_LOCALE),
    "es-ES": () => import("@nanahoshi/mona-ui/locales/es-es").then(m => m.MONA_ES_ES_LOCALE),
    "fr-FR": () => import("@nanahoshi/mona-ui/locales/fr-fr").then(m => m.MONA_FR_FR_LOCALE),
    "id-ID": () => import("@nanahoshi/mona-ui/locales/id-id").then(m => m.MONA_ID_ID_LOCALE),
    "it-IT": () => import("@nanahoshi/mona-ui/locales/it-it").then(m => m.MONA_IT_IT_LOCALE),
    "ja-JP": () => import("@nanahoshi/mona-ui/locales/ja-jp").then(m => m.MONA_JA_JP_LOCALE),
    "ko-KR": () => import("@nanahoshi/mona-ui/locales/ko-kr").then(m => m.MONA_KO_KR_LOCALE),
    "pt-BR": () => import("@nanahoshi/mona-ui/locales/pt-br").then(m => m.MONA_PT_BR_LOCALE),
    "ru-RU": () => import("@nanahoshi/mona-ui/locales/ru-ru").then(m => m.MONA_RU_RU_LOCALE),
    "tr-TR": () => import("@nanahoshi/mona-ui/locales/tr-tr").then(m => m.MONA_TR_TR_LOCALE),
    "zh-CN": () => import("@nanahoshi/mona-ui/locales/zh-cn").then(m => m.MONA_ZH_CN_LOCALE),
    "zh-TW": () => import("@nanahoshi/mona-ui/locales/zh-tw").then(m => m.MONA_ZH_TW_LOCALE)
};

/** Scripts written right to left (Unicode script codes). */
const RTL_SCRIPTS: ReadonlySet<string> = new Set([
    "Adlm",
    "Arab",
    "Hebr",
    "Mand",
    "Mend",
    "Nkoo",
    "Rohg",
    "Samr",
    "Syrc",
    "Thaa",
    "Yezi"
]);

/** Canonical ids of the official locales, the ones {@link loadMonaLocale} has a catalog for. */
export const MONA_OFFICIAL_LOCALE_IDS: readonly string[] = Object.keys(OFFICIAL_LOCALE_LOADERS);

/**
 * Loads the official locale for a locale id, downloading only that locale's catalog. Pass it to
 * `provideMonaI18n({ loadLocale: loadMonaLocale })`.
 *
 * - An official locale id (`de-DE`, or `de_DE`) loads that catalog.
 * - Otherwise the official catalog with the same language and script is used under the requested id, so `de-AT`
 *   gets German messages with Austrian formatting, and `zh-HK` gets Traditional Chinese.
 * - With no catalog for the language, the locale has no messages, so components show their English defaults
 *   while numbers and dates still follow the requested locale; its direction comes from its script.
 */
export function loadMonaLocale(localeId: string): Promise<MonaLocale> {
    const canonicalId = canonicalizeLocaleId(localeId);
    const officialId = findOfficialLocaleId(canonicalId);
    if (officialId == null) {
        return Promise.resolve({ direction: getScriptDirection(canonicalId), id: canonicalId, messages: {} });
    }
    return OFFICIAL_LOCALE_LOADERS[officialId]().then(locale =>
        locale.id === canonicalId ? locale : { ...locale, id: canonicalId }
    );
}

function findOfficialLocaleId(canonicalId: string): string | null {
    if (canonicalId in OFFICIAL_LOCALE_LOADERS) {
        return canonicalId;
    }
    const requested = new Intl.Locale(canonicalId).maximize();
    return (
        MONA_OFFICIAL_LOCALE_IDS.find(id => {
            const official = new Intl.Locale(id).maximize();
            return official.language === requested.language && official.script === requested.script;
        }) ?? null
    );
}

function getScriptDirection(localeId: string): MonaTextDirection {
    return RTL_SCRIPTS.has(new Intl.Locale(localeId).maximize().script ?? "") ? "rtl" : "ltr";
}
