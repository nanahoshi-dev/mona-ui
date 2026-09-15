import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

export type LocaleAuditCategory =
    | "completeness-bypass"
    | "copied-english"
    | "invalid-metadata"
    | "forbidden-syntax";

export interface LocaleAuditViolation {
    category: LocaleAuditCategory;
    detail: string;
    file: string;
    line: number;
}

export interface DefaultMessageFingerprint {
    readonly namespace: string;
    readonly key: string;
    readonly kind: "static" | "function";
    readonly staticFragments: readonly string[];
}

export interface OfficialLocaleDescriptor {
    readonly folder: string;
    readonly folderPath: string;
    readonly canonicalId: string;
    readonly messagesFile: string;
    readonly localeFile: string;
    readonly messagesExport: string;
    readonly localeExport: string;
    readonly direction?: "ltr" | "rtl";
}

export interface LocaleDiscoveryResult {
    readonly locales: readonly OfficialLocaleDescriptor[];
    readonly violations: readonly LocaleAuditViolation[];
}

export const TECHNICAL_ALLOWLIST = new Set([
    "URL",
    "RGB",
    "HEX",
    "HSL",
    "HTML",
    "px",
    ":",
    "-",
    "+"
]);

export interface LocaleCopyException {
    readonly localeId: string;
    readonly messagePath: string;
    readonly value: string;
}

export const LOCALE_COPY_EXCEPTIONS: readonly LocaleCopyException[] = [
    { localeId: "es-ES", messagePath: "chart.closeAbbreviation", value: "C" },
    { localeId: "es-ES", messagePath: "editor.color", value: "Color" },
    { localeId: "es-ES", messagePath: "notification.error", value: "Error" },
    { localeId: "es-ES", messagePath: "colorPalette.color", value: "Color" },
    { localeId: "de-DE", messagePath: "chart.highAbbreviation", value: "H" },
    { localeId: "de-DE", messagePath: "dialog.ok", value: "OK" },
    { localeId: "de-DE", messagePath: "editor.format", value: "Format" },
    { localeId: "de-DE", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "de-DE", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "de-DE", messagePath: "timeSelector.pm", value: "PM" },
    { localeId: "fr-FR", messagePath: "chart.closeAbbreviation", value: "C" },
    { localeId: "fr-FR", messagePath: "chart.conversion", value: "Conversion" },
    { localeId: "fr-FR", messagePath: "chart.highAbbreviation", value: "H" },
    { localeId: "fr-FR", messagePath: "chart.openAbbreviation", value: "O" },
    { localeId: "fr-FR", messagePath: "colorGradient.saturationAndValueText", value: "Saturation" },
    { localeId: "fr-FR", messagePath: "dateTimePicker.date", value: "Date" },
    { localeId: "fr-FR", messagePath: "dialog.ok", value: "OK" },
    { localeId: "fr-FR", messagePath: "editor.format", value: "Format" },
    { localeId: "fr-FR", messagePath: "pager.jumpBackwardLabel", value: "pages" },
    { localeId: "fr-FR", messagePath: "pager.jumpForwardLabel", value: "pages" },
    { localeId: "fr-FR", messagePath: "pager.pageLabel", value: "Page" },
    { localeId: "fr-FR", messagePath: "pager.pageStatus", value: "Page" },
    { localeId: "fr-FR", messagePath: "pager.pageText", value: "Page" },
    { localeId: "fr-FR", messagePath: "scrollView.page", value: "Page" },
    { localeId: "fr-FR", messagePath: "scrollView.pageOf", value: "Page" },
    { localeId: "fr-FR", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "fr-FR", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "fr-FR", messagePath: "timeSelector.minutes", value: "Minutes" },
    { localeId: "fr-FR", messagePath: "timeSelector.pm", value: "PM" },
    { localeId: "ja-JP", messagePath: "dialog.ok", value: "OK" },
    { localeId: "pt-BR", messagePath: "dialog.ok", value: "OK" },
    { localeId: "pt-BR", messagePath: "scrollView.slide", value: "slide" },
    { localeId: "pt-BR", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "pt-BR", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "pt-BR", messagePath: "timeSelector.pm", value: "PM" },
    { localeId: "it-IT", messagePath: "chart.closeAbbreviation", value: "C" },
    { localeId: "it-IT", messagePath: "dialog.ok", value: "OK" },
    { localeId: "it-IT", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "it-IT", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "it-IT", messagePath: "timeSelector.pm", value: "PM" },
    { localeId: "id-ID", messagePath: "dialog.ok", value: "OK" },
    { localeId: "id-ID", messagePath: "multiSelect.itemsCount", value: "item" },
    { localeId: "id-ID", messagePath: "scrollView.slide", value: "slide" },
    { localeId: "id-ID", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "id-ID", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "id-ID", messagePath: "timeSelector.pm", value: "PM" },
    { localeId: "ru-RU", messagePath: "timeSelector.am", value: "AM" },
    { localeId: "ru-RU", messagePath: "timeSelector.amPm", value: "AM/PM" },
    { localeId: "ru-RU", messagePath: "timeSelector.pm", value: "PM" }
];

export function isAllowedLocaleCopyException(
    localeId: string | undefined,
    messagePath: string,
    value: string
): boolean {
    if (!localeId) {
        return false;
    }
    const canonicalId = canonicalizeLocaleId(localeId) ?? localeId;
    const normValue = value.trim().toLowerCase();
    return LOCALE_COPY_EXCEPTIONS.some(
        ex =>
            (ex.localeId === localeId || ex.localeId === canonicalId) &&
            ex.messagePath === messagePath &&
            ex.value.trim().toLowerCase() === normValue
    );
}

export const MONA_MESSAGE_NAMESPACES = [
    "autoComplete",
    "breadcrumb",
    "buttonGroup",
    "calendar",
    "card",
    "chart",
    "chip",
    "colorGradient",
    "colorPalette",
    "colorPicker",
    "comboBox",
    "datePicker",
    "dateTimePicker",
    "dialog",
    "dropdownList",
    "dropdowns",
    "editor",
    "filter",
    "grid",
    "list",
    "listBox",
    "multiSelect",
    "notification",
    "numericTextBox",
    "otpInput",
    "pager",
    "rating",
    "scrollView",
    "sheet",
    "slider",
    "spinner",
    "splitButton",
    "splitter",
    "stepper",
    "tabs",
    "textBox",
    "timePicker",
    "timeSelector",
    "treeView",
    "window"
] as const;

export type MonaMessageNamespace = (typeof MONA_MESSAGE_NAMESPACES)[number];

export function isAllowedTechnicalToken(text: string): boolean {
    const trimmed = text.trim();
    return TECHNICAL_ALLOWLIST.has(trimmed);
}

export function canonicalizeLocaleId(id: string): string | null {
    try {
        const canonical = Intl.getCanonicalLocales(id);
        return canonical[0] ?? null;
    } catch {
        return null;
    }
}

export function typeNameToNamespace(typeName: string): MonaMessageNamespace | null {
    const trimmed = typeName.trim();
    const match = /^Mona([A-Z][a-zA-Z0-9]*)Messages$/.exec(trimmed);
    if (!match) {
        return null;
    }
    const pascal = match[1];
    const camel = pascal[0].toLowerCase() + pascal.slice(1);
    return MONA_MESSAGE_NAMESPACES.includes(camel as MonaMessageNamespace)
        ? (camel as MonaMessageNamespace)
        : null;
}

export function extractMeaningfulFragments(fnNode: Node): string[] {
    const fragments: string[] = [];

    for (const str of fnNode.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
        const text = str.getLiteralText().trim();
        if (text && !isAllowedTechnicalToken(text) && /[a-zA-Z]/.test(text)) {
            fragments.push(text);
        }
    }

    for (const tmpl of fnNode.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        const text = tmpl.getLiteralText().trim();
        if (text && !isAllowedTechnicalToken(text) && /[a-zA-Z]/.test(text)) {
            fragments.push(text);
        }
    }

    for (const expr of fnNode.getDescendantsOfKind(SyntaxKind.TemplateExpression)) {
        const head = expr.getHead().getLiteralText().trim();
        if (head && !isAllowedTechnicalToken(head) && /[a-zA-Z]/.test(head)) {
            fragments.push(head);
        }
        for (const span of expr.getTemplateSpans()) {
            const spanText = span.getLiteral().getLiteralText().trim();
            if (spanText && !isAllowedTechnicalToken(spanText) && /[a-zA-Z]/.test(spanText)) {
                fragments.push(spanText);
            }
        }
    }

    return fragments;
}

export function findCopiedFunctionFragments(
    localeFragments: readonly string[],
    enFragments: readonly string[],
    localeId?: string,
    messagePath?: string
): string[] {
    const copied: string[] = [];
    for (const en of enFragments) {
        const enClean = en.trim();
        const enNorm = enClean.toLowerCase();
        if (!enNorm || !/[a-zA-Z]/.test(enNorm)) {
            continue;
        }
        if (isAllowedTechnicalToken(enClean)) {
            continue;
        }
        if (messagePath && isAllowedLocaleCopyException(localeId, messagePath, enClean)) {
            continue;
        }
        for (const loc of localeFragments) {
            const locClean = loc.trim();
            if (isAllowedTechnicalToken(locClean)) {
                continue;
            }
            if (messagePath && isAllowedLocaleCopyException(localeId, messagePath, locClean)) {
                continue;
            }
            if (locClean.toLowerCase() === enNorm) {
                if (!copied.includes(locClean)) {
                    copied.push(locClean);
                }
            }
        }
    }
    return copied;
}

export function areFunctionFragmentsCopied(
    localeFragments: readonly string[],
    enFragments: readonly string[],
    localeId?: string,
    messagePath?: string
): boolean {
    return findCopiedFunctionFragments(localeFragments, enFragments, localeId, messagePath).length > 0;
}

function findDefaultMessageFiles(dir: string): string[] {
    let results: string[] = [];
    if (!existsSync(dir)) {
        return results;
    }
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        try {
            if (statSync(full).isDirectory()) {
                results = results.concat(findDefaultMessageFiles(full));
            } else if (entry.endsWith(".default-messages.ts")) {
                results.push(full);
            }
        } catch {
            // ignore unreadable entries
        }
    }
    return results;
}

export interface EnglishDefaultDiscoveryResult {
    readonly fingerprints: Map<string, DefaultMessageFingerprint>;
    readonly violations: readonly LocaleAuditViolation[];
    readonly namespaces: Set<string>;
    readonly size: number;
    has(key: string): boolean;
    get(key: string): DefaultMessageFingerprint | undefined;
    [Symbol.iterator](): IterableIterator<[string, DefaultMessageFingerprint]>;
}

export function loadCanonicalMessageNamespaces(
    schemaPath: string = resolve(process.cwd(), "projects/mona-ui/i18n/models/mona-locale-messages.ts"),
    project: Project = new Project({ useInMemoryFileSystem: true })
): { namespaces: Set<string>; violations: LocaleAuditViolation[] } {
    const violations: LocaleAuditViolation[] = [];
    const namespaces = new Set<string>();

    if (!existsSync(schemaPath)) {
        violations.push({
            category: "invalid-metadata",
            detail: `Canonical message schema file does not exist: ${schemaPath}`,
            file: schemaPath,
            line: 1
        });
        return { namespaces, violations };
    }

    try {
        const content = readFileSync(schemaPath, "utf-8");
        const sf = project.createSourceFile(`schema-${Date.now()}-${Math.random()}.ts`, content, { overwrite: true });
        const iface = sf.getInterface("MonaLocaleMessages");
        if (!iface) {
            violations.push({
                category: "invalid-metadata",
                detail: `Could not find interface "MonaLocaleMessages" in ${schemaPath}`,
                file: schemaPath,
                line: 1
            });
            return { namespaces, violations };
        }

        for (const prop of iface.getProperties()) {
            namespaces.add(prop.getName().trim());
        }
    } catch (err: any) {
        violations.push({
            category: "invalid-metadata",
            detail: `Failed to parse canonical message schema in ${schemaPath}: ${err.message}`,
            file: schemaPath,
            line: 1
        });
    }

    return { namespaces, violations };
}

export function checkSchemaDrift(
    canonicalNamespaces: Set<string>,
    schemaPath: string
): LocaleAuditViolation[] {
    const violations: LocaleAuditViolation[] = [];
    const hardcodedSet = new Set<string>(MONA_MESSAGE_NAMESPACES);

    const missingInHardcoded = Array.from(canonicalNamespaces).filter(ns => !hardcodedSet.has(ns));
    const extraInHardcoded = Array.from(hardcodedSet).filter(ns => !canonicalNamespaces.has(ns));

    if (missingInHardcoded.length > 0 || extraInHardcoded.length > 0) {
        violations.push({
            category: "invalid-metadata",
            detail: `Audit namespace registry MONA_MESSAGE_NAMESPACES has drifted from canonical MonaLocaleMessages interface: missing [${missingInHardcoded.join(", ")}], extra [${extraInHardcoded.join(", ")}]`,
            file: schemaPath,
            line: 1
        });
    }

    return violations;
}

export function loadDefaultEnglishStrings(
    baseDir: string = resolve(process.cwd(), "projects/mona-ui"),
    project: Project = new Project({ useInMemoryFileSystem: true })
): EnglishDefaultDiscoveryResult {
    const violations: LocaleAuditViolation[] = [];
    const fingerprints = new Map<string, DefaultMessageFingerprint>();
    const namespaces = new Set<string>();

    const makeResult = (): EnglishDefaultDiscoveryResult => ({
        fingerprints,
        violations,
        namespaces,
        get size() {
            return fingerprints.size;
        },
        has(key: string) {
            return fingerprints.has(key);
        },
        get(key: string) {
            return fingerprints.get(key);
        },
        [Symbol.iterator]() {
            return fingerprints[Symbol.iterator]();
        }
    });

    if (!existsSync(baseDir)) {
        violations.push({
            category: "invalid-metadata",
            detail: `English default message root does not exist: ${baseDir}`,
            file: baseDir,
            line: 1
        });
        return makeResult();
    }

    const schemaPath = resolve(baseDir, "i18n/models/mona-locale-messages.ts");
    let canonicalNamespaces: Set<string>;
    let hasCanonicalSchema = false;
    if (existsSync(schemaPath)) {
        hasCanonicalSchema = true;
        const schemaResult = loadCanonicalMessageNamespaces(schemaPath, project);
        violations.push(...schemaResult.violations);
        canonicalNamespaces = schemaResult.namespaces;
        violations.push(...checkSchemaDrift(canonicalNamespaces, schemaPath));
    } else {
        canonicalNamespaces = new Set<string>(MONA_MESSAGE_NAMESPACES);
    }

    const defaultFiles = findDefaultMessageFiles(baseDir);
    if (defaultFiles.length === 0) {
        violations.push({
            category: "completeness-bypass",
            detail: `Zero default English message catalogs discovered in ${baseDir}`,
            file: baseDir,
            line: 1
        });
        return makeResult();
    }

    for (const file of defaultFiles) {
        const content = readFileSync(file, "utf-8");
        const sf = project.createSourceFile(`default-${Date.now()}-${Math.random()}.ts`, content, { overwrite: true });

        // Determine namespace
        let detectedNamespace: string | null = null;
        for (const decl of sf.getVariableDeclarations()) {
            const typeText =
                decl.getTypeNode()?.getText() ??
                decl.getInitializer()?.asKind(SyntaxKind.SatisfiesExpression)?.getTypeNode().getText();
            if (typeText) {
                const match = /^Mona([A-Z][a-zA-Z0-9]*)Messages$/.exec(typeText.trim());
                if (match) {
                    const pascal = match[1];
                    const camel = pascal[0].toLowerCase() + pascal.slice(1);
                    if (canonicalNamespaces.has(camel) || MONA_MESSAGE_NAMESPACES.includes(camel as MonaMessageNamespace)) {
                        detectedNamespace = camel;
                        break;
                    }
                }
            }
        }

        if (!detectedNamespace) {
            // Fallback from filename / directory
            const base = basename(file).replace(/\.default-messages\.ts$/, "");
            if (base === "list") {
                detectedNamespace = "list";
            } else if (base === "tree" || base === "tree-view") {
                detectedNamespace = "treeView";
            } else {
                const camel = base.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
                if (canonicalNamespaces.has(camel) || MONA_MESSAGE_NAMESPACES.includes(camel as MonaMessageNamespace)) {
                    detectedNamespace = camel;
                }
            }
        }

        if (
            !detectedNamespace ||
            (!canonicalNamespaces.has(detectedNamespace) &&
                !MONA_MESSAGE_NAMESPACES.includes(detectedNamespace as MonaMessageNamespace))
        ) {
            violations.push({
                category: "invalid-metadata",
                detail: `Default message file "${file}" has unknown or unmapped namespace "${detectedNamespace ?? "unrecognized"}"`,
                file,
                line: 1
            });
            continue;
        }

        let fileHasProperties = false;
        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop)) {
                    const key = prop.getName();
                    const fullPath = `${detectedNamespace}.${key}`;
                    const init = prop.getInitializer();
                    if (!init) {
                        continue;
                    }

                    if (fingerprints.has(fullPath)) {
                        violations.push({
                            category: "invalid-metadata",
                            detail: `Duplicate English default message fingerprint for "${fullPath}" found in "${file}"`,
                            file,
                            line: prop.getStartLineNumber()
                        });
                        continue;
                    }

                    if (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init)) {
                        fileHasProperties = true;
                        fingerprints.set(fullPath, {
                            namespace: detectedNamespace,
                            key,
                            kind: "static",
                            staticFragments: [init.getLiteralText()]
                        });
                    } else if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
                        const fragments = extractMeaningfulFragments(init);
                        fileHasProperties = true;
                        fingerprints.set(fullPath, {
                            namespace: detectedNamespace,
                            key,
                            kind: "function",
                            staticFragments: fragments
                        });
                    }
                }
            }
        }

        if (fileHasProperties) {
            namespaces.add(detectedNamespace);
        }
    }

    if (hasCanonicalSchema && canonicalNamespaces.size > 0) {
        for (const canonicalNs of canonicalNamespaces) {
            if (!namespaces.has(canonicalNs)) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Canonical message namespace "${canonicalNs}" has no discovered English default message fingerprints in ${baseDir}`,
                    file: baseDir,
                    line: 1
                });
            }
        }
    }

    return makeResult();
}

export function discoverOfficialLocales(
    localesDir: string = resolve(process.cwd(), "projects/mona-ui/locales"),
    project: Project = new Project({ useInMemoryFileSystem: true })
): LocaleDiscoveryResult {
    const violations: LocaleAuditViolation[] = [];
    const locales: OfficialLocaleDescriptor[] = [];

    if (!existsSync(localesDir)) {
        violations.push({
            category: "invalid-metadata",
            detail: `Official locales directory does not exist: ${localesDir}`,
            file: localesDir,
            line: 1
        });
        return { locales, violations };
    }

    const entries = readdirSync(localesDir);
    const subdirs = entries.filter(e => {
        try {
            return statSync(join(localesDir, e)).isDirectory();
        } catch {
            return false;
        }
    });

    if (subdirs.length === 0) {
        violations.push({
            category: "invalid-metadata",
            detail: `No official locale directories found in ${localesDir}`,
            file: localesDir,
            line: 1
        });
        return { locales, violations };
    }

    const publicApiPath = join(localesDir, "public-api.ts");
    let publicApiContent = "";
    if (!existsSync(publicApiPath)) {
        violations.push({
            category: "invalid-metadata",
            detail: `Missing public-api.ts in ${localesDir}`,
            file: localesDir,
            line: 1
        });
    } else {
        publicApiContent = readFileSync(publicApiPath, "utf-8");
    }

    for (const folder of subdirs) {
        const folderPath = join(localesDir, folder);
        const canonicalTag = canonicalizeLocaleId(folder.replace(/_/g, "-"));
        if (!canonicalTag) {
            violations.push({
                category: "invalid-metadata",
                detail: `Folder name "${folder}" is not a valid BCP 47 locale tag`,
                file: folderPath,
                line: 1
            });
            continue;
        }

        const files = readdirSync(folderPath).filter(f => !f.endsWith(".spec.ts"));
        const messagesFiles = files.filter(f => f.endsWith(".messages.ts"));
        const localeFiles = files.filter(f => f.endsWith(".locale.ts"));
        const otherTsFiles = files.filter(
            f => f.endsWith(".ts") && !f.endsWith(".messages.ts") && !f.endsWith(".locale.ts")
        );

        for (const other of otherTsFiles) {
            violations.push({
                category: "invalid-metadata",
                detail: `Unexpected file "${other}" in locale folder "${folder}"`,
                file: join(folderPath, other),
                line: 1
            });
        }

        if (messagesFiles.length === 0) {
            violations.push({
                category: "invalid-metadata",
                detail: `Missing *.messages.ts file in locale folder "${folder}"`,
                file: folderPath,
                line: 1
            });
        } else if (messagesFiles.length > 1) {
            violations.push({
                category: "invalid-metadata",
                detail: `Multiple *.messages.ts files found in locale folder "${folder}"`,
                file: folderPath,
                line: 1
            });
        }

        if (localeFiles.length === 0) {
            violations.push({
                category: "invalid-metadata",
                detail: `Missing *.locale.ts file in locale folder "${folder}"`,
                file: folderPath,
                line: 1
            });
        } else if (localeFiles.length > 1) {
            violations.push({
                category: "invalid-metadata",
                detail: `Multiple *.locale.ts files found in locale folder "${folder}"`,
                file: folderPath,
                line: 1
            });
        }

        if (messagesFiles.length !== 1 || localeFiles.length !== 1) {
            continue;
        }

        const messagesFile = join(folderPath, messagesFiles[0]);
        const localeFile = join(folderPath, localeFiles[0]);

        let messagesExport = "";
        try {
            const msgSf = project.createSourceFile(
                `disc-msg-${Date.now()}-${Math.random()}.ts`,
                readFileSync(messagesFile, "utf-8"),
                { overwrite: true }
            );
            const exportedMsgDecls = msgSf
                .getVariableDeclarations()
                .filter(d => d.getVariableStatement()?.isExported() && /^[A-Z0-9_]+_MESSAGES$/.test(d.getName()));
            if (exportedMsgDecls.length === 1) {
                messagesExport = exportedMsgDecls[0].getName();
            } else if (exportedMsgDecls.length === 0) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Missing official exported messages catalog in "${messagesFile}". Expected a variable declaration matching /^[A-Z0-9_]+_MESSAGES$/`,
                    file: messagesFile,
                    line: 1
                });
            } else {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Expected exactly one exported official messages catalog in "${messagesFile}", found ${exportedMsgDecls.length} ([${exportedMsgDecls.map(d => d.getName()).join(", ")}])`,
                    file: messagesFile,
                    line: 1
                });
            }
        } catch (err: any) {
            violations.push({
                category: "invalid-metadata",
                detail: `Failed to parse locale messages file "${messagesFile}": ${err.message}`,
                file: messagesFile,
                line: 1
            });
        }

        let localeExport = "";
        let direction: "ltr" | "rtl" | undefined;
        try {
            const locSf = project.createSourceFile(
                `disc-loc-${Date.now()}-${Math.random()}.ts`,
                readFileSync(localeFile, "utf-8"),
                { overwrite: true }
            );
            const exportedLocDecls = locSf
                .getVariableDeclarations()
                .filter(d => d.getVariableStatement()?.isExported() && /^MONA_[A-Z0-9_]+_LOCALE$/.test(d.getName()));
            if (exportedLocDecls.length === 1) {
                localeExport = exportedLocDecls[0].getName();
                const init = exportedLocDecls[0].getInitializer();
                const obj =
                    init?.asKind(SyntaxKind.SatisfiesExpression)?.getExpression()?.asKind(SyntaxKind.ObjectLiteralExpression) ??
                    init?.asKind(SyntaxKind.ObjectLiteralExpression);
                if (obj) {
                    const dirProp = obj.getProperty("direction");
                    if (dirProp && Node.isPropertyAssignment(dirProp)) {
                        const dirInit = dirProp.getInitializer();
                        if (dirInit && (Node.isStringLiteral(dirInit) || Node.isNoSubstitutionTemplateLiteral(dirInit))) {
                            const val = dirInit.getLiteralText().trim();
                            if (val === "ltr" || val === "rtl") {
                                direction = val;
                            }
                        }
                    }
                }
            } else if (exportedLocDecls.length === 0) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Missing official exported locale constant in "${localeFile}". Expected a variable declaration matching /^MONA_[A-Z0-9_]+_LOCALE$/`,
                    file: localeFile,
                    line: 1
                });
            } else {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Expected exactly one exported official locale constant in "${localeFile}", found ${exportedLocDecls.length} ([${exportedLocDecls.map(d => d.getName()).join(", ")}])`,
                    file: localeFile,
                    line: 1
                });
            }
        } catch (err: any) {
            violations.push({
                category: "invalid-metadata",
                detail: `Failed to parse locale metadata file "${localeFile}": ${err.message}`,
                file: localeFile,
                line: 1
            });
        }

        if (messagesExport && localeExport) {
            locales.push({
                folder,
                folderPath,
                canonicalId: canonicalTag,
                messagesFile,
                localeFile,
                messagesExport,
                localeExport,
                direction
            });
        }
    }

    // Global validations across discovered locales
    const seenIds = new Map<string, string>();
    for (const loc of locales) {
        if (seenIds.has(loc.canonicalId)) {
            violations.push({
                category: "invalid-metadata",
                detail: `Duplicate locale ID "${loc.canonicalId}" found in folders "${seenIds.get(loc.canonicalId)}" and "${loc.folder}"`,
                file: loc.folderPath,
                line: 1
            });
        } else {
            seenIds.set(loc.canonicalId, loc.folder);
        }
    }

    const seenExports = new Map<string, string>();
    for (const loc of locales) {
        if (loc.localeExport) {
            if (seenExports.has(loc.localeExport)) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Duplicate locale export symbol "${loc.localeExport}" found in folders "${seenExports.get(loc.localeExport)}" and "${loc.folder}"`,
                    file: loc.folderPath,
                    line: 1
                });
            } else {
                seenExports.set(loc.localeExport, loc.folder);
            }
        }
    }

    if (publicApiContent) {
        try {
            const pubSf = project.createSourceFile(
                `disc-pub-${Date.now()}-${Math.random()}.ts`,
                publicApiContent,
                { overwrite: true }
            );

            interface ExportedSymbolInfo {
                sourceName: string;
                exportedName: string;
                hasAlias: boolean;
                moduleSpecifier: string;
                line: number;
            }
            const exportsList: ExportedSymbolInfo[] = [];

            for (const exportDecl of pubSf.getExportDeclarations()) {
                const moduleSpecifier = exportDecl.getModuleSpecifierValue() ?? "";
                for (const named of exportDecl.getNamedExports()) {
                    const sourceName = named.getName().trim();
                    const aliasNode = named.getAliasNode();
                    const exportedName = aliasNode ? aliasNode.getText().trim() : sourceName;
                    const hasAlias = Boolean(aliasNode && aliasNode.getText().trim() !== sourceName);
                    exportsList.push({
                        sourceName,
                        exportedName,
                        hasAlias,
                        moduleSpecifier,
                        line: named.getStartLineNumber()
                    });
                }
            }

            for (const loc of locales) {
                if (!loc.localeExport) {
                    continue;
                }

                const aliasedToOfficial = exportsList.find(
                    e => e.exportedName === loc.localeExport && (e.sourceName !== loc.localeExport || e.hasAlias)
                );
                if (aliasedToOfficial) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" in public-api.ts must be directly re-exported without an alias (found "${aliasedToOfficial.sourceName} as ${aliasedToOfficial.exportedName}")`,
                        file: publicApiPath,
                        line: aliasedToOfficial.line
                    });
                }

                const renamedOfficial = exportsList.find(
                    e => e.sourceName === loc.localeExport && (e.exportedName !== loc.localeExport || e.hasAlias)
                );
                if (renamedOfficial) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" in public-api.ts cannot be renamed as "${renamedOfficial.exportedName}"; it must be directly re-exported without an alias`,
                        file: publicApiPath,
                        line: renamedOfficial.line
                    });
                }

                if (!exportsList.some(e => e.exportedName === loc.localeExport || e.sourceName === loc.localeExport)) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" is not exported in public-api.ts`,
                        file: publicApiPath,
                        line: 1
                    });
                    continue;
                }

                const directExports = exportsList.filter(
                    e => e.sourceName === loc.localeExport && e.exportedName === loc.localeExport && !e.hasAlias
                );

                if (directExports.length === 0) {
                    // Already flagged by aliasedToOfficial or renamedOfficial
                    continue;
                }

                if (directExports.length > 1) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Multiple direct exports for "${loc.localeExport}" found in public-api.ts`,
                        file: publicApiPath,
                        line: directExports[1].line
                    });
                }

                const directExport = directExports[0];
                if (!directExport.moduleSpecifier) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" in public-api.ts must be re-exported from its locale module file`,
                        file: publicApiPath,
                        line: directExport.line
                    });
                    continue;
                }

                const resolvedExportTarget = resolve(localesDir, directExport.moduleSpecifier)
                    .replace(/\.ts$/, "")
                    .replace(/\\/g, "/");
                const expectedTarget = resolve(loc.localeFile).replace(/\.ts$/, "").replace(/\\/g, "/");

                if (resolvedExportTarget !== expectedTarget) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" in public-api.ts is exported from "${directExport.moduleSpecifier}", but expected module "./${loc.folder}/${basename(loc.localeFile).replace(/\.ts$/, "")}"`,
                        file: publicApiPath,
                        line: directExport.line
                    });
                }
            }
        } catch (err: any) {
            violations.push({
                category: "invalid-metadata",
                detail: `Failed to parse public-api.ts: ${err.message}`,
                file: publicApiPath,
                line: 1
            });
        }
    }

    return { locales, violations };
}

function checkCopiedEnglish(
    catalogObj: Node,
    englishDefaults: Map<string, any> | EnglishDefaultDiscoveryResult,
    filePath: string,
    violations: LocaleAuditViolation[],
    localeId?: string
): void {
    if (!Node.isObjectLiteralExpression(catalogObj)) {
        return;
    }

    const defaultsMap =
        "fingerprints" in englishDefaults && englishDefaults.fingerprints instanceof Map
            ? englishDefaults.fingerprints
            : (englishDefaults as Map<string, any>);

    for (const nsProp of catalogObj.getProperties()) {
        if (!Node.isPropertyAssignment(nsProp)) {
            continue;
        }
        const namespace = nsProp.getName();
        const nsInit = nsProp.getInitializer();
        if (!nsInit || !Node.isObjectLiteralExpression(nsInit)) {
            continue;
        }

        for (const msgProp of nsInit.getProperties()) {
            if (!Node.isPropertyAssignment(msgProp)) {
                continue;
            }
            const messageKey = msgProp.getName();
            const fullPath = `${namespace}.${messageKey}`;
            const msgInit = msgProp.getInitializer();
            if (!msgInit) {
                continue;
            }

            const enDefault = defaultsMap.get(fullPath) ?? defaultsMap.get(messageKey);
            if (!enDefault) {
                continue;
            }

            const enKind = typeof enDefault === "object" && "kind" in enDefault ? enDefault.kind : "static";
            const enFragments: readonly string[] =
                typeof enDefault === "object" && "staticFragments" in enDefault
                    ? enDefault.staticFragments
                    : [typeof enDefault === "string" ? enDefault : ""];

            if (Node.isStringLiteral(msgInit) || Node.isNoSubstitutionTemplateLiteral(msgInit)) {
                const val = msgInit.getLiteralText().trim();
                if (isAllowedTechnicalToken(val)) {
                    continue;
                }
                if (isAllowedLocaleCopyException(localeId, fullPath, val)) {
                    continue;
                }
                const enVal = (enFragments[0] ?? "").trim();
                if (enKind === "static" && enVal && val === enVal) {
                    violations.push({
                        category: "copied-english",
                        detail: `Accidental copied English default string for "${fullPath}": "${val}"`,
                        file: filePath,
                        line: msgProp.getStartLineNumber()
                    });
                }
            } else if (Node.isArrowFunction(msgInit) || Node.isFunctionExpression(msgInit)) {
                if (enKind === "function") {
                    const locFragments = extractMeaningfulFragments(msgInit);
                    if (locFragments.length > 0 && enFragments.length > 0) {
                        const copiedFragments = findCopiedFunctionFragments(
                            locFragments,
                            enFragments,
                            localeId,
                            fullPath
                        );
                        if (copiedFragments.length > 0) {
                            violations.push({
                                category: "copied-english",
                                detail: `Accidental copied English function fragment in "${fullPath}": "${copiedFragments.join('", "')}"`,
                                file: filePath,
                                line: msgProp.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }
    }
}

export function auditLocaleMessagesFile(
    filePath: string,
    content?: string,
    englishDefaults?: Map<string, any> | EnglishDefaultDiscoveryResult,
    localeIdOrProject?: string | Project,
    maybeProject?: Project
): LocaleAuditViolation[] {
    let localeId: string | undefined;
    let project: Project;
    if (localeIdOrProject instanceof Project) {
        project = localeIdOrProject;
        localeId = undefined;
    } else {
        localeId = localeIdOrProject;
        project = maybeProject ?? new Project({ useInMemoryFileSystem: true });
    }
    const folderName = basename(dirname(resolve(filePath)));
    const canonicalFromFolder = canonicalizeLocaleId(folderName.replace(/_/g, "-"));
    const effectiveLocaleId = localeId ?? canonicalFromFolder ?? undefined;

    const violations: LocaleAuditViolation[] = [];
    const sourceContent = content ?? readFileSync(filePath, "utf-8");
    const sf = project.createSourceFile(`test-messages-${Date.now()}-${Math.random()}.ts`, sourceContent, {
        overwrite: true
    });

    // 1. Check for forbidden casts: 'as any', 'as never', etc.
    for (const asExpr of sf.getDescendantsOfKind(SyntaxKind.AsExpression)) {
        const typeNode = asExpr.getTypeNode();
        const typeText = typeNode?.getText().trim();
        if (typeText === "any" || typeText === "never") {
            violations.push({
                category: "forbidden-syntax",
                detail: `Forbidden type assertion "as ${typeText}" found in locale catalog`,
                file: filePath,
                line: asExpr.getStartLineNumber()
            });
        } else if (typeText === "MonaLocaleMessages") {
            violations.push({
                category: "completeness-bypass",
                detail: 'Forbidden type assertion "as MonaLocaleMessages" bypasses completeness checking; use "satisfies MonaLocaleMessages"',
                file: filePath,
                line: asExpr.getStartLineNumber()
            });
        } else if (typeText?.includes("DeepPartial")) {
            violations.push({
                category: "completeness-bypass",
                detail: 'Official locale catalog cannot use "DeepPartial<MonaLocaleMessages>"',
                file: filePath,
                line: asExpr.getStartLineNumber()
            });
        }
    }

    // Check TypeAssertionExpression (<any>...)
    for (const typeAssertion of sf.getDescendantsOfKind(SyntaxKind.TypeAssertionExpression)) {
        const typeText = typeAssertion.getTypeNode().getText().trim();
        if (typeText === "any" || typeText === "never") {
            violations.push({
                category: "forbidden-syntax",
                detail: `Forbidden type assertion "<${typeText}>" found in locale catalog`,
                file: filePath,
                line: typeAssertion.getStartLineNumber()
            });
        } else if (typeText === "MonaLocaleMessages") {
            violations.push({
                category: "completeness-bypass",
                detail: 'Forbidden type assertion "<MonaLocaleMessages>" bypasses completeness checking',
                file: filePath,
                line: typeAssertion.getStartLineNumber()
            });
        } else if (typeText.includes("DeepPartial")) {
            violations.push({
                category: "completeness-bypass",
                detail: 'Official locale catalog cannot use "DeepPartial<MonaLocaleMessages>"',
                file: filePath,
                line: typeAssertion.getStartLineNumber()
            });
        }
    }

    // 2. Check for spread assignments (...DEFAULT_MESSAGES)
    for (const spread of sf.getDescendantsOfKind(SyntaxKind.SpreadAssignment)) {
        violations.push({
            category: "completeness-bypass",
            detail: `Forbidden spread assignment "${spread.getText()}" in official locale catalog`,
            file: filePath,
            line: spread.getStartLineNumber()
        });
    }

    // 3. Find exported official messages catalog declaration
    const exportedDecls = sf.getVariableDeclarations().filter(d => d.getVariableStatement()?.isExported());
    const officialMsgDecls = exportedDecls.filter(d => /^[A-Z0-9_]+_MESSAGES$/.test(d.getName()));

    if (officialMsgDecls.length === 0) {
        violations.push({
            category: "completeness-bypass",
            detail: 'Official locale catalog must export an official messages catalog named /^[A-Z0-9_]+_MESSAGES$/',
            file: filePath,
            line: 1
        });
    } else if (officialMsgDecls.length > 1) {
        violations.push({
            category: "completeness-bypass",
            detail: `Official locale catalog must contain exactly one exported official messages catalog, found ${officialMsgDecls.length}`,
            file: filePath,
            line: 1
        });
    } else {
        const decl = officialMsgDecls[0];
        const typeNode = decl.getTypeNode();
        if (typeNode) {
            const typeText = typeNode.getText().trim();
            if (typeText === "any" || typeText === "never") {
                violations.push({
                    category: "forbidden-syntax",
                    detail: `Forbidden type annotation ": ${typeText}" on official message catalog`,
                    file: filePath,
                    line: decl.getStartLineNumber()
                });
            } else if (typeText.includes("DeepPartial")) {
                violations.push({
                    category: "completeness-bypass",
                    detail: 'Official locale catalog cannot use "DeepPartial<MonaLocaleMessages>"',
                    file: filePath,
                    line: decl.getStartLineNumber()
                });
            }
        }

        const init = decl.getInitializer();
        if (!init) {
            violations.push({
                category: "completeness-bypass",
                detail: 'Official locale catalog variable must have an initializer',
                file: filePath,
                line: decl.getStartLineNumber()
            });
        } else if (Node.isSatisfiesExpression(init)) {
            if (init.getTypeNode().getText().trim() !== "MonaLocaleMessages") {
                violations.push({
                    category: "completeness-bypass",
                    detail: `Official locale catalog must satisfy "MonaLocaleMessages", found "${init.getTypeNode().getText()}"`,
                    file: filePath,
                    line: init.getStartLineNumber()
                });
            }
            const innerExpr = init.getExpression();
            if (!Node.isObjectLiteralExpression(innerExpr)) {
                violations.push({
                    category: "completeness-bypass",
                    detail: 'The expression validated by "satisfies MonaLocaleMessages" must be a direct object literal',
                    file: filePath,
                    line: init.getStartLineNumber()
                });
            } else {
                if (englishDefaults && englishDefaults.size > 0) {
                    checkCopiedEnglish(innerExpr, englishDefaults, filePath, violations, effectiveLocaleId);
                }
            }
        } else {
            violations.push({
                category: "completeness-bypass",
                detail: 'Official locale catalog must enforce completeness via "satisfies MonaLocaleMessages"',
                file: filePath,
                line: decl.getStartLineNumber()
            });
        }
    }

    return violations;
}

export function auditLocaleMetadataFile(
    filePath: string,
    content?: string,
    expectedLocaleId?: string,
    expectedMessagesExport?: string,
    expectedMessagesFileOrProject?: string | Project,
    maybeProject?: Project
): LocaleAuditViolation[] {
    let expectedMessagesFile: string | undefined;
    let project: Project;
    if (expectedMessagesFileOrProject instanceof Project) {
        project = expectedMessagesFileOrProject;
        expectedMessagesFile = undefined;
    } else {
        expectedMessagesFile = expectedMessagesFileOrProject;
        project = maybeProject ?? new Project({ useInMemoryFileSystem: true });
    }
    const violations: LocaleAuditViolation[] = [];
    const sourceContent = content ?? readFileSync(filePath, "utf-8");
    const sf = project.createSourceFile(`test-locale-${Date.now()}-${Math.random()}.ts`, sourceContent, {
        overwrite: true
    });

    const exportedDecls = sf.getVariableDeclarations().filter(d => d.getVariableStatement()?.isExported());
    const localeDecls = exportedDecls.filter(d => /^MONA_[A-Z0-9_]+_LOCALE$/.test(d.getName()));

    if (localeDecls.length === 0) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Could not find exported MonaLocale constant matching /^MONA_[A-Z0-9_]+_LOCALE$/',
            file: filePath,
            line: 1
        });
        return violations;
    }

    if (localeDecls.length > 1) {
        violations.push({
            category: "invalid-metadata",
            detail: `Expected exactly one exported official locale constant, found ${localeDecls.length}`,
            file: filePath,
            line: 1
        });
    }

    const decl = localeDecls[0];
    const init = decl.getInitializer();

    if (!init || !Node.isSatisfiesExpression(init)) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Official locale metadata must enforce contract via "satisfies MonaLocale"',
            file: filePath,
            line: decl.getStartLineNumber()
        });
        return violations;
    }

    if (init.getTypeNode().getText().trim() !== "MonaLocale") {
        violations.push({
            category: "invalid-metadata",
            detail: `Official locale metadata must satisfy "MonaLocale", found "${init.getTypeNode().getText()}"`,
            file: filePath,
            line: init.getStartLineNumber()
        });
    }

    const obj = init.getExpression();
    if (!Node.isObjectLiteralExpression(obj)) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Official locale metadata must be an object literal',
            file: filePath,
            line: init.getStartLineNumber()
        });
        return violations;
    }

    // Check id
    const idProp = obj.getProperty("id");
    if (!idProp || !Node.isPropertyAssignment(idProp)) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Locale metadata missing "id" property',
            file: filePath,
            line: obj.getStartLineNumber()
        });
    } else {
        const idInit = idProp.getInitializer();
        if (!idInit || (!Node.isStringLiteral(idInit) && !Node.isNoSubstitutionTemplateLiteral(idInit))) {
            violations.push({
                category: "invalid-metadata",
                detail: 'Locale "id" property must be a string literal',
                file: filePath,
                line: idProp.getStartLineNumber()
            });
        } else {
            const idVal = idInit.getLiteralText().trim();
            const canonical = canonicalizeLocaleId(idVal);
            if (!canonical) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale ID "${idVal}" does not match valid BCP 47 tag format`,
                    file: filePath,
                    line: idProp.getStartLineNumber()
                });
            } else if (idVal !== canonical) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale ID "${idVal}" must be in canonical casing "${canonical}"`,
                    file: filePath,
                    line: idProp.getStartLineNumber()
                });
            } else if (expectedLocaleId && idVal !== expectedLocaleId) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale ID "${idVal}" does not match folder canonical tag "${expectedLocaleId}"`,
                    file: filePath,
                    line: idProp.getStartLineNumber()
                });
            }
        }
    }

    // Check direction
    const dirProp = obj.getProperty("direction");
    if (!dirProp || !Node.isPropertyAssignment(dirProp)) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Locale metadata missing "direction" property',
            file: filePath,
            line: obj.getStartLineNumber()
        });
    } else {
        const dirInit = dirProp.getInitializer();
        if (!dirInit || (!Node.isStringLiteral(dirInit) && !Node.isNoSubstitutionTemplateLiteral(dirInit))) {
            violations.push({
                category: "invalid-metadata",
                detail: 'Locale "direction" property must be "ltr" or "rtl"',
                file: filePath,
                line: dirProp.getStartLineNumber()
            });
        } else {
            const dirVal = dirInit.getLiteralText().trim();
            if (dirVal !== "ltr" && dirVal !== "rtl") {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale direction must be "ltr" or "rtl", found "${dirVal}"`,
                    file: filePath,
                    line: dirProp.getStartLineNumber()
                });
            }
        }
    }

    // Check messages
    const msgProp = obj.getProperty("messages");
    if (!msgProp || !Node.isPropertyAssignment(msgProp)) {
        violations.push({
            category: "invalid-metadata",
            detail: 'Locale metadata missing "messages" property',
            file: filePath,
            line: obj.getStartLineNumber()
        });
    } else {
        const msgInit = msgProp.getInitializer();
        if (!msgInit) {
            violations.push({
                category: "invalid-metadata",
                detail: 'Locale "messages" property must reference sibling messages catalog',
                file: filePath,
                line: msgProp.getStartLineNumber()
            });
        } else if (!Node.isIdentifier(msgInit)) {
            violations.push({
                category: "invalid-metadata",
                detail: `Locale "messages" property must reference an imported sibling messages catalog identifier, found "${msgInit.getText().trim()}"`,
                file: filePath,
                line: msgProp.getStartLineNumber()
            });
        } else {
            const msgIdentifier = msgInit.getText().trim();
            if (expectedMessagesExport && msgIdentifier !== expectedMessagesExport) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale "messages" must reference sibling catalog "${expectedMessagesExport}", found "${msgIdentifier}"`,
                    file: filePath,
                    line: msgProp.getStartLineNumber()
                });
            }

            // Reject local variable shadowing (e.g. const ES_ES_MESSAGES = ...)
            const localShadows = sf.getVariableDeclarations().filter(
                d => d.getName() === msgIdentifier && d !== decl
            );
            if (localShadows.length > 0) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale "messages" references locally shadowed variable "${msgIdentifier}" instead of imported sibling catalog`,
                    file: filePath,
                    line: localShadows[0].getStartLineNumber()
                });
            }

            // Find matching named import
            let matchingNamedImport: {
                importDecl: ReturnType<typeof sf.getImportDeclarations>[number];
                namedImport: ReturnType<ReturnType<typeof sf.getImportDeclarations>[number]["getNamedImports"]>[number];
            } | null = null;

            for (const importDecl of sf.getImportDeclarations()) {
                for (const named of importDecl.getNamedImports()) {
                    const aliasNode = named.getAliasNode();
                    const localName = aliasNode ? aliasNode.getText().trim() : named.getName().trim();
                    if (localName === msgIdentifier) {
                        matchingNamedImport = { importDecl, namedImport: named };
                        break;
                    }
                }
                if (matchingNamedImport) {
                    break;
                }
            }

            if (!matchingNamedImport) {
                violations.push({
                    category: "invalid-metadata",
                    detail: `Locale "messages" identifier "${msgIdentifier}" is not imported from sibling messages catalog`,
                    file: filePath,
                    line: msgProp.getStartLineNumber()
                });
            } else {
                const importedSymbol = matchingNamedImport.namedImport.getName().trim();
                if (importedSymbol !== msgIdentifier) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Locale "messages" imports alias "${matchingNamedImport.namedImport.getText().trim()}" instead of direct export "${msgIdentifier}"`,
                        file: filePath,
                        line: matchingNamedImport.namedImport.getStartLineNumber()
                    });
                }
                if (expectedMessagesExport && importedSymbol !== expectedMessagesExport) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Locale "messages" must import sibling export "${expectedMessagesExport}", found "${importedSymbol}"`,
                        file: filePath,
                        line: matchingNamedImport.namedImport.getStartLineNumber()
                    });
                }

                const moduleSpecifier = matchingNamedImport.importDecl.getModuleSpecifierValue().trim();
                const isRelativeSibling =
                    moduleSpecifier.startsWith("./") &&
                    !moduleSpecifier.slice(2).includes("/") &&
                    !moduleSpecifier.slice(2).includes("\\");

                if (!isRelativeSibling) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Locale messages import "${moduleSpecifier}" must be a direct sibling relative import starting with "./"`,
                        file: filePath,
                        line: matchingNamedImport.importDecl.getStartLineNumber()
                    });
                } else if (!moduleSpecifier.endsWith(".messages") && !moduleSpecifier.endsWith(".messages.ts")) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Locale messages import "${moduleSpecifier}" must refer to a sibling "*.messages" module`,
                        file: filePath,
                        line: matchingNamedImport.importDecl.getStartLineNumber()
                    });
                }

                if (expectedMessagesFile) {
                    const dir = dirname(resolve(filePath));
                    const resolvedImport = resolve(dir, moduleSpecifier).replace(/\.ts$/, "").replace(/\\/g, "/");
                    const resolvedExpected = resolve(expectedMessagesFile).replace(/\.ts$/, "").replace(/\\/g, "/");
                    if (resolvedImport !== resolvedExpected) {
                        violations.push({
                            category: "invalid-metadata",
                            detail: `Locale messages import "${moduleSpecifier}" does not resolve to expected sibling messages file "${expectedMessagesFile}"`,
                            file: filePath,
                            line: matchingNamedImport.importDecl.getStartLineNumber()
                        });
                    }
                }
            }
        }
    }

    return violations;
}

export function auditAllLocales(
    localesDir: string = resolve(process.cwd(), "projects/mona-ui/locales"),
    baseDir: string = resolve(process.cwd(), "projects/mona-ui")
): LocaleAuditViolation[] {
    const discovery = discoverOfficialLocales(localesDir);
    const violations: LocaleAuditViolation[] = [...discovery.violations];

    if (!existsSync(localesDir)) {
        return violations;
    }

    const englishDefaults = loadDefaultEnglishStrings(baseDir);
    violations.push(...englishDefaults.violations);

    for (const descriptor of discovery.locales) {
        violations.push(
            ...auditLocaleMessagesFile(
                descriptor.messagesFile,
                undefined,
                englishDefaults,
                descriptor.canonicalId
            )
        );
        violations.push(
            ...auditLocaleMetadataFile(
                descriptor.localeFile,
                undefined,
                descriptor.canonicalId,
                descriptor.messagesExport,
                descriptor.messagesFile
            )
        );
    }

    return violations;
}

export function runLocaleAudit(): void {
    console.log("==================================================");
    console.log("  Mona UI Official Locales Audit");
    console.log("==================================================");

    const violations = auditAllLocales();

    console.log(`Total locale violations found: ${violations.length}`);
    console.log("--------------------------------------------------");

    if (violations.length > 0) {
        console.error(`\nFAILED: Found ${violations.length} locale quality violation(s):`);
        for (const v of violations) {
            const rel = v.file.replace(/.*projects\/mona-ui\//, "projects/mona-ui/");
            console.error(`  [${v.category}] ${rel}:${v.line} - ${v.detail}`);
        }
        process.exit(1);
    }

    console.log("\nSUCCESS: All official locales satisfy quality rules.");
}

if (
    process.env["VITEST"] !== "true" &&
    process.argv[1] &&
    (process.argv[1].endsWith("audit-locales.ts") || process.argv[1].endsWith("audit-locales.js"))
) {
    runLocaleAudit();
}
