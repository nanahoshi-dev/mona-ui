import { describe, expect, it } from "vitest";
import { LabelStylePipe } from "./label-style.pipe";

describe("LabelStylePipe", () => {
    const pipe = new LabelStylePipe();

    it("creates an instance", () => {
        expect(pipe).toBeTruthy();
    });

    describe("horizontal orientation", () => {
        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 2.5, expectedPos: "25%" },
            { index: 2, value: 5, expectedPos: "50%" },
            { index: 3, value: 10, expectedPos: "100%" }
        ])("positions label at $expectedPos using left in LTR", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "ltr",
                    labelPosition: "after",
                    max: 10,
                    min: 0,
                    orientation: "horizontal",
                    tickCount: 4
                }
            );

            expect(result.left).toBe(expectedPos);
            expect(result.right).toBeUndefined();
            expect(result.top).toBe("100%");
            expect(result.bottom).toBeUndefined();
            expect(result.transform).toBe("translateX(-50%)");
        });

        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 2.5, expectedPos: "25%" },
            { index: 2, value: 5, expectedPos: "50%" },
            { index: 3, value: 10, expectedPos: "100%" }
        ])("positions label at $expectedPos using right in RTL", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "rtl",
                    labelPosition: "after",
                    max: 10,
                    min: 0,
                    orientation: "horizontal",
                    tickCount: 4
                }
            );

            expect(result.right).toBe(expectedPos);
            expect(result.left).toBeUndefined();
            expect(result.top).toBe("100%");
            expect(result.bottom).toBeUndefined();
            expect(result.transform).toBe("translateX(50%)");
        });

        it("places label on top when labelPosition is 'before'", () => {
            const result = pipe.transform(
                { index: 0, value: 5 },
                {
                    direction: "ltr",
                    labelPosition: "before",
                    max: 10,
                    min: 0,
                    orientation: "horizontal",
                    tickCount: 1
                }
            );

            expect(result.bottom).toBe("100%");
            expect(result.top).toBeUndefined();
        });
    });

    describe("vertical orientation", () => {
        it.each([
            { index: 0, value: 0, expectedPos: "0%" },
            { index: 1, value: 5, expectedPos: "50%" },
            { index: 2, value: 10, expectedPos: "100%" }
        ])("positions label at $expectedPos using bottom", ({ index, value, expectedPos }) => {
            const result = pipe.transform(
                { index, value },
                {
                    direction: "ltr",
                    labelPosition: "after",
                    max: 10,
                    min: 0,
                    orientation: "vertical",
                    tickCount: 3
                }
            );

            expect(result.bottom).toBe(expectedPos);
            expect(result.left).toBe("100%");
            expect(result.right).toBeUndefined();
            expect(result.transform).toBe("translateY(50%)");
        });

        it("positions label on left of vertical track in LTR when labelPosition is 'before'", () => {
            const result = pipe.transform(
                { index: 0, value: 5 },
                {
                    direction: "ltr",
                    labelPosition: "before",
                    max: 10,
                    min: 0,
                    orientation: "vertical",
                    tickCount: 1
                }
            );

            expect(result.right).toBe("100%");
            expect(result.left).toBeUndefined();
        });

        it("positions label on right of vertical track in RTL when labelPosition is 'before'", () => {
            const result = pipe.transform(
                { index: 0, value: 5 },
                {
                    direction: "rtl",
                    labelPosition: "before",
                    max: 10,
                    min: 0,
                    orientation: "vertical",
                    tickCount: 1
                }
            );

            expect(result.left).toBe("100%");
            expect(result.right).toBeUndefined();
        });
    });
});
