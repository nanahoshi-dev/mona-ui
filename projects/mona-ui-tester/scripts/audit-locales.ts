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

const BCP47_REGEX = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export function isAllowedTechnicalToken(text: string): boolean {
    const trimmed = text.trim();
    return TECHNICAL_ALLOWLIST.has(trimmed);
}

function findDefaultMessageFiles(dir: string): string[] {
    let results: string[] = [];
    if (!existsSync(dir)) {
        return results;
    }
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            results = results.concat(findDefaultMessageFiles(full));
        } else if (entry.endsWith(".default-messages.ts")) {
            results.push(full);
        }
    }
    return results;
}

export function loadDefaultEnglishStrings(
    baseDir: string = resolve(process.cwd(), "projects/mona-ui"),
    project: Project = new Project({ useInMemoryFileSystem: true })
): Map<string, string> {
    const defaultFiles = findDefaultMessageFiles(baseDir);
    const defaults = new Map<string, string>();

    for (const file of defaultFiles) {
        const content = readFileSync(file, "utf-8");
        const sf = project.createSourceFile(`default-${Date.now()}-${Math.random()}.ts`, content, { overwrite: true });

        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop)) {
                    const name = prop.getName();
                    const init = prop.getInitializer();
                    if (init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) {
                        defaults.set(name, init.getLiteralText());
                    }
                }
            }
        }
    }

    return defaults;
}

export function auditLocaleMessagesFile(
    filePath: string,
    content?: string,
    englishDefaults?: Map<string, string>,
    project: Project = new Project({ useInMemoryFileSystem: true })
): LocaleAuditViolation[] {
    const violations: LocaleAuditViolation[] = [];
    const sourceContent = content ?? readFileSync(filePath, "utf-8");
    const sf = project.createSourceFile(`test-messages-${Date.now()}-${Math.random()}.ts`, sourceContent, {
        overwrite: true
    });

    // 1. Check for forbidden casts: 'as any'
    for (const asExpr of sf.getDescendantsOfKind(SyntaxKind.AsExpression)) {
        const typeNode = asExpr.getTypeNode();
        const typeText = typeNode?.getText().trim();
        if (typeText === "any") {
            violations.push({
                category: "forbidden-syntax",
                detail: 'Forbidden type assertion "as any" found in locale catalog',
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
        if (typeText === "any") {
            violations.push({
                category: "forbidden-syntax",
                detail: 'Forbidden type assertion "<any>" found in locale catalog',
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

    // 3. Verify top-level exported messages object uses `satisfies MonaLocaleMessages`
    const satisfiesExpressions = sf.getDescendantsOfKind(SyntaxKind.SatisfiesExpression);
    const usesSatisfiesMessages = satisfiesExpressions.some(s => s.getTypeNode().getText().trim() === "MonaLocaleMessages");
    if (!usesSatisfiesMessages) {
        violations.push({
            category: "completeness-bypass",
            detail: 'Official locale catalog must enforce completeness via "satisfies MonaLocaleMessages"',
            file: filePath,
            line: 1
        });
    }

    // 4. Check for exact copied English strings from default catalogs
    if (englishDefaults && englishDefaults.size > 0) {
        // Collect string literals in the messages object
        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop)) {
                    const key = prop.getName();
                    const init = prop.getInitializer();
                    if (init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) {
                        const val = init.getLiteralText().trim();
                        const enDefault = englishDefaults.get(key);
                        if (enDefault !== undefined && enDefault.trim() === val && !isAllowedTechnicalToken(val)) {
                            violations.push({
                                category: "copied-english",
                                detail: `Accidental copied English default string for "${key}": "${val}"`,
                                file: filePath,
                                line: prop.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }
    }

    return violations;
}

export function auditLocaleMetadataFile(
    filePath: string,
    content?: string,
    project: Project = new Project({ useInMemoryFileSystem: true })
): LocaleAuditViolation[] {
    const violations: LocaleAuditViolation[] = [];
    const sourceContent = content ?? readFileSync(filePath, "utf-8");
    const sf = project.createSourceFile(`test-locale-${Date.now()}-${Math.random()}.ts`, sourceContent, {
        overwrite: true
    });

    let foundLocaleObj = false;
    for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
        const idProp = obj.getProperty("id");
        const dirProp = obj.getProperty("direction");
        const messagesProp = obj.getProperty("messages");

        if (idProp && dirProp && messagesProp) {
            foundLocaleObj = true;

            // Check id
            if (Node.isPropertyAssignment(idProp)) {
                const init = idProp.getInitializer();
                if (init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) {
                    const idVal = init.getLiteralText().trim();
                    if (!BCP47_REGEX.test(idVal)) {
                        violations.push({
                            category: "invalid-metadata",
                            detail: `Locale ID "${idVal}" does not match valid BCP 47 tag format`,
                            file: filePath,
                            line: idProp.getStartLineNumber()
                        });
                    }
                } else {
                    violations.push({
                        category: "invalid-metadata",
                        detail: 'Locale "id" property must be a string literal',
                        file: filePath,
                        line: idProp.getStartLineNumber()
                    });
                }
            }

            // Check direction
            if (Node.isPropertyAssignment(dirProp)) {
                const init = dirProp.getInitializer();
                if (init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) {
                    const dirVal = init.getLiteralText().trim();
                    if (dirVal !== "ltr" && dirVal !== "rtl") {
                        violations.push({
                            category: "invalid-metadata",
                            detail: `Locale direction must be "ltr" or "rtl", found "${dirVal}"`,
                            file: filePath,
                            line: dirProp.getStartLineNumber()
                        });
                    }
                } else {
                    violations.push({
                        category: "invalid-metadata",
                        detail: 'Locale "direction" property must be "ltr" or "rtl"',
                        file: filePath,
                        line: dirProp.getStartLineNumber()
                    });
                }
            }
        }
    }

    if (!foundLocaleObj) {
        violations.push({
            category: "invalid-metadata",
            detail: "Could not find valid MonaLocale object with id, direction, and messages properties",
            file: filePath,
            line: 1
        });
    }

    return violations;
}

export function auditAllLocales(
    localesDir: string = resolve(process.cwd(), "projects/mona-ui/locales")
): LocaleAuditViolation[] {
    const violations: LocaleAuditViolation[] = [];
    if (!existsSync(localesDir)) {
        return violations;
    }

    const englishDefaults = loadDefaultEnglishStrings();

    for (const entry of readdirSync(localesDir)) {
        const full = join(localesDir, entry);
        if (statSync(full).isDirectory()) {
            // Check for *.messages.ts
            for (const file of readdirSync(full)) {
                const filePath = join(full, file);
                if (file.endsWith(".messages.ts")) {
                    violations.push(...auditLocaleMessagesFile(filePath, undefined, englishDefaults));
                } else if (file.endsWith(".locale.ts")) {
                    violations.push(...auditLocaleMetadataFile(filePath));
                }
            }
        }
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
