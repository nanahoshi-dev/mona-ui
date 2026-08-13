import { describe, expect, it } from "vitest";
import {
    getContinuousItemFill,
    getPointerRatingValue,
    getRatingStep,
    getSingleItemFill,
    normalizeItemsCount,
    normalizeRatingValue,
    normalizeToStep
} from "./rating-value.utils";

function createItemRect(left: number, width: number): DOMRect {
    return {
        bottom: 0,
        height: 28,
        left,
        right: left + width,
        top: 0,
        width,
        x: left,
        y: 0,
        toJSON: () => ({})
    } as DOMRect;
}

describe("normalizeItemsCount", () => {
    it("returns the default count", () => {
        expect(normalizeItemsCount(undefined)).toBe(5);
    });

    it("keeps a positive integer", () => {
        expect(normalizeItemsCount(5)).toBe(5);
        expect(normalizeItemsCount(10)).toBe(10);
    });

    it("floors a fractional count", () => {
        expect(normalizeItemsCount(5.9)).toBe(5);
    });

    it("raises zero to the minimum", () => {
        expect(normalizeItemsCount(0)).toBe(1);
    });

    it("raises a negative number to the minimum", () => {
        expect(normalizeItemsCount(-3)).toBe(1);
    });

    it("converts a numeric string", () => {
        expect(normalizeItemsCount("10")).toBe(10);
    });

    it("treats an empty string as missing", () => {
        expect(normalizeItemsCount("")).toBe(5);
    });

    it("falls back for NaN", () => {
        expect(normalizeItemsCount(NaN)).toBe(5);
    });

    it("falls back for Infinity", () => {
        expect(normalizeItemsCount(Infinity)).toBe(5);
    });
});

describe("getRatingStep", () => {
    it("returns 1 for item precision", () => {
        expect(getRatingStep("item")).toBe(1);
    });

    it("returns 0.5 for half precision", () => {
        expect(getRatingStep("half")).toBe(0.5);
    });
});

describe("normalizeToStep", () => {
    it("rounds to the nearest whole step", () => {
        expect(normalizeToStep(2.2, 1)).toBe(2);
        expect(normalizeToStep(2.6, 1)).toBe(3);
    });

    it("rounds to the nearest half step without float drift", () => {
        expect(normalizeToStep(0.3, 0.5)).toBe(0.5);
        expect(normalizeToStep(1.3, 0.5)).toBe(1.5);
        expect(normalizeToStep(3.6, 0.5)).toBe(3.5);
    });
});

describe("normalizeRatingValue", () => {
    describe("item precision", () => {
        it("clamps negative values to 0", () => {
            expect(normalizeRatingValue(-1, 5, "item")).toBe(0);
        });

        it("keeps 0", () => {
            expect(normalizeRatingValue(0, 5, "item")).toBe(0);
        });

        it("keeps integers in range", () => {
            expect(normalizeRatingValue(1, 5, "item")).toBe(1);
            expect(normalizeRatingValue(5, 5, "item")).toBe(5);
        });

        it("rounds to the nearest integer", () => {
            expect(normalizeRatingValue(2.2, 5, "item")).toBe(2);
            expect(normalizeRatingValue(2.6, 5, "item")).toBe(3);
        });

        it("clamps values above the maximum", () => {
            expect(normalizeRatingValue(6, 5, "item")).toBe(5);
        });

        it("normalizes non-finite values to 0", () => {
            expect(normalizeRatingValue(NaN, 5, "item")).toBe(0);
            expect(normalizeRatingValue(Infinity, 5, "item")).toBe(0);
            expect(normalizeRatingValue(-Infinity, 5, "item")).toBe(0);
        });
    });

    describe("half precision", () => {
        it("rounds to the nearest half", () => {
            expect(normalizeRatingValue(0.1, 5, "half")).toBe(0);
            expect(normalizeRatingValue(0.3, 5, "half")).toBe(0.5);
            expect(normalizeRatingValue(1.2, 5, "half")).toBe(1);
            expect(normalizeRatingValue(1.3, 5, "half")).toBe(1.5);
            expect(normalizeRatingValue(3.6, 5, "half")).toBe(3.5);
            expect(normalizeRatingValue(4.8, 5, "half")).toBe(5);
        });

        it("clamps values above the maximum", () => {
            expect(normalizeRatingValue(6, 5, "half")).toBe(5);
        });
    });
});

describe("getContinuousItemFill", () => {
    it("fills every preceding item and the boundary item partially", () => {
        expect(getContinuousItemFill(3.5, 1)).toBe(1);
        expect(getContinuousItemFill(3.5, 2)).toBe(1);
        expect(getContinuousItemFill(3.5, 3)).toBe(1);
        expect(getContinuousItemFill(3.5, 4)).toBe(0.5);
        expect(getContinuousItemFill(3.5, 5)).toBe(0);
    });

    it("clamps outside the valid range", () => {
        expect(getContinuousItemFill(0, 1)).toBe(0);
        expect(getContinuousItemFill(5, 1)).toBe(1);
    });
});

describe("getSingleItemFill", () => {
    it("fills only the active item", () => {
        expect(getSingleItemFill(3.5, 1)).toBe(0);
        expect(getSingleItemFill(3.5, 2)).toBe(0);
        expect(getSingleItemFill(3.5, 3)).toBe(0);
        expect(getSingleItemFill(3.5, 4)).toBe(0.5);
        expect(getSingleItemFill(3.5, 5)).toBe(0);
    });

    it("fills a whole item for integer values", () => {
        expect(getSingleItemFill(3, 3)).toBe(1);
        expect(getSingleItemFill(3, 4)).toBe(0);
    });

    it("returns 0 when nothing is selected", () => {
        expect(getSingleItemFill(0, 1)).toBe(0);
        expect(getSingleItemFill(0, 5)).toBe(0);
    });
});

describe("getPointerRatingValue", () => {
    describe("item precision", () => {
        it("selects the whole item anywhere in it", () => {
            expect(
                getPointerRatingValue({
                    clientX: 5,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 3,
                    precision: "item"
                })
            ).toBe(3);
        });

        it("selects the whole item outside the rectangle", () => {
            expect(
                getPointerRatingValue({
                    clientX: 100,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 3,
                    precision: "item"
                })
            ).toBe(3);
        });
    });

    describe("half precision in LTR", () => {
        it("maps the first half to the lower value", () => {
            expect(
                getPointerRatingValue({
                    clientX: 7,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(3.5);
        });

        it("maps the second half to the full value", () => {
            expect(
                getPointerRatingValue({
                    clientX: 21,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(4);
        });

        it("assigns the exact midpoint to the first half", () => {
            expect(
                getPointerRatingValue({
                    clientX: 14,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(3.5);
        });

        it("maps pointers outside the rectangle deterministically", () => {
            expect(
                getPointerRatingValue({
                    clientX: -50,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(3.5);
            expect(
                getPointerRatingValue({
                    clientX: 500,
                    direction: "ltr",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(4);
        });
    });

    describe("half precision in RTL", () => {
        it("maps the first visual (right) half to the lower value", () => {
            expect(
                getPointerRatingValue({
                    clientX: 21,
                    direction: "rtl",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(3.5);
        });

        it("maps the second visual (left) half to the full value", () => {
            expect(
                getPointerRatingValue({
                    clientX: 7,
                    direction: "rtl",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(4);
        });

        it("assigns the exact midpoint to the first visual half", () => {
            expect(
                getPointerRatingValue({
                    clientX: 14,
                    direction: "rtl",
                    itemRect: createItemRect(0, 28),
                    itemValue: 4,
                    precision: "half"
                })
            ).toBe(3.5);
        });
    });
});
