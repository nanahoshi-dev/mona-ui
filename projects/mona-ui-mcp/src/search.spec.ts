import { describe, expect, it } from "vitest";
import { SearchIndex, stem, tokenize } from "./search.js";

describe("search", () => {
    it("splits identifiers at their humps and dashes, and keeps them whole too", () => {
        expect(tokenize("GridComponent")).toEqual(["grid", "component", "gridcomponent"]);
        expect(tokenize("<mona-grid>")).toEqual(["mona", "grid", "monagrid"]);
        expect(tokenize("How do I use the HTMLParser")).toEqual(["html", "parser", "htmlparser"]);
    });

    it("matches word forms", () => {
        expect(stem("buttons")).toBe(stem("button"));
        expect(stem("editing")).toBe("edit");
        expect(stem("dragging")).toBe("drag");
        expect(stem("disabled")).toBe(stem("disable"));
        expect(stem("classes")).toBe("class");
        expect(stem("string")).toBe("string");
    });

    it("ranks a match in a heavier field first", () => {
        const index = new SearchIndex<string>({ body: 1, title: 3 });
        index.add("body", { body: "The grid sorts rows.", title: "Overview" });
        index.add("title", { body: "Rows can be sorted.", title: "Grid" });

        expect(index.search("grid", 5).map(hit => hit.item)).toEqual(["title", "body"]);
    });

    it("finds longer words a query word starts, ranked below exact matches", () => {
        const index = new SearchIndex<string>({ body: 1 });
        index.add("exact", { body: "sort the list" });
        index.add("prefix", { body: "a sortable list" });
        index.add("neither", { body: "a calendar" });

        expect(index.search("sort", 5).map(hit => hit.item)).toEqual(["exact", "prefix"]);
    });

    it("skips what the filter rejects, and stops at the limit", () => {
        const index = new SearchIndex<number>({ body: 1 });
        for (let item = 0; item < 5; item++) {
            index.add(item, { body: "grid" });
        }

        expect(index.search("grid", 2, item => item % 2 === 1).map(hit => hit.item)).toEqual([1, 3]);
    });
});
