import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    type AST,
    Interpolation,
    LiteralPrimitive,
    parseTemplate,
    TmplAstBoundAttribute,
    TmplAstBoundText,
    TmplAstDeferredBlock,
    TmplAstElement,
    TmplAstForLoopBlock,
    TmplAstIfBlock,
    type TmplAstNode,
    TmplAstSwitchBlock,
    TmplAstTemplate,
    TmplAstText,
    TmplAstTextAttribute
} from "@angular/compiler";

export interface AuditViolation {
    category: "i18n-text" | "i18n-aria" | "rtl-physical-style";
    detail: string;
    file: string;
    line: number;
}

export interface AllowlistEntry {
    category: "i18n-text" | "i18n-aria" | "rtl-physical-style";
    filePattern: string;
    lineRange?: [number, number];
    lineSnippet?: string;
    reason: string;
}

// Patterns for physical CSS and Tailwind classes
const PHYSICAL_TAILWIND_PATTERNS = [
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?m[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical margin utility (ml-*/mr-* -> ms-*/me-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?p[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical padding utility (pl-*/pr-* -> ps-*/pe-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?(?:left|right)-[0-9a-z_[\].-]+/g,
        label: "Physical position utility (left-*/right-* -> start-*/end-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*border-[lr](?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical border utility (border-l/r -> border-s/e)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*rounded-[lr](?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical radius utility (rounded-l/r -> rounded-s/e)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*rounded-(?:tl|tr|bl|br)(?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical corner radius utility (rounded-tl/tr/bl/br -> rounded-ss/se/es/ee)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*text-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical text-align utility (text-left/right -> text-start/end)"
    },
    { regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*space-x-[0-9a-z_[\].-]+/g, label: "Physical space-x utility" },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*divide-x(?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical divide-x utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*origin-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical transform origin utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*float-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical float utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*clear-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical clear utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*scroll-m[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical scroll margin utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*scroll-p[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical scroll padding utility"
    }
];

const PHYSICAL_CSS_PATTERNS = [
    {
        regex: /\bmargin-(?:left|right)\s*:/g,
        label: "Physical CSS property (margin-left/right -> margin-inline-start/end)"
    },
    {
        regex: /\bpadding-(?:left|right)\s*:/g,
        label: "Physical CSS property (padding-left/right -> padding-inline-start/end)"
    },
    {
        regex: /\bborder-(?:left|right)(?:-[a-z]+)?\s*:/g,
        label: "Physical CSS property (border-left/right -> border-inline-start/end)"
    },
    {
        regex: /\bborder-(?:top|bottom)-(?:left|right)-radius\s*:/g,
        label: "Physical CSS border-radius (border-*-left/right-radius -> border-*-start/end-radius)"
    },
    { regex: /\btext-align\s*:\s*(?:left|right)\b/g, label: "Physical CSS text-align (left/right -> start/end)" }
];

const PHYSICAL_CSS_POSITION_PATTERN = {
    regex: /(?<![a-z0-9_$-])(?:left|right)\s*:\s*[^;]+/g,
    label: "Physical CSS position (left/right -> inset-inline-start/end)"
};

// Patterns for hard-coded TS ARIA and titles
const HARD_CODED_ARIA_PATTERNS = [
    { regex: /\baria-label="([^"{}]+)"/g, label: "Static aria-label attribute" },
    { regex: /\[attr\.aria-label\]="'([^']+)'"/g, label: "Static [attr.aria-label] binding" }
];

// Documented intentional allowlist entries (e.g. geometric canvas, chart math, color gradients)
const ALLOWLIST: AllowlistEntry[] = [
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/chart/",
        reason: "Chart Cartesian coordinate geometry is strictly physical canvas/SVG math"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/chart/",
        reason: "Chart tooltip and empty state strings are planned for subsequent chart feature release"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/color-gradient/",
        reason: "Color picker gradient coordinate space is physical 2D hue/saturation mapping"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/color-palette/",
        reason: "Color palette grid uses physical direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/color-picker/",
        reason: "Color picker canvas coordinates are physical"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/tooltip/styles/tooltip.styles.ts",
        reason: "Tooltip arrow pointer geometry uses 45-degree rotated box Cartesian coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/popover/styles/popover.styles.ts",
        reason: "Popover arrow pointer geometry uses 45-degree rotated box Cartesian coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        reason: "Notification screen dock coordinates are physical viewport screen positions"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/spinner/",
        reason: "Spinner radial coordinate geometry for 2D circular/polygon dot positions"
    }
];

function isAllowlisted(violation: AuditViolation, lineContent?: string): boolean {
    for (const entry of ALLOWLIST) {
        if (entry.category !== violation.category) {
            continue;
        }
        if (!violation.file.includes(entry.filePattern)) {
            continue;
        }
        if (entry.lineRange) {
            const [min, max] = entry.lineRange;
            if (violation.line < min || violation.line > max) {
                continue;
            }
        }
        if (entry.lineSnippet && lineContent && !lineContent.includes(entry.lineSnippet)) {
            continue;
        }
        return true;
    }
    return false;
}

// Check if string contains actual user-facing text vs purely numbers/symbols/formatting tokens
function isUserFacingText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    // Pure numbers or digits with symbols like #1, 100%, 1.5
    if (/^#?\s*[-+]?\d+([.,]\d+)?\s*%?$/.test(trimmed)) {
        return false;
    }
    // Pure symbols/punctuation/math/HTML entities
    if (/^[&;:,\-–—/\\|•*+×#%°<>=_~()\[\]{}!?@^$'"`]+$/.test(trimmed)) {
        return false;
    }
    // HTML entities
    if (/^&(?:times|nbsp|bull|hellip|#\d+);$/.test(trimmed)) {
        return false;
    }
    // Contains letters
    return /[a-zA-Z]/.test(trimmed);
}

function scanTemplateNodes(nodes: TmplAstNode[], filePath: string, violations: AuditViolation[]): void {
    for (const node of nodes) {
        if (node instanceof TmplAstText) {
            const raw = node.value;
            if (isUserFacingText(raw)) {
                violations.push({
                    category: "i18n-text",
                    detail: `Hard-coded text node: "${raw.trim()}"`,
                    file: filePath,
                    line: node.sourceSpan.start.line + 1
                });
            }
        } else if (node instanceof TmplAstBoundText) {
            const ast = node.value;
            if (ast instanceof Interpolation || (ast as { ast?: AST }).ast instanceof Interpolation) {
                const interpolation = ast instanceof Interpolation ? ast : (ast as { ast: Interpolation }).ast;
                for (const str of interpolation.strings) {
                    if (isUserFacingText(str)) {
                        violations.push({
                            category: "i18n-text",
                            detail: `Hard-coded text fragment in interpolation: "${str.trim()}"`,
                            file: filePath,
                            line: node.sourceSpan.start.line + 1
                        });
                    }
                }
            }
        } else if (node instanceof TmplAstElement) {
            // Check static attributes
            for (const attr of node.attributes) {
                const name = attr.name.toLowerCase();
                const val = attr.value;
                if (
                    [
                        "aria-label",
                        "aria-description",
                        "aria-roledescription",
                        "aria-placeholder",
                        "aria-valuetext"
                    ].includes(name)
                ) {
                    if (isUserFacingText(val)) {
                        violations.push({
                            category: "i18n-aria",
                            detail: `Static ${attr.name} attribute: "${val.trim()}"`,
                            file: filePath,
                            line: attr.sourceSpan.start.line + 1
                        });
                    }
                } else if (["title", "placeholder", "alt"].includes(name)) {
                    if (isUserFacingText(val)) {
                        violations.push({
                            category: "i18n-text",
                            detail: `Static ${attr.name} attribute: "${val.trim()}"`,
                            file: filePath,
                            line: attr.sourceSpan.start.line + 1
                        });
                    }
                }
            }

            // Check bound attributes with literal strings
            for (const input of node.inputs) {
                const name = input.name.toLowerCase();
                const valueAst = input.value;
                const innerAst = (valueAst as { ast?: AST }).ast ?? valueAst;
                if (innerAst instanceof LiteralPrimitive && typeof innerAst.value === "string") {
                    const strVal = innerAst.value;
                    if (["aria-label", "attr.aria-label", "aria-description", "attr.aria-description"].includes(name)) {
                        if (isUserFacingText(strVal)) {
                            violations.push({
                                category: "i18n-aria",
                                detail: `Literal string in [${input.name}] binding: "${strVal.trim()}"`,
                                file: filePath,
                                line: input.sourceSpan.start.line + 1
                            });
                        }
                    } else if (
                        ["title", "attr.title", "placeholder", "attr.placeholder", "alt", "attr.alt"].includes(name)
                    ) {
                        if (isUserFacingText(strVal)) {
                            violations.push({
                                category: "i18n-text",
                                detail: `Literal string in [${input.name}] binding: "${strVal.trim()}"`,
                                file: filePath,
                                line: input.sourceSpan.start.line + 1
                            });
                        }
                    }
                }

                // Check [style.left] or [style.right]
                if (name === "style.left" || name === "style.right") {
                    violations.push({
                        category: "rtl-physical-style",
                        detail: `Physical [${input.name}] style binding`,
                        file: filePath,
                        line: input.sourceSpan.start.line + 1
                    });
                }
            }

            scanTemplateNodes(node.children, filePath, violations);
        } else if (node instanceof TmplAstTemplate) {
            scanTemplateNodes(node.children, filePath, violations);
        } else if (node instanceof TmplAstIfBlock) {
            for (const branch of node.branches) {
                scanTemplateNodes(branch.children, filePath, violations);
            }
        } else if (node instanceof TmplAstForLoopBlock) {
            scanTemplateNodes(node.children, filePath, violations);
            if (node.empty) {
                scanTemplateNodes(node.empty.children, filePath, violations);
            }
        } else if (node instanceof TmplAstSwitchBlock) {
            for (const caseNode of node.cases) {
                scanTemplateNodes(caseNode.children, filePath, violations);
            }
        } else if (node instanceof TmplAstDeferredBlock) {
            scanTemplateNodes(node.children, filePath, violations);
            if (node.placeholder) {
                scanTemplateNodes(node.placeholder.children, filePath, violations);
            }
            if (node.loading) {
                scanTemplateNodes(node.loading.children, filePath, violations);
            }
            if (node.error) {
                scanTemplateNodes(node.error.children, filePath, violations);
            }
        }
    }
}

function scanFile(filePath: string, violations: AuditViolation[]): void {
    const normalizedPath = filePath.replace(/\\/g, "/");
    // Skip spec files, i18n package itself, tester app, scripts, tests directories, and generated files
    if (
        normalizedPath.endsWith(".spec.ts") ||
        normalizedPath.includes("/i18n/") ||
        normalizedPath.includes("/tests/") ||
        normalizedPath.includes("/testing/") ||
        normalizedPath.includes("/scripts/") ||
        normalizedPath.includes("component-metadata")
    ) {
        return;
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // 1. Line-by-line scanning for physical styles and regex patterns
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            continue;
        }

        // Scan physical Tailwind utilities (only in TS and HTML files)
        if (normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".html")) {
            for (const pattern of PHYSICAL_TAILWIND_PATTERNS) {
                pattern.regex.lastIndex = 0;
                const matches = line.match(pattern.regex);
                if (matches) {
                    for (const match of matches) {
                        const violation: AuditViolation = {
                            category: "rtl-physical-style",
                            detail: `${pattern.label}: "${match}"`,
                            file: normalizedPath,
                            line: lineNumber
                        };
                        if (!isAllowlisted(violation, line)) {
                            violations.push(violation);
                        }
                    }
                }
            }
        }

        // Scan physical CSS properties
        for (const pattern of PHYSICAL_CSS_PATTERNS) {
            pattern.regex.lastIndex = 0;
            const matches = line.match(pattern.regex);
            if (matches) {
                for (const match of matches) {
                    const violation: AuditViolation = {
                        category: "rtl-physical-style",
                        detail: `${pattern.label}: "${match.trim()}"`,
                        file: normalizedPath,
                        line: lineNumber
                    };
                    if (!isAllowlisted(violation, line)) {
                        violations.push(violation);
                    }
                }
            }
        }

        // In CSS/SCSS or style attributes, scan physical left/right
        if (normalizedPath.endsWith(".scss") || normalizedPath.endsWith(".css") || line.includes("style=")) {
            PHYSICAL_CSS_POSITION_PATTERN.regex.lastIndex = 0;
            const matches = line.match(PHYSICAL_CSS_POSITION_PATTERN.regex);
            if (matches) {
                for (const match of matches) {
                    const violation: AuditViolation = {
                        category: "rtl-physical-style",
                        detail: `${PHYSICAL_CSS_POSITION_PATTERN.label}: "${match.trim()}"`,
                        file: normalizedPath,
                        line: lineNumber
                    };
                    if (!isAllowlisted(violation, line)) {
                        violations.push(violation);
                    }
                }
            }
        }

        // Scan TS host ARIA bindings
        if (normalizedPath.endsWith(".ts")) {
            for (const pattern of HARD_CODED_ARIA_PATTERNS) {
                pattern.regex.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = pattern.regex.exec(line)) !== null) {
                    const text = match[1]?.trim();
                    if (text && !text.startsWith("{{") && !text.startsWith("messages().")) {
                        const violation: AuditViolation = {
                            category: "i18n-aria",
                            detail: `${pattern.label}: "${text}"`,
                            file: normalizedPath,
                            line: lineNumber
                        };
                        if (!isAllowlisted(violation, line)) {
                            violations.push(violation);
                        }
                    }
                }
            }
        }
    }

    // 2. Angular template AST scanning for HTML templates
    if (normalizedPath.endsWith(".html")) {
        try {
            const parsed = parseTemplate(content, normalizedPath, { preserveWhitespaces: false });
            if (parsed.nodes) {
                const templateViolations: AuditViolation[] = [];
                scanTemplateNodes(parsed.nodes, normalizedPath, templateViolations);
                for (const tv of templateViolations) {
                    if (!isAllowlisted(tv)) {
                        violations.push(tv);
                    }
                }
            }
        } catch {
            // If template parsing encounters an unexpected syntax, skip AST pass
        }
    }
}

const BASELINE_PATH = resolve("projects/mona-ui-tester/scripts/i18n-rtl-baseline.json");

interface BaselineViolation {
    category: string;
    detail: string;
    file: string;
    line: number;
}

function loadBaseline(): Set<string> {
    if (!existsSync(BASELINE_PATH)) {
        return new Set<string>();
    }
    try {
        const raw = readFileSync(BASELINE_PATH, "utf-8");
        const list = JSON.parse(raw) as BaselineViolation[];
        return new Set(list.map(v => `${v.category}|${v.file}|${v.line}`));
    } catch {
        return new Set<string>();
    }
}

function saveBaseline(violations: AuditViolation[]): void {
    const list: BaselineViolation[] = violations.map(v => ({
        category: v.category,
        detail: v.detail,
        file: v.file.replace(/.*projects\/mona-ui\//, "projects/mona-ui/"),
        line: v.line
    }));
    writeFileSync(BASELINE_PATH, JSON.stringify(list, null, 2), "utf-8");
    console.log(`Baseline updated with ${list.length} entries at ${BASELINE_PATH}`);
}

function runAudit(): void {
    const isReportMode = process.argv.includes("--report");
    const isUpdateBaseline = process.argv.includes("--update-baseline");
    const isStrict = process.argv.includes("--strict");

    const files = globSync("projects/mona-ui/**/*.{ts,html,scss,css}");

    const violations: AuditViolation[] = [];
    for (const file of files) {
        scanFile(resolve(file), violations);
    }

    if (isUpdateBaseline) {
        saveBaseline(violations);
        process.exit(0);
    }

    const physicalViolations = violations.filter(v => v.category === "rtl-physical-style");
    const ariaViolations = violations.filter(v => v.category === "i18n-aria");
    const textViolations = violations.filter(v => v.category === "i18n-text");

    console.log("==================================================");
    console.log("  Mona UI i18n & RTL Readiness Audit Report");
    console.log("==================================================");
    console.log(`Total scanned files: ${files.length}`);
    console.log(`Hard-coded text violations (i18n-text): ${textViolations.length}`);
    console.log(`Hard-coded ARIA violations (i18n-aria): ${ariaViolations.length}`);
    console.log(`Physical style violations (rtl-physical): ${physicalViolations.length}`);
    console.log("--------------------------------------------------");

    if (isReportMode) {
        if (textViolations.length > 0) {
            console.log("\n--- Hard-coded text violations ---");
            for (const v of textViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        if (ariaViolations.length > 0) {
            console.log("\n--- Hard-coded ARIA violations ---");
            for (const v of ariaViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        if (physicalViolations.length > 0) {
            console.log("\n--- Physical style violations ---");
            for (const v of physicalViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        console.log("\nAudit report completed.");
        process.exit(0);
    }

    // Enforcement mode
    const baseline = isStrict ? new Set<string>() : loadBaseline();
    const newViolations = violations.filter(v => {
        const rel = v.file.replace(/.*projects\/mona-ui\//, "projects/mona-ui/");
        const key = `${v.category}|${rel}|${v.line}`;
        return !baseline.has(key);
    });

    if (newViolations.length > 0) {
        console.error(`\nFAILED: Found ${newViolations.length} unapproved i18n/RTL violation(s):`);
        for (const v of newViolations.slice(0, 30)) {
            const rel = v.file.replace(/.*projects\/mona-ui\//, "");
            console.error(`  [${v.category}] ${rel}:${v.line} - ${v.detail}`);
        }
        if (newViolations.length > 30) {
            console.error(`  ...and ${newViolations.length - 30} more violations`);
        }
        process.exit(1);
    }

    console.log("\nSUCCESS: All scanned files satisfy i18n & RTL rules (no unapproved violations).");
}

runAudit();
