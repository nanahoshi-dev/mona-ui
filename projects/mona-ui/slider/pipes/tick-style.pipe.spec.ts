import { describe, expect, it } from "vitest";
import { TickStylePipe } from "./tick-style.pipe";

describe("TickStylePipe", () => {
    const pipe = new TickStylePipe();

    it("creates an instance", () => {
        expect(pipe).toBeTruthy();
    });

    describe("horizontal orientation", () => {
        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 2.5, expectedPos: "25%" },
            { index: 2, value: 5, expectedPos: "50%" },
            { index: 3, value: 10, expectedPos: "100%" }
        ])("positions tick at $expectedPos using left in LTR", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "ltr",
                    largeTickStep: null,
                    max: 10,
                    min: 0,
                    orientation: "horizontal",
                    smallTickStep: 1
                }
            );

            expect(result.left).toBe(expectedPos);
            expect(result.right).toBeUndefined();
            expect(result.transform).toContain("translateX(-50%)");
        });

        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 2.5, expectedPos: "25%" },
            { index: 2, value: 5, expectedPos: "50%" },
            { index: 3, value: 10, expectedPos: "100%" }
        ])("positions tick at $expectedPos using right in RTL", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "rtl",
                    largeTickStep: null,
                    max: 10,
                    min: 0,
                    orientation: "horizontal",
                    smallTickStep: 1
                }
            );

            expect(result.right).toBe(expectedPos);
            expect(result.left).toBeUndefined();
            expect(result.transform).toContain("translateX(50%)");
        });
    });

    describe("vertical orientation", () => {
        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 5, expectedPos: "50%" },
            { index: 2, value: 10, expectedPos: "100%" }
        ])("positions tick at $expectedPos using bottom and centered left", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "ltr",
                    largeTickStep: null,
                    max: 10,
                    min: 0,
                    orientation: "vertical",
                    smallTickStep: 1
                }
            );

            expect(result.bottom).toBe(expectedPos);
            expect(result.left).toBe("50%");
            expect(result.right).toBeUndefined();
            expect(result.transform).toBe("translateX(-50%) translateY(50%) translateZ(0)");
        });
    });
});
