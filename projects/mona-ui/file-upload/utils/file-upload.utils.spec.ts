import { describe, expect, it } from "vitest";
import {
    checkFile,
    describeAccept,
    formatFileSize,
    isSameFile,
    isSameFileList,
    matchesAccept,
    parseAccept
} from "./file-upload.utils";

function file(name: string, type = "", size = 1, lastModified = 1): File {
    return new File([new Uint8Array(size)], name, { lastModified, type });
}

describe("file upload utils", () => {
    describe("parseAccept", () => {
        it("splits, trims and lowercases the tokens, and drops empty ones", () => {
            expect(parseAccept(" .PDF, image/*,,application/JSON ")).toEqual([".pdf", "image/*", "application/json"]);
            expect(parseAccept("")).toEqual([]);
            expect(parseAccept(null)).toEqual([]);
        });
    });

    describe("matchesAccept", () => {
        it("accepts every file without tokens", () => {
            expect(matchesAccept(file("a.exe"), [])).toBe(true);
        });

        it("matches extensions without regard to case", () => {
            expect(matchesAccept(file("Report.PDF"), [".pdf"])).toBe(true);
            expect(matchesAccept(file("report.pdf.exe"), [".pdf"])).toBe(false);
        });

        it("matches whole MIME types and MIME type families", () => {
            expect(matchesAccept(file("a", "application/json"), ["application/json"])).toBe(true);
            expect(matchesAccept(file("a", "image/png"), ["image/*"])).toBe(true);
            expect(matchesAccept(file("a", "imagery/png"), ["image/*"])).toBe(false);
            expect(matchesAccept(file("a.png", ""), ["image/*"])).toBe(false);
        });

        it("accepts a file that matches any token", () => {
            expect(matchesAccept(file("a.txt", "text/plain"), [".pdf", "text/plain"])).toBe(true);
        });
    });

    describe("checkFile", () => {
        const rules = { accept: [".pdf"], maxFileSize: 10, minFileSize: 2 };

        it("checks the type first, then the size", () => {
            expect(checkFile(file("a.png", "", 50), rules)).toBe("type");
            expect(checkFile(file("a.pdf", "", 11), rules)).toBe("maxFileSize");
            expect(checkFile(file("a.pdf", "", 1), rules)).toBe("minFileSize");
            expect(checkFile(file("a.pdf", "", 10), rules)).toBeNull();
            expect(checkFile(file("a.pdf", "", 2), rules)).toBeNull();
        });

        it("skips the limits that aren't set", () => {
            expect(checkFile(file("a", "", 0), { accept: [], maxFileSize: null, minFileSize: null })).toBeNull();
        });
    });

    describe("isSameFile and isSameFileList", () => {
        it("treats a file chosen twice as the same file", () => {
            expect(isSameFile(file("a.txt", "text/plain", 3, 5), file("a.txt", "text/plain", 3, 5))).toBe(true);
            expect(isSameFile(file("a.txt", "text/plain", 3, 5), file("a.txt", "text/plain", 3, 6))).toBe(false);
        });

        it("compares lists by identity and order", () => {
            const a = file("a");
            const b = file("b");
            expect(isSameFileList([a, b], [a, b])).toBe(true);
            expect(isSameFileList([a, b], [b, a])).toBe(false);
            expect(isSameFileList([a], [file("a")])).toBe(false);
        });
    });

    describe("formatFileSize", () => {
        it("picks the largest unit that keeps the size at 1 or more, in multiples of 1024", () => {
            expect(formatFileSize(0, "en-US")).toBe("0 bytes");
            expect(formatFileSize(1, "en-US")).toBe("1 byte");
            expect(formatFileSize(1023, "en-US")).toBe("1,023 bytes");
            expect(formatFileSize(1536, "en-US")).toBe("1.5 kB");
            expect(formatFileSize(5 * 1024 * 1024, "en-US")).toBe("5 MB");
            expect(formatFileSize(150.4 * 1024 * 1024, "en-US")).toBe("150 MB");
            expect(formatFileSize(3 * 1024 ** 3, "en-US")).toBe("3 GB");
        });

        it("formats in the locale", () => {
            expect(formatFileSize(1536, "de-DE")).toBe("1,5 kB");
        });
    });

    describe("describeAccept", () => {
        it("names extensions in capitals, keeps MIME types, and lists them as alternatives", () => {
            expect(describeAccept([".pdf", ".png", "image/*"], "en-US")).toBe("PDF, PNG, or image/*");
            expect(describeAccept([".jpg", ".JPG".toLowerCase()], "en-US")).toBe("JPG");
            expect(describeAccept([".pdf", ".docx"], "de-DE")).toBe("PDF oder DOCX");
        });
    });
});
