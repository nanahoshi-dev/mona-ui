import { describe, expect, it } from "vitest";
import { twMerge } from "tailwind-merge";

describe("tailwind-merge logical property conflict resolution", () => {
    describe("logical margin overrides", () => {
        it("merges inline start and end margins properly", () => {
            expect(twMerge("ms-4", "ms-2")).toBe("ms-2");
            expect(twMerge("me-4", "me-2")).toBe("me-2");
        });

        it("merges mx-* with ms-* and me-* properly", () => {
            expect(twMerge("mx-4", "ms-2")).toBe("mx-4 ms-2");
            expect(twMerge("mx-4", "me-2")).toBe("mx-4 me-2");
            expect(twMerge("mx-4", "mx-2")).toBe("mx-2");
        });
    });

    describe("logical padding overrides", () => {
        it("merges inline start and end paddings properly", () => {
            expect(twMerge("ps-4", "ps-1")).toBe("ps-1");
            expect(twMerge("pe-4", "pe-1")).toBe("pe-1");
        });

        it("merges px-* with ps-* and pe-* properly", () => {
            expect(twMerge("px-4", "ps-1")).toBe("px-4 ps-1");
            expect(twMerge("px-4", "pe-1")).toBe("px-4 pe-1");
            expect(twMerge("px-4", "px-1")).toBe("px-1");
        });
    });

    describe("logical text alignment and positioning overrides", () => {
        it("merges text-start and text-end properly", () => {
            expect(twMerge("text-start", "text-end")).toBe("text-end");
            expect(twMerge("text-end", "text-start")).toBe("text-start");
        });

        it("merges start and end positioning properly", () => {
            expect(twMerge("start-0", "start-4")).toBe("start-4");
            expect(twMerge("end-0", "end-4")).toBe("end-4");
        });

        it("merges inset-x-* with start-* and end-*", () => {
            expect(twMerge("inset-x-0", "start-2")).toBe("inset-x-0 start-2");
            expect(twMerge("inset-x-0", "end-2")).toBe("inset-x-0 end-2");
            expect(twMerge("inset-x-0", "inset-x-4")).toBe("inset-x-4");
        });
    });

    describe("logical border and rounded corner overrides", () => {
        it("merges rounded-* with rounded-s-* and rounded-e-*", () => {
            expect(twMerge("rounded-md", "rounded-s-lg")).toBe("rounded-md rounded-s-lg");
            expect(twMerge("rounded-md", "rounded-e-none")).toBe("rounded-md rounded-e-none");
            expect(twMerge("rounded-md", "rounded-lg")).toBe("rounded-lg");
        });

        it("merges border-s-* and border-e-* properly", () => {
            expect(twMerge("border-s-2", "border-s-4")).toBe("border-s-4");
            expect(twMerge("border-e-2", "border-e-4")).toBe("border-e-4");
        });
    });
});
