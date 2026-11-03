import { formatNumber, type MonaLocale, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import {
    MONA_AR_SA_LOCALE,
    MONA_DE_DE_LOCALE,
    MONA_ES_ES_LOCALE,
    MONA_FR_FR_LOCALE,
    MONA_ID_ID_LOCALE,
    MONA_IT_IT_LOCALE,
    MONA_JA_JP_LOCALE,
    MONA_KO_KR_LOCALE,
    MONA_PT_BR_LOCALE,
    MONA_RU_RU_LOCALE,
    MONA_TR_TR_LOCALE,
    MONA_ZH_CN_LOCALE,
    MONA_ZH_TW_LOCALE
} from "./public-api";

const OFFICIAL_LOCALES: readonly MonaLocale[] = [
    MONA_AR_SA_LOCALE,
    MONA_DE_DE_LOCALE,
    MONA_ES_ES_LOCALE,
    MONA_FR_FR_LOCALE,
    MONA_ID_ID_LOCALE,
    MONA_IT_IT_LOCALE,
    MONA_JA_JP_LOCALE,
    MONA_KO_KR_LOCALE,
    MONA_PT_BR_LOCALE,
    MONA_RU_RU_LOCALE,
    MONA_TR_TR_LOCALE,
    MONA_ZH_CN_LOCALE,
    MONA_ZH_TW_LOCALE
];

describe("numbers inside official locale messages", () => {
    for (const locale of OFFICIAL_LOCALES) {
        const messages = locale.messages as MonaLocaleMessages;

        describe(locale.id, () => {
            const grouped = formatNumber(12345, locale.id);

            it("formats counts with the locale's digits and grouping", () => {
                expect(messages.pager.pageStatus(2, 12345)).toContain(grouped);
                expect(messages.pager.rangeStatus(1, 20, 12345)).toContain(grouped);
                expect(messages.grid.selectRow(12345)).toContain(grouped);
                expect(messages.dropdowns.resultsAvailable(12345)).toContain(grouped);
                expect(messages.multiSelect.itemsCount(12345)).toContain(grouped);
                expect(messages.scrollView.pageOf(1, 12345)).toContain(grouped);
            });

            it("formats fractional values with the locale's decimal separator", () => {
                expect(messages.rating.valueText(3.5, 5)).toContain(formatNumber(3.5, locale.id));
            });

            it("never groups years", () => {
                const year = formatNumber(2026, locale.id, { useGrouping: false });
                expect(messages.calendar.yearCellLabel(2026)).toContain(year);
                expect(messages.calendar.decadeRange(2020, 2029)).toContain(
                    formatNumber(2020, locale.id, { useGrouping: false })
                );
                // es-ES and it-IT do not group four digits anyway, so only compare where grouping differs
                const groupedYear = formatNumber(2026, locale.id);
                expect(groupedYear !== year && messages.calendar.yearCellLabel(2026).includes(groupedYear)).toBe(false);
            });
        });
    }

    it("renders ar-SA counts with Arabic-Indic digits and the Arabic thousands separator", () => {
        const messages = MONA_AR_SA_LOCALE.messages as MonaLocaleMessages;
        expect(messages.pager.pageStatus(2, 12345)).toContain("١٢٬٣٤٥");
    });
});
