import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
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
    "AM",
    "PM",
    "AM/PM",
    "px",
    ":",
    "-",
    "+",
    "C",
    "Color",
    "Error"
]);

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

export function areFunctionFragmentsCopied(localeFragments: readonly string[], enFragments: readonly string[]): boolean {
    const locClean = localeFragments.map(f => f.trim().toLowerCase()).filter(Boolean);
    const enClean = enFragments.map(f => f.trim().toLowerCase()).filter(Boolean);
    if (enClean.length === 0 || locClean.length === 0) {
        return false;
    }
    return enClean.every(enFrag => locClean.includes(enFrag));
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

export function loadDefaultEnglishStrings(
    baseDir: string = resolve(process.cwd(), "projects/mona-ui"),
    project: Project = new Project({ useInMemoryFileSystem: true })
): Map<string, DefaultMessageFingerprint> {
    const defaultFiles = findDefaultMessageFiles(baseDir);
    const defaults = new Map<string, DefaultMessageFingerprint>();

    for (const file of defaultFiles) {
        const content = readFileSync(file, "utf-8");
        const sf = project.createSourceFile(`default-${Date.now()}-${Math.random()}.ts`, content, { overwrite: true });

        // Determine namespace
        let detectedNamespace: MonaMessageNamespace | null = null;
        for (const decl of sf.getVariableDeclarations()) {
            const typeText = decl.getTypeNode()?.getText() ?? decl.getInitializer()?.asKind(SyntaxKind.SatisfiesExpression)?.getTypeNode().getText();
            if (typeText) {
                detectedNamespace = typeNameToNamespace(typeText);
                if (detectedNamespace) {
                    break;
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
                if (MONA_MESSAGE_NAMESPACES.includes(camel as MonaMessageNamespace)) {
                    detectedNamespace = camel as MonaMessageNamespace;
                }
            }
        }

        if (!detectedNamespace) {
            continue;
        }

        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop)) {
                    const key = prop.getName();
                    const fullPath = `${detectedNamespace}.${key}`;
                    const init = prop.getInitializer();
                    if (!init) {
                        continue;
                    }

                    if (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init)) {
                        defaults.set(fullPath, {
                            namespace: detectedNamespace,
                            key,
                            kind: "static",
                            staticFragments: [init.getLiteralText()]
                        });
                    } else if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
                        const fragments = extractMeaningfulFragments(init);
                        defaults.set(fullPath, {
                            namespace: detectedNamespace,
                            key,
                            kind: "function",
                            staticFragments: fragments
                        });
                    }
                }
            }
        }
    }

    return defaults;
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
            }
        } catch {
            // handled in file audit
        }

        let localeExport = "";
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
            }
        } catch {
            // handled in file audit
        }

        locales.push({
            folder,
            folderPath,
            canonicalId: canonicalTag,
            messagesFile,
            localeFile,
            messagesExport,
            localeExport
        });
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
        for (const loc of locales) {
            if (loc.localeExport) {
                const regex = new RegExp(`\\b${loc.localeExport}\\b`);
                if (!regex.test(publicApiContent)) {
                    violations.push({
                        category: "invalid-metadata",
                        detail: `Official locale export "${loc.localeExport}" is not exported in public-api.ts`,
                        file: publicApiPath,
                        line: 1
                    });
                }
            }
        }
    }

    return { locales, violations };
}

function checkCopiedEnglish(
    catalogObj: Node,
    englishDefaults: Map<string, any>,
    filePath: string,
    violations: LocaleAuditViolation[]
): void {
    if (!Node.isObjectLiteralExpression(catalogObj)) {
        return;
    }

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

            const enDefault = englishDefaults.get(fullPath) ?? englishDefaults.get(messageKey);
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
                    if (
                        locFragments.length > 0 &&
                        enFragments.length > 0 &&
                        areFunctionFragmentsCopied(locFragments, enFragments)
                    ) {
                        violations.push({
                            category: "copied-english",
                            detail: `Accidental copied English function message for "${fullPath}"`,
                            file: filePath,
                            line: msgProp.getStartLineNumber()
                        });
                    }
                }
            }
        }
    }
}

export function auditLocaleMessagesFile(
    filePath: string,
    content?: string,
    englishDefaults?: Map<string, any>,
    project: Project = new Project({ useInMemoryFileSystem: true })
): LocaleAuditViolation[] {
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
                    checkCopiedEnglish(innerExpr, englishDefaults, filePath, violations);
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
    project: Project = new Project({ useInMemoryFileSystem: true })
): LocaleAuditViolation[] {
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
        } else if (expectedMessagesExport && msgInit.getText().trim() !== expectedMessagesExport) {
            violations.push({
                category: "invalid-metadata",
                detail: `Locale "messages" must reference sibling catalog "${expectedMessagesExport}", found "${msgInit.getText().trim()}"`,
                file: filePath,
                line: msgProp.getStartLineNumber()
            });
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
    if (existsSync(baseDir) && englishDefaults.size === 0) {
        violations.push({
            category: "completeness-bypass",
            detail: `Zero default English message catalogs discovered in ${baseDir}`,
            file: baseDir,
            line: 1
        });
    }

    for (const descriptor of discovery.locales) {
        violations.push(...auditLocaleMessagesFile(descriptor.messagesFile, undefined, englishDefaults));
        violations.push(
            ...auditLocaleMetadataFile(
                descriptor.localeFile,
                undefined,
                descriptor.canonicalId,
                descriptor.messagesExport
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
