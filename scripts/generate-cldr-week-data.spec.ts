import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
    CLDR_JSON_TAG,
    CLDR_VERSION,
    UNICODE_VERSION,
    extractRegion,
    generateWeekDataModuleContent,
    loadCldrSources
} from "./generate-cldr-week-data";
import {
    CLDR_LIKELY_SUBTAGS_VERSION,
    CLDR_WEEK_DATA_VERSION,
    FRIDAY_FIRST_REGIONS,
    LIKELY_FRIDAY_FIRST_TAGS,
    LIKELY_MONDAY_SCRIPT_OVERRIDES,
    LIKELY_SATURDAY_FIRST_TAGS,
    LIKELY_SUNDAY_FIRST_TAGS,
    SATURDAY_FIRST_REGIONS,
    SUNDAY_FIRST_REGIONS,
    resolveLikelyFirstDayOfWeek
} from "../projects/mona-ui/i18n/utilities/locale-week-likely-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("generate-cldr-week-data", () => {
    it("pins consistent CLDR versions across generator and generated modules", () => {
        expect(CLDR_VERSION).toBe("46");
        expect(UNICODE_VERSION).toBe("16.0");
        expect(CLDR_JSON_TAG).toBe("46.0.0");
        expect(CLDR_WEEK_DATA_VERSION).toBe(CLDR_VERSION);
        expect(CLDR_LIKELY_SUBTAGS_VERSION).toBe(CLDR_VERSION);
    });

    it("verifies provenance metadata matches pinned files and hashes", () => {
        const provFile = path.resolve(__dirname, "cldr/provenance.json");
        expect(fs.existsSync(provFile)).toBe(true);
        const prov = JSON.parse(fs.readFileSync(provFile, "utf8"));
        expect(prov.cldrVersion).toBe(CLDR_VERSION);
        expect(prov.cldrJsonTag).toBe(CLDR_JSON_TAG);
        expect(prov.files["likelySubtags.json"]).toBeDefined();
        expect(prov.files["weekData.json"]).toBeDefined();
    });

    it("extracts territory regions accurately from maximized tags", () => {
        expect(extractRegion("en-Latn-US")).toBe("US");
        expect(extractRegion("ja-Jpan-JP")).toBe("JP");
        expect(extractRegion("ar-Arab-EG")).toBe("EG");
        expect(extractRegion("dv-Thaa-MV")).toBe("MV");
        expect(extractRegion("zh-Hant-TW")).toBe("TW");
        expect(extractRegion("x-US")).toBeNull();
    });

    it("verifies territory week-start sets derived from pinned CLDR", () => {
        // Friday
        expect(FRIDAY_FIRST_REGIONS.has("MV")).toBe(true);
        expect(FRIDAY_FIRST_REGIONS.has("US")).toBe(false);

        // Saturday
        expect(SATURDAY_FIRST_REGIONS.has("EG")).toBe(true);
        expect(SATURDAY_FIRST_REGIONS.has("AF")).toBe(true);
        expect(SATURDAY_FIRST_REGIONS.has("IR")).toBe(true);

        // Sunday
        expect(SUNDAY_FIRST_REGIONS.has("US")).toBe(true);
        expect(SUNDAY_FIRST_REGIONS.has("JP")).toBe(true);
        expect(SUNDAY_FIRST_REGIONS.has("YE")).toBe(true);
        expect(SUNDAY_FIRST_REGIONS.has("CA")).toBe(true);

        // Monday default controls (not in Friday, Saturday, or Sunday sets)
        for (const territory of ["DE", "FR", "ES", "AE", "AU", "CN", "GB", "IS"]) {
            expect(FRIDAY_FIRST_REGIONS.has(territory)).toBe(false);
            expect(SATURDAY_FIRST_REGIONS.has(territory)).toBe(false);
            expect(SUNDAY_FIRST_REGIONS.has(territory)).toBe(false);
        }
    });

    it("resolves likely base language week starts", () => {
        expect(resolveLikelyFirstDayOfWeek("en")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("ja")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("ko")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("ar")).toBe("saturday");
        expect(resolveLikelyFirstDayOfWeek("fa")).toBe("saturday");
        expect(resolveLikelyFirstDayOfWeek("dv")).toBe("friday");
        expect(resolveLikelyFirstDayOfWeek("de")).toBeNull();
        expect(resolveLikelyFirstDayOfWeek("fr")).toBeNull();
        expect(resolveLikelyFirstDayOfWeek("is")).toBeNull();
    });

    it("resolves script-sensitive language tags", () => {
        expect(resolveLikelyFirstDayOfWeek("zh-Hant")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("zh-Hans")).toBeNull();
        expect(resolveLikelyFirstDayOfWeek("en-Shaw")).toBe("monday");
        expect(LIKELY_MONDAY_SCRIPT_OVERRIDES.has("en-Shaw")).toBe(true);
    });

    it("resolves undefined language (und) and und-Script tags", () => {
        expect(resolveLikelyFirstDayOfWeek("und")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("und-Latn")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("und-Hant")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("und-Hebr")).toBe("sunday");
        expect(resolveLikelyFirstDayOfWeek("und-Arab")).toBe("saturday");
        expect(resolveLikelyFirstDayOfWeek("und-Cyrl")).toBe("monday");
        expect(resolveLikelyFirstDayOfWeek("und-Diak")).toBe("friday");

        expect(LIKELY_SUNDAY_FIRST_TAGS.has("und")).toBe(true);
        expect(LIKELY_SUNDAY_FIRST_TAGS.has("und-Latn")).toBe(true);
        expect(LIKELY_SUNDAY_FIRST_TAGS.has("und-Hant")).toBe(true);
        expect(LIKELY_SATURDAY_FIRST_TAGS.has("und-Arab")).toBe(true);
        expect(LIKELY_FRIDAY_FIRST_TAGS.has("und-Diak")).toBe(true);
        expect(LIKELY_MONDAY_SCRIPT_OVERRIDES.has("und-Cyrl")).toBe(true);
    });

    it("generates content identical to checked-in locale-week-likely-data.ts", async () => {
        const sources = await loadCldrSources();
        const content = generateWeekDataModuleContent(sources);
        const targetFile = path.resolve(__dirname, "../projects/mona-ui/i18n/utilities/locale-week-likely-data.ts");
        const existing = fs.readFileSync(targetFile, "utf8");
        const normalize = (s: string) => s.replace(/\r\n/g, "\n").trim();
        expect(normalize(content)).toBe(normalize(existing));
    });
});
