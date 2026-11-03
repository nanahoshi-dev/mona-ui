import { describe, expect, it } from "vitest";
import { PAGER_DEFAULT_MESSAGES } from "./pager.default-messages";

describe("PAGER_DEFAULT_MESSAGES", () => {
    it("formats numbers with en-US grouping", () => {
        expect(PAGER_DEFAULT_MESSAGES.pageStatus(2, 12345)).toBe("Page 2 of 12,345");
        expect(PAGER_DEFAULT_MESSAGES.rangeStatus(1, 20, 12345)).toBe("1 - 20 of 12,345 items");
    });
});
