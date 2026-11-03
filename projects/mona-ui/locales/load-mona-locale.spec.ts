import { describe, expect, it } from "vitest";
import { MONA_DE_DE_LOCALE } from "./de-de/de-de.locale";
import { loadMonaLocale, MONA_OFFICIAL_LOCALE_IDS } from "./load-mona-locale";
import { MONA_ZH_CN_LOCALE } from "./zh-cn/zh-cn.locale";
import { MONA_ZH_TW_LOCALE } from "./zh-tw/zh-tw.locale";

describe("loadMonaLocale", () => {
    it("loads every official locale under its own id", async () => {
        for (const id of MONA_OFFICIAL_LOCALE_IDS) {
            const locale = await loadMonaLocale(id);
            expect(locale.id).toBe(id);
            expect(Object.keys(locale.messages).length).toBeGreaterThan(0);
        }
    });

    it("returns the official locale object for an exact or POSIX id", async () => {
        expect(await loadMonaLocale("de-DE")).toBe(MONA_DE_DE_LOCALE);
        expect(await loadMonaLocale("de_DE")).toBe(MONA_DE_DE_LOCALE);
    });

    it("uses the catalog of the same language under the requested id", async () => {
        const locale = await loadMonaLocale("de-AT");

        expect(locale.id).toBe("de-AT");
        expect(locale.messages).toBe(MONA_DE_DE_LOCALE.messages);
        expect(locale.direction).toBe("ltr");
    });

    it("matches Chinese by script", async () => {
        expect((await loadMonaLocale("zh-HK")).messages).toBe(MONA_ZH_TW_LOCALE.messages);
        expect((await loadMonaLocale("zh-SG")).messages).toBe(MONA_ZH_CN_LOCALE.messages);
        expect((await loadMonaLocale("zh-Hant")).messages).toBe(MONA_ZH_TW_LOCALE.messages);
    });

    it("returns a locale without messages when there is no catalog for the language", async () => {
        expect(await loadMonaLocale("nl-NL")).toEqual({ direction: "ltr", id: "nl-NL", messages: {} });
    });

    it("derives the direction of an unknown locale from its script", async () => {
        expect((await loadMonaLocale("he-IL")).direction).toBe("rtl");
        expect((await loadMonaLocale("fa-IR")).direction).toBe("rtl");
        expect((await loadMonaLocale("ur")).direction).toBe("rtl");
        expect((await loadMonaLocale("az-Arab")).direction).toBe("rtl");
        expect((await loadMonaLocale("az-AZ")).direction).toBe("ltr");
    });

    it("keeps the Arabic catalog right to left for other Arabic regions", async () => {
        const locale = await loadMonaLocale("ar-EG");

        expect(locale.id).toBe("ar-EG");
        expect(locale.direction).toBe("rtl");
    });
});
