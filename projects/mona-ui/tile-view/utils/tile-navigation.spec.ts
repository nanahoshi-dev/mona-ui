import { isTileNavigationKey, navigateTiles, type TileLayout, tileColumns } from "./tile-navigation";

// Ten tiles, four to a row:
//  0  1  2  3
//  4  5  6  7
//  8  9
const LAYOUT: TileLayout = { columns: 4, count: 10, pageRows: 2, rtl: false };

describe("navigateTiles", () => {
    it("moves along a row and stops at its ends", () => {
        expect(navigateTiles(5, "ArrowRight", LAYOUT)).toBe(6);
        expect(navigateTiles(5, "ArrowLeft", LAYOUT)).toBe(4);
        expect(navigateTiles(4, "ArrowLeft", LAYOUT)).toBe(4);
        expect(navigateTiles(3, "ArrowRight", LAYOUT)).toBe(3);
        expect(navigateTiles(9, "ArrowRight", LAYOUT)).toBe(9);
    });

    it("swaps the left and right arrows from right to left", () => {
        const rtl = { ...LAYOUT, rtl: true };

        expect(navigateTiles(5, "ArrowLeft", rtl)).toBe(6);
        expect(navigateTiles(5, "ArrowRight", rtl)).toBe(4);
    });

    it("moves by a row in the same column", () => {
        expect(navigateTiles(1, "ArrowDown", LAYOUT)).toBe(5);
        expect(navigateTiles(5, "ArrowUp", LAYOUT)).toBe(1);
        expect(navigateTiles(1, "ArrowUp", LAYOUT)).toBe(1);
    });

    it("moves down to the last tile when the next row is shorter", () => {
        expect(navigateTiles(6, "ArrowDown", LAYOUT)).toBe(9);
        expect(navigateTiles(9, "ArrowDown", LAYOUT)).toBe(9);
    });

    it("moves by a page of rows and stops at the first and last rows", () => {
        expect(navigateTiles(1, "PageDown", LAYOUT)).toBe(9);
        expect(navigateTiles(0, "PageDown", LAYOUT)).toBe(8);
        expect(navigateTiles(9, "PageUp", LAYOUT)).toBe(1);
        expect(navigateTiles(5, "PageUp", LAYOUT)).toBe(1);
    });

    it("goes to the first and the last tile", () => {
        expect(navigateTiles(5, "Home", LAYOUT)).toBe(0);
        expect(navigateTiles(5, "End", LAYOUT)).toBe(9);
    });

    it("starts at the first tile, or the last for End, when no tile is active", () => {
        expect(navigateTiles(-1, "ArrowDown", LAYOUT)).toBe(0);
        expect(navigateTiles(-1, "ArrowRight", LAYOUT)).toBe(0);
        expect(navigateTiles(-1, "End", LAYOUT)).toBe(9);
        expect(navigateTiles(12, "ArrowUp", LAYOUT)).toBe(0);
    });

    it("has nowhere to go without tiles", () => {
        expect(navigateTiles(-1, "ArrowDown", { ...LAYOUT, count: 0 })).toBe(-1);
    });
});

describe("tileColumns", () => {
    it("fits as many tiles as the width holds, with a gap around each", () => {
        // 4 + (112 + 4) × 3 = 352.
        expect(tileColumns(352, 112, 4)).toBe(3);
        expect(tileColumns(351, 112, 4)).toBe(2);
    });

    it("keeps at least one column", () => {
        expect(tileColumns(50, 112, 4)).toBe(1);
        expect(tileColumns(0, 112, 4)).toBe(1);
        expect(tileColumns(352, 0, 4)).toBe(1);
    });
});

describe("isTileNavigationKey", () => {
    it("tells navigation keys from others", () => {
        expect(isTileNavigationKey("PageDown")).toBe(true);
        expect(isTileNavigationKey("Enter")).toBe(false);
    });
});
