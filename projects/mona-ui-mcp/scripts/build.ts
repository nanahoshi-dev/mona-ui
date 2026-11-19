import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Builds the server into `dist/mona-ui-mcp`: compiles it, gives its package.json the library's version, so the two
 * release together, and bundles the library's docs data from `dist/mona-ui`, which `npm run build:prod` writes. The
 * server reads the bundled copy when the project's own `@nanahoshi/mona-ui` doesn't ship one.
 */

interface ManifestFiles {
    readonly pages: readonly { readonly file: string }[];
}

interface IndexFiles {
    readonly entryPoints: readonly { readonly name: string }[];
}

/** Copies the docs data the server reads, and nothing else, from a package-shaped folder. Returns how many files. */
export function bundleDocs(libraryRoot: string, target: string): number {
    const readJson = <T>(file: string): T => JSON.parse(readFileSync(join(libraryRoot, file), "utf8")) as T;
    const manifest = readJson<ManifestFiles>("docs/manifest.json");
    const index = readJson<IndexFiles>("docs/api/index.json");
    const files = [
        "docs/manifest.json",
        "docs/api/index.json",
        ...manifest.pages.map(page => page.file),
        ...index.entryPoints.map(entryPoint => `docs/api/${entryPoint.name}.json`)
    ];
    for (const file of files) {
        mkdirSync(dirname(join(target, file)), { recursive: true });
        copyFileSync(join(libraryRoot, file), join(target, file));
    }
    return files.length;
}

function main(): void {
    const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const repositoryRoot = resolve(projectRoot, "../..");
    const libraryRoot = join(repositoryRoot, "dist/mona-ui");
    const outputRoot = join(repositoryRoot, "dist/mona-ui-mcp");
    if (!existsSync(join(libraryRoot, "docs/manifest.json"))) {
        throw new Error("dist/mona-ui has no docs/manifest.json. Run npm run build:prod first.");
    }

    rmSync(outputRoot, { force: true, recursive: true });
    const tsc = join(repositoryRoot, "node_modules/typescript/bin/tsc");
    execFileSync(process.execPath, [tsc, "-p", join(projectRoot, "tsconfig.json")], { stdio: "inherit" });
    chmodSync(join(outputRoot, "main.js"), 0o755);

    const { version } = JSON.parse(readFileSync(join(libraryRoot, "package.json"), "utf8")) as { version: string };
    const source = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as Record<string, unknown>;
    writeFileSync(join(outputRoot, "package.json"), `${JSON.stringify({ ...source, version }, undefined, 4)}\n`);
    copyFileSync(join(projectRoot, "README.md"), join(outputRoot, "README.md"));
    const files = bundleDocs(libraryRoot, join(outputRoot, "data"));

    console.log(`Built @nanahoshi/mona-ui-mcp ${version} into dist/mona-ui-mcp, with ${files} docs files bundled.`);
}

if (process.env["VITEST"] !== "true" && process.argv[1]?.endsWith("build.ts")) {
    try {
        main();
    } catch (error: unknown) {
        console.error(error);
        process.exit(1);
    }
}
