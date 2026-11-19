import { describe, expect, it } from "vitest";
import { Row } from "../models/Row";
import { buildGridTreeStructure, buildGridTreeView, getGridTreeAncestorUids } from "./grid-tree";

/** Rows named by uid, with each one's parent uid. */
function treeOf(parents: Record<string, string | null>): {
    rows: Row[];
    structure: ReturnType<typeof buildGridTreeStructure>;
} {
    const rows = Object.keys(parents).map(uid => new Row({ name: uid }, uid));
    return { rows, structure: buildGridTreeStructure(rows, row => parents[row.uid]) };
}

const byName = (rows: readonly Row[]): readonly Row[] =>
    [...rows].sort((left, right) => String(left.data["name"]).localeCompare(String(right.data["name"])));

describe("buildGridTreeStructure", () => {
    it("links rows to their parents and keeps the data order among siblings", () => {
        const { structure } = treeOf({ a: null, b: "a", c: null, d: "a" });

        expect(structure.children.get(null)?.map(row => row.uid)).toEqual(["a", "c"]);
        expect(structure.children.get("a")?.map(row => row.uid)).toEqual(["b", "d"]);
        expect(structure.parents.get("d")).toBe("a");
    });

    it("makes a row a root when its parent isn't among the rows or is itself", () => {
        const { structure } = treeOf({ a: "missing", b: "b" });

        expect(structure.children.get(null)?.map(row => row.uid)).toEqual(["a", "b"]);
    });

    it("makes the rows of a cycle roots, so none of them is lost", () => {
        const { structure } = treeOf({ a: "b", b: "a", c: "a" });

        expect(structure.children.get(null)?.map(row => row.uid)).toEqual(["a", "b"]);
        expect(structure.children.get("a")?.map(row => row.uid)).toEqual(["c"]);
    });
});

describe("buildGridTreeView", () => {
    const parents = { a: null, a1: "a", a2: "a", a1x: "a1", b: null, b1: "b" };

    it("shows the roots, and the children of the expanded rows only", () => {
        const { structure } = treeOf(parents);

        const view = buildGridTreeView(structure, {
            isExpanded: row => row.uid === "a" || row.uid === "a1x",
            matches: null,
            sort: rows => rows
        });

        expect(view.rows.map(row => row.uid)).toEqual(["a", "a1", "a2", "b"]);
        expect(view.allRows.map(row => row.uid)).toEqual(["a", "a1", "a1x", "a2", "b", "b1"]);
    });

    it("gives each row its level, place among its siblings, and whether it has children", () => {
        const { structure } = treeOf(parents);

        const view = buildGridTreeView(structure, { isExpanded: () => true, matches: null, sort: rows => rows });

        expect(view.info.get("a")).toEqual({
            expanded: true,
            hasChildren: true,
            level: 1,
            parentUid: null,
            posInSet: 1,
            setSize: 2
        });
        expect(view.info.get("a2")).toEqual({
            expanded: false,
            hasChildren: false,
            level: 2,
            parentUid: "a",
            posInSet: 2,
            setSize: 2
        });
        expect(view.info.get("a1x")?.level).toBe(3);
    });

    it("never marks a row without children as expanded", () => {
        const { structure } = treeOf(parents);

        const view = buildGridTreeView(structure, { isExpanded: () => true, matches: null, sort: rows => rows });

        expect(view.info.get("b1")?.expanded).toBe(false);
    });

    it("sorts each parent's children on their own", () => {
        const { structure } = treeOf({ z: null, z2: "z", z1: "z", y: null });

        const view = buildGridTreeView(structure, { isExpanded: () => true, matches: null, sort: byName });

        expect(view.rows.map(row => row.uid)).toEqual(["y", "z", "z1", "z2"]);
    });

    it("keeps the rows above each filter match and drops the rest", () => {
        const { structure } = treeOf(parents);

        const view = buildGridTreeView(structure, {
            isExpanded: () => true,
            matches: new Set(["a1x"]),
            sort: rows => rows
        });

        expect(view.allRows.map(row => row.uid)).toEqual(["a", "a1", "a1x"]);
        // a's other child is filtered out, so a has one child left.
        expect(view.info.get("a1")?.setSize).toBe(1);
        expect(view.info.has("a2")).toBe(false);
    });

    it("lays out a tree deeper than the call stack allows recursion", () => {
        const depth = 20_000;
        const chain: Record<string, string | null> = { n0: null };
        for (let index = 1; index < depth; index++) {
            chain[`n${index}`] = `n${index - 1}`;
        }
        const { structure } = treeOf(chain);

        const view = buildGridTreeView(structure, { isExpanded: () => true, matches: null, sort: rows => rows });

        expect(view.rows).toHaveLength(depth);
        expect(view.info.get(`n${depth - 1}`)?.level).toBe(depth);
    });
});

describe("getGridTreeAncestorUids", () => {
    it("lists every row above the given rows once", () => {
        const { structure } = treeOf({ a: null, a1: "a", a1x: "a1", a2: "a", b: null });

        expect(getGridTreeAncestorUids(["a1x", "a2", "b"], structure.parents).sort()).toEqual(["a", "a1"]);
    });
});
