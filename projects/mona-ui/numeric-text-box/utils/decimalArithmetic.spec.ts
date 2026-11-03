import { describe, expect, it } from "vitest";
import { addDecimals, compareDecimals, subtractDecimals, toDecimalString } from "./decimalArithmetic";

describe("decimalArithmetic", () => {
    it("canonicalizes decimal strings and finite numbers", () => {
        expect(toDecimalString("0012.500")).toBe("12.5");
        expect(toDecimalString("-0.000")).toBe("0");
        expect(toDecimalString(" 7 ")).toBe("7");
        expect(toDecimalString(0.1)).toBe("0.1");
        expect(toDecimalString(1e21)).toBe("1000000000000000000000");
        expect(toDecimalString(-1e-7)).toBe("-0.0000001");
        expect(toDecimalString(-0)).toBe("0");
    });

    it("rejects anything that is not a plain decimal", () => {
        for (const value of ["", "1e3", "1,5", ".5", "5.", "+1", "abc", Number.NaN, Number.POSITIVE_INFINITY, null]) {
            expect(toDecimalString(value), String(value)).toBeNull();
        }
    });

    it("adds and subtracts exactly, beyond what a number can hold", () => {
        expect(addDecimals("0.1", "0.2")).toBe("0.3");
        expect(addDecimals("9007199254740993", "1")).toBe("9007199254740994");
        expect(addDecimals("12345678901234567890.99", "0.01")).toBe("12345678901234567891");
        expect(subtractDecimals("0.3", "0.1")).toBe("0.2");
        expect(subtractDecimals("1", "1.5")).toBe("-0.5");
        expect(subtractDecimals("-0.25", "-0.25")).toBe("0");
    });

    it("compares across different scales", () => {
        expect(compareDecimals("1.50", "1.5")).toBe(0);
        expect(compareDecimals("-2", "1")).toBeLessThan(0);
        expect(compareDecimals("12345678901234567890.1", "12345678901234567890.09")).toBeGreaterThan(0);
        expect(compareDecimals("-0.001", "0")).toBeLessThan(0);
    });
});
