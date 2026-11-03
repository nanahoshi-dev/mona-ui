import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import { createIterablePatchStore, createObjectPatchStore } from "./PatchStore";

interface Person {
    address: { city: string; zip: string };
    name: string;
    note?: string;
    roles: Set<string>;
    tags: string[];
}

const person = (overrides: Partial<Person> = {}): Person => ({
    address: { city: "Paris", zip: "75001" },
    name: "Ada",
    note: "x",
    roles: new Set(["user"]),
    tags: ["a", "b"],
    ...overrides
});

interface Row {
    id: number;
    name: string;
    note?: string;
    tags: string[];
}

const row = (id: number, overrides: Partial<Row> = {}): Row => ({ id, name: `Row ${id}`, tags: ["x"], ...overrides });

describe("ObjectPatchStore", () => {
    it("keeps a minimal draft and merges it into the view", () => {
        const store = createObjectPatchStore({ source: () => signal(person()) });

        store.patch({ address: { city: "Lyon" } });

        expect(store.changes()).toEqual({ address: { city: "Lyon" } });
        expect(store.view().address).toEqual({ city: "Lyon", zip: "75001" });

        store.patch({ address: { city: "Paris" } });

        expect(store.changes()).toBeUndefined();
        expect(store.hasDraft()).toBe(false);
    });

    it("clears a field patched to undefined", () => {
        const store = createObjectPatchStore({ source: () => signal(person()) });

        store.patch({ note: "edited" });
        store.patch({ note: undefined });

        expect(store.view().note).toBeUndefined();
        expect(store.changes()).toEqual({ note: undefined });

        store.patch({ note: "x" });

        expect(store.changes()).toBeUndefined();
    });

    it("drops a field that is cleared and absent from the base", () => {
        const store = createObjectPatchStore({ source: () => signal(person({ note: undefined })) });

        store.patch({ note: "edited" });
        store.patch({ note: undefined });

        expect(store.changes()).toBeUndefined();
    });

    it("keeps an edit to a Set field", () => {
        const store = createObjectPatchStore({ source: () => signal(person()) });

        store.patch({ roles: new Set(["user", "admin"]) });

        expect(store.view().roles).toEqual(new Set(["user", "admin"]));
        expect(store.hasDraft()).toBe(true);
    });

    it("applies the concat strategy once per patch", () => {
        const store = createObjectPatchStore({
            mergeOptions: { arrayStrategy: { kind: "concat" } },
            source: () => signal(person())
        });

        store.patch({ tags: ["c"] });

        expect(store.view().tags).toEqual(["a", "b", "c"]);

        store.patch({ tags: ["d"] });

        expect(store.view().tags).toEqual(["a", "b", "c", "d"]);
    });

    it("sets an array element by path without turning the array into an object", () => {
        const store = createObjectPatchStore({ source: () => signal(person()) });

        store.patchPath(["tags", 0], "z");

        expect(store.view().tags).toEqual(["z", "b"]);

        store.setPath(["tags", 1], "y");

        expect(store.view().tags).toEqual(["z", "y"]);
    });

    it("tracks pristine against the committed draft", () => {
        const store = createObjectPatchStore({ source: () => signal(person()) });

        store.patch({ name: "Grace" });

        expect(store.pristine()).toBe(false);

        store.commit();

        expect(store.pristine()).toBe(true);

        store.reset();

        expect(store.pristine()).toBe(true);
        expect(store.view().name).toBe("Ada");
    });

    it("wipes, preserves or rebases the draft when the base changes", () => {
        const base = signal(person());
        const wipe = createObjectPatchStore({ source: () => base });
        const preserve = createObjectPatchStore({ baseChangeStrategy: "preserve", source: () => base });
        const rebase = createObjectPatchStore({ baseChangeStrategy: "rebase", source: () => base });
        for (const store of [wipe, preserve, rebase]) {
            store.patch({ name: "Grace", note: "edited" });
            store.view();
        }

        base.set(person({ name: "Grace" }));

        expect(wipe.changes()).toBeUndefined();
        expect(preserve.changes()).toEqual({ name: "Grace", note: "edited" });
        expect(rebase.changes()).toEqual({ note: "edited" });
    });
});

describe("IterablePatchStore", () => {
    const create = (base = signal([row(1), row(2)]), strategy?: "preserve" | "rebase" | "wipe") =>
        createIterablePatchStore<Row, number>({ baseChangeStrategy: strategy, idOf: r => r.id, source: () => base });

    it("merges drafts into the view and lists changed items", () => {
        const store = create();

        store.patch(1, { name: "Edited" });

        expect(store.view()).toEqual([row(1, { name: "Edited" }), row(2)]);
        expect(store.changes()).toEqual([row(1, { name: "Edited" })]);
        expect(store.dirtyCount()).toBe(1);

        store.patch(1, { name: "Row 1" });

        expect(store.hasDraft(1)).toBe(false);
    });

    it("wipes drafts when the base changes, by default", () => {
        const base = signal([row(1), row(2)]);
        const store = create(base);
        store.patch(1, { name: "Edited" });
        store.view();

        base.set([row(1, { name: "Server" }), row(2)]);

        expect(store.hasDraft(1)).toBe(false);
        expect(store.view()[0].name).toBe("Server");
    });

    it("rebases drafts against the new base", () => {
        const base = signal([row(1), row(2)]);
        const store = create(base, "rebase");
        store.patch(1, { name: "Edited", tags: ["y"] });
        store.patch(2, { name: "Gone" });
        store.view();

        base.set([row(1, { name: "Edited" })]);

        expect(store.changes()).toEqual([row(1, { name: "Edited", tags: ["y"] })]);
        expect(store.hasDraft(2)).toBe(false);
    });

    it("applies preserved drafts over the new base item", () => {
        const base = signal([row(1), row(2)]);
        const store = create(base, "preserve");
        store.patch(1, { tags: ["y"] });
        store.view();

        base.set([row(1, { name: "Server" }), row(2)]);

        expect(store.view()[0]).toEqual(row(1, { name: "Server", tags: ["y"] }));
    });

    it("reuses the merged item while neither the base item nor its draft changes", () => {
        const base = signal([row(1), row(2)]);
        const store = create(base);
        store.patch(1, { name: "Edited" });
        const first = store.view()[0];

        store.patch(2, { name: "Other" });

        expect(store.view()[0]).toBe(first);
        expect(store.view()[1]).not.toBe(base()[1]);
    });

    it("applies the concat strategy over the base item", () => {
        const store = create();

        store.patch(1, { tags: ["y"] }, { arrayStrategy: { kind: "concat" } });

        expect(store.view()[0].tags).toEqual(["x", "y"]);

        store.patch(1, { tags: ["z"] }, { arrayStrategy: { kind: "concat" } });

        expect(store.view()[0].tags).toEqual(["x", "y", "z"]);
    });

    it("clears a field patched to undefined", () => {
        const store = create(signal([row(1, { note: "x" })]));

        store.patch(1, { note: "edited" });
        store.patch(1, { note: undefined });

        expect(store.view()[0].note).toBeUndefined();
        expect(store.hasDraft(1)).toBe(true);
    });

    it("sets an item's array element by path", () => {
        const store = create();

        store.patchPath(1, ["tags", 0], "y");

        expect(store.view()[0].tags).toEqual(["y"]);

        store.patchPath(1, ["tags", 1], "z");

        expect(store.view()[0].tags).toEqual(["y", "z"]);
    });

    it("stays pristine after committing many drafts", () => {
        const store = create(signal(Array.from({ length: 50 }, (_, i) => row(i))));
        store.patchMany(Array.from({ length: 20 }, (_, i) => [i * 2, { name: "Edited" }] as [number, Partial<Row>]));

        expect(store.pristine()).toBe(false);

        store.commit();

        expect(store.pristine()).toBe(true);
        expect(store.dirtyCount()).toBe(20);
    });

    it("patches many items at once, pruning each against its base item", () => {
        const store = create();

        store.patchMany([
            [1, { name: "Edited" }],
            [2, { name: "Row 2" }]
        ]);

        expect(store.dirtyCount()).toBe(1);
        expect(store.view()[0].name).toBe("Edited");
    });
});
