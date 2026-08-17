import { describe, expect, it } from "vitest";
import { FinancialWidthEngine } from "./financial-width-engine";

describe("FinancialWidthEngine", () => {
    it("should prioritize explicit bodyWidth and clamp to [2, maxBodyWidth]", () => {
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 15,
                plotWidth: 500
            })
        ).toBe(15);

        // Clamps below 2
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 1,
                plotWidth: 500
            })
        ).toBe(2);

        // Clamps above maxBodyWidth (default 32)
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 50,
                plotWidth: 500
            })
        ).toBe(32);

        // Custom maxBodyWidth
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 50,
                explicitMaxBodyWidth: 60,
                plotWidth: 500
            })
        ).toBe(50);
    });

    it("should resolve width from bandwidth and bodyWidthRatio on category scale", () => {
        const width = FinancialWidthEngine.resolveBodyWidth({
            bandwidth: 40,
            explicitBodyWidthRatio: 0.7,
            plotWidth: 500
        });

        // 40 * 0.7 = 28
        expect(width).toBe(28);
    });

    it("should resolve width from minimum local mark spacing on continuous scale", () => {
        const coordinates = [50, 100, 130, 200];
        // minSpacing = 130 - 100 = 30
        // 30 * 0.7 = 21

        const width = FinancialWidthEngine.resolveBodyWidth({
            explicitBodyWidthRatio: 0.7,
            markPixelXCoordinates: coordinates,
            plotWidth: 500
        });

        expect(width).toBe(21);
    });

    it("should use proportional plot fallback for single mark on continuous scale", () => {
        const width = FinancialWidthEngine.resolveBodyWidth({
            markPixelXCoordinates: [150],
            plotWidth: 600
        });

        // 600 * 0.05 = 30
        expect(width).toBe(30);
    });
});
