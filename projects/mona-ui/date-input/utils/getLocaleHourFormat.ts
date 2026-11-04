import type { HourFormat } from "../models/HourFormat";

/**
 * The clock a locale uses by default: "12" for en-US, ja-JP and ko-KR, "24" for de-DE, fr-FR and tr-TR. Locales that
 * mark the hour cycle explicitly (`en-US-u-hc-h23`) are honoured.
 */
export function getLocaleHourFormat(localeId: string): HourFormat {
    try {
        const hourCycle = new Intl.DateTimeFormat(localeId, { hour: "numeric" }).resolvedOptions().hourCycle;
        return hourCycle === "h11" || hourCycle === "h12" ? "12" : "24";
    } catch {
        return "24";
    }
}
