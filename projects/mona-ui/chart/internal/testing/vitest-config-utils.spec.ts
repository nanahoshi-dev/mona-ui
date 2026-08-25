import { describe, expect, it } from "vitest";
import { parsePositiveIntegerEnvValue } from "../../../../../vitest-config-utils";

describe("parsePositiveIntegerEnvValue", () => {
    it.each([
        [undefined, undefined],
        ["", undefined],
        ["  ", undefined],
        ["1", 1],
        ["24", 24]
    ])("parses %s as %s", (raw, expected) => {
        expect(parsePositiveIntegerEnvValue(raw, "MONA_VITEST_MAX_WORKERS")).toBe(expected);
    });

    it.each(["0", "-1", "1.5", "NaN", "Infinity"])('rejects "%s"', raw => {
        expect(() => parsePositiveIntegerEnvValue(raw, "MONA_VITEST_MAX_WORKERS")).toThrow(
            "MONA_VITEST_MAX_WORKERS must be a positive integer."
        );
    });
});
