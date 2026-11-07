/* eslint-disable @typescript-eslint/naming-convention -- The keys are file paths and package names. */

/**
 * Turns an example's source into a complete Angular project, which is what "Open in StackBlitz" sends. Nothing about
 * it is kept by hand per example, so it can't go stale. Keep this file free of Angular imports: scripts run it under
 * plain Node.
 */

export interface ExampleProjectInput {
    /** The example's files, by file name. */
    readonly files: Readonly<Record<string, string>>;
    /** The file that holds the example's component. */
    readonly mainFile: string;
    /** Names the project in StackBlitz. */
    readonly title: string;
}

/** The dependencies of a generated project. The library's own peer dependencies install with it. */
const DEPENDENCIES = {
    "@angular/animations": "^22.0.0",
    "@angular/cdk": "^22.0.0",
    "@angular/common": "^22.0.0",
    "@angular/compiler": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/platform-browser": "^22.0.0",
    "@angular/platform-browser-dynamic": "^22.0.0",
    "@angular/router": "^22.0.0",
    "@lucide/angular": "^1.21.0",
    "@nanahoshi/mona-ui": "latest",
    rxjs: "^7.8.2",
    tslib: "^2.8.1"
};

const DEV_DEPENDENCIES = {
    "@angular/build": "^22.0.0",
    "@angular/cli": "^22.0.0",
    "@angular/compiler-cli": "^22.0.0",
    "@tailwindcss/postcss": "^4.1.0",
    postcss: "^8.5.0",
    tailwindcss: "^4.1.0",
    typescript: ">=5.9.0 <6.1.0"
};

/** What the rich text editor needs on top, as its installation notes say. */
const EDITOR_ENTRY = "@nanahoshi/mona-ui/editor";
const EDITOR_DEPENDENCIES = { remixicon: "^4.9.1" };
const EDITOR_DEV_DEPENDENCIES = { "@tailwindcss/typography": "^0.5.20" };
const EDITOR_STYLES = `@import "remixicon/fonts/remixicon.css";
@plugin "@tailwindcss/typography";
`;

const styles = (editor: boolean): string => `@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";
${editor ? EDITOR_STYLES : ""}
body {
    background-color: var(--color-canvas);
    color: var(--color-foreground);
    padding: 2rem;
}
`;

const toJson = (value: unknown): string => `${JSON.stringify(value, null, 4)}\n`;

/** What a component's file declares that the project has to refer to. */
export function readExampleComponent(source: string): { className: string; selector: string } {
    const selector = /selector:\s*"([^"]+)"/.exec(source)?.[1];
    const className = /export class (\w+)/.exec(source)?.[1];
    if (!selector || !className) {
        throw new Error("An example needs an exported component class with a selector.");
    }
    return { className, selector };
}

export function createExampleProject({ files, mainFile, title }: ExampleProjectInput): Record<string, string> {
    const { className, selector } = readExampleComponent(files[mainFile]);
    const appFiles = Object.fromEntries(Object.entries(files).map(([name, content]) => [`src/app/${name}`, content]));
    const editor = Object.values(files).some(content => content.includes(`"${EDITOR_ENTRY}"`));
    return {
        ...appFiles,
        ".postcssrc.json": toJson({ plugins: { "@tailwindcss/postcss": {} } }),
        "angular.json": toJson({
            version: 1,
            cli: { analytics: false },
            newProjectRoot: "projects",
            projects: {
                example: {
                    projectType: "application",
                    root: "",
                    sourceRoot: "src",
                    architect: {
                        build: {
                            builder: "@angular/build:application",
                            options: {
                                browser: "src/main.ts",
                                index: "src/index.html",
                                outputPath: "dist/example",
                                styles: ["src/styles.css"],
                                tsConfig: "tsconfig.json"
                            }
                        },
                        serve: {
                            builder: "@angular/build:dev-server",
                            options: { buildTarget: "example:build" }
                        }
                    }
                }
            }
        }),
        "package.json": toJson({
            name: "mona-ui-example",
            version: "0.0.0",
            private: true,
            scripts: { build: "ng build", start: "ng serve" },
            dependencies: editor ? { ...DEPENDENCIES, ...EDITOR_DEPENDENCIES } : DEPENDENCIES,
            devDependencies: editor ? { ...DEV_DEPENDENCIES, ...EDITOR_DEV_DEPENDENCIES } : DEV_DEPENDENCIES
        }),
        "src/index.html": `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <base href="/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <${selector}></${selector}>
    </body>
</html>
`,
        "src/main.ts": `import { bootstrapApplication } from "@angular/platform-browser";
import { ${className} } from "./app/${mainFile.replace(/\.ts$/, "")}";

bootstrapApplication(${className}).catch(error => console.error(error));
`,
        "src/styles.css": styles(editor),
        "tsconfig.json": toJson({
            compileOnSave: false,
            compilerOptions: {
                experimentalDecorators: true,
                importHelpers: true,
                module: "preserve",
                moduleResolution: "bundler",
                skipLibCheck: true,
                strict: true,
                target: "ES2022"
            },
            files: ["src/main.ts"]
        })
    };
}
