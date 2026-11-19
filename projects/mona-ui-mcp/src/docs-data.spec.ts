import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findInstalledPackage, MonaDocs, resolveDocsSource } from "./docs-data.js";
import { writeFixturePackage } from "./test-fixture.js";

describe("docs-data", () => {
    const folders: string[] = [];
    const folder = (): string => {
        const path = mkdtempSync(join(tmpdir(), "mona-ui-mcp-project-"));
        folders.push(path);
        return path;
    };
    /** A project with `@nanahoshi/mona-ui` installed: a copy of the fixture, or a version that ships no docs. */
    const project = (installed: "none" | "old" | "current" | "newer-schema"): string => {
        const root = folder();
        mkdirSync(join(root, "src", "app"), { recursive: true });
        if (installed === "none") {
            return root;
        }
        const packageRoot = join(root, "node_modules", "@nanahoshi", "mona-ui");
        if (installed === "old") {
            mkdirSync(packageRoot, { recursive: true });
            writeFileSync(join(packageRoot, "package.json"), JSON.stringify({ version: "0.30.0" }));
            return root;
        }
        const fixture = writeFixturePackage("2.0.0");
        folders.push(fixture);
        // A copy, since a link would make the path depend on the platform.
        cpSync(fixture, packageRoot, { recursive: true });
        if (installed === "newer-schema") {
            const manifestPath = join(packageRoot, "docs", "manifest.json");
            const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as object;
            writeFileSync(manifestPath, JSON.stringify({ ...manifest, schemaVersion: 99 }));
        }
        return root;
    };
    const bundled = (): string => {
        const root = writeFixturePackage("1.0.0");
        folders.push(root);
        return root;
    };

    afterEach(() => {
        for (const path of folders.splice(0)) {
            rmSync(path, { force: true, recursive: true });
        }
    });

    it("uses the docs of the version the project has installed, found from a folder inside it", () => {
        const root = project("current");
        const source = resolveDocsSource({ bundledRoot: bundled(), searchFrom: [join(root, "src", "app")] });

        expect(source).toEqual({ origin: "installed", root: join(root, "node_modules", "@nanahoshi", "mona-ui") });
        expect(new MonaDocs(source).version).toBe("2.0.0");
    });

    it("uses the project's docs without needing the bundled copy, and says so when neither is there", () => {
        expect(resolveDocsSource({ bundledRoot: "missing", searchFrom: [project("current")] }).origin).toBe(
            "installed"
        );
        expect(() => resolveDocsSource({ bundledRoot: "missing", searchFrom: [project("old")] })).toThrow(
            "the copy bundled with this server is missing"
        );
    });

    it("falls back to the bundled docs, saying why, for a version that ships none", () => {
        const source = resolveDocsSource({ bundledRoot: bundled(), searchFrom: [project("old")] });

        expect(source.origin).toBe("bundled");
        expect(source.note).toContain("@nanahoshi/mona-ui 0.30.0 installed, which ships no docs data");
        expect(source.note).toContain("the 1.0.0 docs bundled with this server");
    });

    it("falls back to the bundled docs for a schema newer than the server reads", () => {
        const source = resolveDocsSource({ bundledRoot: bundled(), searchFrom: [project("newer-schema")] });

        expect(source.origin).toBe("bundled");
        expect(source.note).toContain("Update @nanahoshi/mona-ui-mcp");
    });

    it("falls back to the bundled docs when nothing is installed, and tries every folder first", () => {
        const empty = project("none");
        const withDocs = project("current");

        expect(resolveDocsSource({ bundledRoot: bundled(), searchFrom: [empty, withDocs] }).origin).toBe("installed");
        expect(resolveDocsSource({ bundledRoot: bundled(), searchFrom: [empty] }).note).toContain(
            "isn't installed where this server looked"
        );
    });

    it("reads a folder given on the command line, before anything else", () => {
        const docsRoot = bundled();

        expect(resolveDocsSource({ bundledRoot: "missing", docsRoot, searchFrom: [project("current")] })).toEqual({
            origin: "option",
            root: docsRoot
        });
        expect(() => resolveDocsSource({ bundledRoot: "missing", docsRoot: folder(), searchFrom: [] })).toThrow(
            "has no docs/manifest.json"
        );
    });

    it("finds the nearest installed package", () => {
        const root = project("old");

        expect(findInstalledPackage(join(root, "src", "app"))).toEqual({
            root: join(root, "node_modules", "@nanahoshi", "mona-ui"),
            version: "0.30.0"
        });
    });

    it("reads entry points and pages on demand", () => {
        const docs = new MonaDocs({ origin: "option", root: bundled() });

        expect(docs.entryPoint("grid")?.symbols.map(symbol => symbol.name)).toContain("GridComponent");
        expect(docs.entryPoint("missing")).toBeUndefined();
        expect(docs.allSymbols().find(({ symbol }) => symbol.name === "SlicePipe")?.entryPoint).toBe("common");
        expect(docs.pageMarkdown(docs.manifest.pages[0])).toMatch(/^# Button/);
    });
});
