import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    CLDR_JSON_TAG,
    CLDR_VERSION,
    LIKELY_SUBTAGS_URL,
    UNICODE_VERSION,
    WEEK_DATA_URL,
    type CldrProvenance,
    computeSha256,
    extractRegion,
    generateWeekDataModuleContent,
    loadCldrSources,
    normalizeUnicodeVersion,
    updateCldrSources,
    validateCldrProvenance,
    validateCldrSourceVersions
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

    it("verifies provenance metadata matches pinned files and computes valid sha256 hashes", () => {
        const cldrDir = path.resolve(__dirname, "cldr");
        const provFile = path.join(cldrDir, "provenance.json");
        const weekFile = path.join(cldrDir, "weekData.json");
        const likelyFile = path.join(cldrDir, "likelySubtags.json");

        expect(fs.existsSync(provFile)).toBe(true);
        const prov: CldrProvenance = JSON.parse(fs.readFileSync(provFile, "utf8"));
        expect(prov.cldrVersion).toBe(CLDR_VERSION);
        expect(prov.cldrJsonTag).toBe(CLDR_JSON_TAG);
        expect(prov.unicodeVersion).toBe(UNICODE_VERSION);

        const weekRaw = fs.readFileSync(weekFile);
        const likelyRaw = fs.readFileSync(likelyFile);

        expect(computeSha256(weekRaw)).toBe(prov.files["weekData.json"].sha256);
        expect(computeSha256(likelyRaw)).toBe(prov.files["likelySubtags.json"].sha256);

        // Verifies the integrated validation function passes cleanly for the repo's vendored sources
        expect(() => {
            validateCldrProvenance(prov, {
                "weekData.json": weekRaw,
                "likelySubtags.json": likelyRaw
            });
        }).not.toThrow();
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

const validWeekBuffer = Buffer.from('{"supplemental":{"version":{"_unicodeVersion":"16.0.0","_cldrVersion":"46"},"weekData":{"firstDay":{"001":"mon"}}}}');
const validLikelyBuffer = Buffer.from('{"supplemental":{"version":{"_unicodeVersion":"16.0.0","_cldrVersion":"46"},"likelySubtags":{"en":"en-Latn-US"}}}');

const validProvenance: CldrProvenance = {
    cldrVersion: "46",
    cldrJsonTag: "46.0.0",
    unicodeVersion: "16.0",
    files: {
        "weekData.json": {
            url: WEEK_DATA_URL,
            sha256: computeSha256(validWeekBuffer)
        },
        "likelySubtags.json": {
            url: LIKELY_SUBTAGS_URL,
            sha256: computeSha256(validLikelyBuffer)
        }
    }
};

describe("source integrity and tampering detection", () => {

    it("accepts authentic source fixtures with exact matching hashes", () => {
        expect(() => {
            validateCldrProvenance(validProvenance, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).not.toThrow();
    });

    it("fails when weekData.json is modified by a single byte", () => {
        const tamperedWeek = Buffer.from(validWeekBuffer);
        tamperedWeek[tamperedWeek.length - 1] = tamperedWeek[tamperedWeek.length - 1] === 32 ? 33 : 32;

        expect(() => {
            validateCldrProvenance(validProvenance, {
                "weekData.json": tamperedWeek,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR source integrity check failed:[\s\S]*weekData\.json SHA-256 does not match/);
    });

    it("fails when likelySubtags.json is modified by a single byte", () => {
        const tamperedLikely = Buffer.from(validLikelyBuffer);
        tamperedLikely[tamperedLikely.length - 1] = tamperedLikely[tamperedLikely.length - 1] === 32 ? 33 : 32;

        expect(() => {
            validateCldrProvenance(validProvenance, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": tamperedLikely
            });
        }).toThrow(/CLDR source integrity check failed:[\s\S]*likelySubtags\.json SHA-256 does not match/);
    });

    it("fails when provenance hash is tampered or mismatched", () => {
        const tamperedProv: CldrProvenance = {
            ...validProvenance,
            files: {
                ...validProvenance.files,
                "weekData.json": {
                    ...validProvenance.files["weekData.json"],
                    sha256: "0000000000000000000000000000000000000000000000000000000000000000"
                }
            }
        };

        expect(() => {
            validateCldrProvenance(tamperedProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR source integrity check failed:[\s\S]*weekData\.json SHA-256 does not match/);
    });

    it("fails when provenance cldrVersion does not match expected version", () => {
        const badProv: CldrProvenance = {
            ...validProvenance,
            cldrVersion: "48"
        };

        expect(() => {
            validateCldrProvenance(badProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance version mismatch: expected CLDR 46, but provenance declares CLDR 48/);
    });

    it("fails when provenance cldrJsonTag does not match expected tag", () => {
        const badProv: CldrProvenance = {
            ...validProvenance,
            cldrJsonTag: "48.0.0"
        };

        expect(() => {
            validateCldrProvenance(badProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance tag mismatch: expected tag 46\.0\.0, but provenance declares tag 48\.0\.0/);
    });

    it("fails when provenance unicodeVersion does not match expected version", () => {
        const badProv: CldrProvenance = {
            ...validProvenance,
            unicodeVersion: "17.0"
        };

        expect(() => {
            validateCldrProvenance(badProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance Unicode version mismatch: expected Unicode 16\.0, but provenance declares Unicode 17\.0/);
    });

    it("fails when provenance likelySubtags.json URL does not match expected URL", () => {
        const badUrlProv: CldrProvenance = {
            ...validProvenance,
            files: {
                ...validProvenance.files,
                "likelySubtags.json": {
                    ...validProvenance.files["likelySubtags.json"],
                    url: "https://example.com/wrong/likelySubtags.json"
                }
            }
        };

        expect(() => {
            validateCldrProvenance(badUrlProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance source URL mismatch for likelySubtags\.json/);
    });

    it("fails when provenance weekData.json URL does not match expected URL", () => {
        const badUrlProv: CldrProvenance = {
            ...validProvenance,
            files: {
                ...validProvenance.files,
                "weekData.json": {
                    ...validProvenance.files["weekData.json"],
                    url: "https://example.com/wrong/weekData.json"
                }
            }
        };

        expect(() => {
            validateCldrProvenance(badUrlProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance source URL mismatch for weekData\.json/);
    });

    it("fails when a required file is missing from provenance", () => {
        const missingFileProv: CldrProvenance = {
            ...validProvenance,
            files: {
                "weekData.json": validProvenance.files["weekData.json"]
            } as unknown as CldrProvenance["files"]
        };

        expect(() => {
            validateCldrProvenance(missingFileProv, {
                "weekData.json": validWeekBuffer,
                "likelySubtags.json": validLikelyBuffer
            });
        }).toThrow(/CLDR provenance entry missing for file: likelySubtags\.json/);
    });

    it("validates that valid source version metadata passes", () => {
        const weekJson = JSON.parse(validWeekBuffer.toString("utf8"));
        const likelyJson = JSON.parse(validLikelyBuffer.toString("utf8"));

        expect(() => {
            validateCldrSourceVersions({
                "weekData.json": weekJson,
                "likelySubtags.json": likelyJson
            });
        }).not.toThrow();
    });

    it("fails when fixture _cldrVersion does not match expected generator constant", () => {
        const badWeekJson = {
            supplemental: {
                version: {
                    _unicodeVersion: "16.0.0",
                    _cldrVersion: "48"
                }
            }
        };

        expect(() => {
            validateCldrSourceVersions({
                "weekData.json": badWeekJson
            });
        }).toThrow(/CLDR source version mismatch in weekData\.json: expected CLDR 46, but weekData\.json declares CLDR 48/);
    });

    it("fails when fixture _unicodeVersion does not match expected generator constant", () => {
        const badWeekJson = {
            supplemental: {
                version: {
                    _unicodeVersion: "15.0.0",
                    _cldrVersion: "46"
                }
            }
        };

        expect(() => {
            validateCldrSourceVersions({
                "weekData.json": badWeekJson
            });
        }).toThrow(/CLDR source Unicode version mismatch in weekData\.json: expected Unicode 16\.0, but weekData\.json declares Unicode 15\.0\.0/);
    });

    it("rejects any source whose embedded CLDR version differs from the pinned baseline", () => {
        const weekJson = {
            supplemental: {
                version: {
                    _unicodeVersion: "16.0.0",
                    _cldrVersion: "46"
                }
            }
        };
        const likelyJson = {
            supplemental: {
                version: {
                    _unicodeVersion: "16.0.0",
                    _cldrVersion: "47"
                }
            }
        };

        expect(() => {
            validateCldrSourceVersions({
                "weekData.json": weekJson,
                "likelySubtags.json": likelyJson
            });
        }).toThrow(/CLDR source version mismatch in likelySubtags\.json: expected CLDR 46, but likelySubtags\.json declares CLDR 47/);
    });

    it("normalizes Unicode versions with minor release digits correctly", () => {
        expect(normalizeUnicodeVersion("16.0.0")).toBe("16.0");
        expect(normalizeUnicodeVersion("16.0")).toBe("16.0");
        expect(normalizeUnicodeVersion("15.1.2")).toBe("15.1");
    });
});

describe("hermetic local-mode and network control", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it("passes and does not call fetch when all local files are valid", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            fs.writeFileSync(path.join(tempDir, "weekData.json"), validWeekBuffer);
            fs.writeFileSync(path.join(tempDir, "likelySubtags.json"), validLikelyBuffer);
            fs.writeFileSync(path.join(tempDir, "provenance.json"), JSON.stringify(validProvenance));

            const sources = await loadCldrSources({ cldrDir: tempDir });
            expect(sources).toBeDefined();
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("fails and does not call fetch when likelySubtags.json is missing in normal mode", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            fs.writeFileSync(path.join(tempDir, "weekData.json"), validWeekBuffer);
            fs.writeFileSync(path.join(tempDir, "provenance.json"), JSON.stringify(validProvenance));

            await expect(loadCldrSources({ cldrDir: tempDir })).rejects.toThrow(
                /Pinned CLDR source file is missing:[\s\S]*likelySubtags\.json/
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("fails and does not call fetch when weekData.json is missing in normal mode", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            fs.writeFileSync(path.join(tempDir, "likelySubtags.json"), validLikelyBuffer);
            fs.writeFileSync(path.join(tempDir, "provenance.json"), JSON.stringify(validProvenance));

            await expect(loadCldrSources({ cldrDir: tempDir })).rejects.toThrow(
                /Pinned CLDR source file is missing:[\s\S]*weekData\.json/
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("fails and does not call fetch when provenance.json is missing in normal mode", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            fs.writeFileSync(path.join(tempDir, "likelySubtags.json"), validLikelyBuffer);
            fs.writeFileSync(path.join(tempDir, "weekData.json"), validWeekBuffer);

            await expect(loadCldrSources({ cldrDir: tempDir })).rejects.toThrow(
                /Pinned CLDR provenance file is missing:[\s\S]*provenance\.json/
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("fails and does not call fetch when local hash mismatches in normal mode", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            const tamperedWeek = Buffer.from(validWeekBuffer);
            tamperedWeek[tamperedWeek.length - 1] = tamperedWeek[tamperedWeek.length - 1] === 32 ? 33 : 32;
            fs.writeFileSync(path.join(tempDir, "likelySubtags.json"), validLikelyBuffer);
            fs.writeFileSync(path.join(tempDir, "weekData.json"), tamperedWeek);
            fs.writeFileSync(path.join(tempDir, "provenance.json"), JSON.stringify(validProvenance));

            await expect(loadCldrSources({ cldrDir: tempDir })).rejects.toThrow(
                /CLDR source integrity check failed/
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("fails and does not call fetch when embedded source version mismatches in normal mode", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-hermetic-"));
        try {
            const badVersionWeek = Buffer.from('{"supplemental":{"version":{"_unicodeVersion":"16.0.0","_cldrVersion":"45"},"weekData":{"firstDay":{"001":"mon"}}}}');
            const prov: CldrProvenance = {
                ...validProvenance,
                files: {
                    ...validProvenance.files,
                    "weekData.json": {
                        url: WEEK_DATA_URL,
                        sha256: computeSha256(badVersionWeek)
                    }
                }
            };
            fs.writeFileSync(path.join(tempDir, "likelySubtags.json"), validLikelyBuffer);
            fs.writeFileSync(path.join(tempDir, "weekData.json"), badVersionWeek);
            fs.writeFileSync(path.join(tempDir, "provenance.json"), JSON.stringify(prov));

            await expect(loadCldrSources({ cldrDir: tempDir })).rejects.toThrow(
                /CLDR source version mismatch/
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("permits network access when forceFetch is explicitly enabled", async () => {
        fetchSpy.mockImplementation(async (url: any) => {
            const strUrl = String(url);
            if (strUrl.includes("likelySubtags")) {
                return new Response(validLikelyBuffer.toString("utf8"), { status: 200 });
            }
            if (strUrl.includes("weekData")) {
                return new Response(validWeekBuffer.toString("utf8"), { status: 200 });
            }
            return new Response("Not found", { status: 404 });
        });

        const sources = await loadCldrSources({ forceFetch: true });
        expect(sources).toBeDefined();
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("permits network access during explicit updateCldrSources workflow", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cldr-update-"));
        const targetFile = path.join(tempDir, "generated.ts");

        fetchSpy.mockImplementation(async (url: any) => {
            const strUrl = String(url);
            if (strUrl.includes("likelySubtags")) {
                return new Response(validLikelyBuffer.toString("utf8"), { status: 200 });
            }
            if (strUrl.includes("weekData")) {
                return new Response(validWeekBuffer.toString("utf8"), { status: 200 });
            }
            return new Response("Not found", { status: 404 });
        });

        try {
            await updateCldrSources({ cldrDir: tempDir, targetFile });
            expect(fetchSpy).toHaveBeenCalledTimes(2);
            expect(fs.existsSync(path.join(tempDir, "likelySubtags.json"))).toBe(true);
            expect(fs.existsSync(path.join(tempDir, "weekData.json"))).toBe(true);
            expect(fs.existsSync(path.join(tempDir, "provenance.json"))).toBe(true);
            expect(fs.existsSync(targetFile)).toBe(true);
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
});
