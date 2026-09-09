import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

interface AuditViolation {
    category: "i18n-text" | "i18n-aria" | "rtl-physical-style";
    detail: string;
    file: string;
    line: number;
}

// Patterns for physical CSS and Tailwind classes
const PHYSICAL_TAILWIND_PATTERNS = [
    { regex: /\b(?:[a-z0-9-]+:)*-?m[lr]-[0-9a-z_[\].-]+/g, label: "Physical margin utility (ml-*/mr-* -> ms-*/me-*)" },
    { regex: /\b(?:[a-z0-9-]+:)*-?p[lr]-[0-9a-z_[\].-]+/g, label: "Physical padding utility (pl-*/pr-* -> ps-*/pe-*)" },
    { regex: /\b(?:[a-z0-9-]+:)*-?(?:left|right)-[0-9a-z_[\].-]+/g, label: "Physical position utility (left-*/right-* -> start-*/end-*)" },
    { regex: /\b(?:[a-z0-9-]+:)*border-[lr](?:-[0-9a-z_[\].-]+)?\b/g, label: "Physical border utility (border-l/r -> border-s/e)" },
    { regex: /\b(?:[a-z0-9-]+:)*rounded-[lr](?:-[0-9a-z_[\].-]+)?\b/g, label: "Physical radius utility (rounded-l/r -> rounded-s/e)" },
    { regex: /\b(?:[a-z0-9-]+:)*text-(?:left|right)\b/g, label: "Physical text-align utility (text-left/right -> text-start/end)" }
];

const PHYSICAL_CSS_PATTERNS = [
    { regex: /\bmargin-(?:left|right)\s*:/g, label: "Physical CSS property (margin-left/right -> margin-inline-start/end)" },
    { regex: /\bpadding-(?:left|right)\s*:/g, label: "Physical CSS property (padding-left/right -> padding-inline-start/end)" },
    { regex: /\bborder-(?:left|right)(?:-[a-z]+)?\s*:/g, label: "Physical CSS property (border-left/right -> border-inline-start/end)" },
    { regex: /\btext-align\s*:\s*(?:left|right)\b/g, label: "Physical CSS text-align (left/right -> start/end)" }
];

// Patterns for hard-coded template ARIA and titles
const HARD_CODED_ARIA_PATTERNS = [
    { regex: /\baria-label="([^"{}]+)"/g, label: "Static aria-label attribute" },
    { regex: /\[attr\.aria-label\]="'([^']+)'"/g, label: "Static [attr.aria-label] binding" }
];

function scanFile(filePath: string, violations: AuditViolation[]): void {
    const normalizedPath = filePath.replace(/\\/g, "/");
    // Skip spec files, i18n package itself, and generated files
    if (
        normalizedPath.endsWith(".spec.ts") ||
        normalizedPath.includes("/i18n/") ||
        normalizedPath.includes("component-metadata")
    ) {
        return;
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Skip single-line comments
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            continue;
        }

        // 1. Scan physical styles
        for (const pattern of PHYSICAL_TAILWIND_PATTERNS) {
            const matches = line.match(pattern.regex);
            if (matches) {
                for (const match of matches) {
                    violations.push({
                        category: "rtl-physical-style",
                        detail: `${pattern.label}: "${match}"`,
                        file: normalizedPath,
                        line: lineNumber
                    });
                }
            }
        }

        for (const pattern of PHYSICAL_CSS_PATTERNS) {
            const matches = line.match(pattern.regex);
            if (matches) {
                for (const match of matches) {
                    violations.push({
                        category: "rtl-physical-style",
                        detail: `${pattern.label}: "${match.trim()}"`,
                        file: normalizedPath,
                        line: lineNumber
                    });
                }
            }
        }

        // 2. Scan template ARIA strings (only in HTML files or template strings)
        if (normalizedPath.endsWith(".html")) {
            for (const pattern of HARD_CODED_ARIA_PATTERNS) {
                pattern.regex.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = pattern.regex.exec(line)) !== null) {
                    const text = match[1]?.trim();
                    if (text && !text.startsWith("{{") && !text.startsWith("messages().")) {
                        violations.push({
                            category: "i18n-aria",
                            detail: `${pattern.label}: "${text}"`,
                            file: normalizedPath,
                            line: lineNumber
                        });
                    }
                }
            }
        }
    }
}

function runAudit(): void {
    const isReportMode = process.argv.includes("--report") || process.argv.includes("--baseline");
    const files = globSync("projects/mona-ui/**/*.{ts,html,scss,css}");

    const violations: AuditViolation[] = [];
    for (const file of files) {
        scanFile(resolve(file), violations);
    }

    const physicalViolations = violations.filter(v => v.category === "rtl-physical-style");
    const ariaViolations = violations.filter(v => v.category === "i18n-aria");

    console.log("==================================================");
    console.log("  Mona UI i18n & RTL Readiness Audit Report");
    console.log("==================================================");
    console.log(`Total scanned files: ${files.length}`);
    console.log(`Physical style violations (RTL debt): ${physicalViolations.length}`);
    console.log(`Hard-coded ARIA violations (i18n debt): ${ariaViolations.length}`);
    console.log("--------------------------------------------------");

    if (isReportMode) {
        console.log("\nTop files with physical style violations:");
        const fileCounts = new Map<string, number>();
        for (const v of physicalViolations) {
            const relative = v.file.replace(/.*projects\/mona-ui\//, "");
            fileCounts.set(relative, (fileCounts.get(relative) ?? 0) + 1);
        }
        const sorted = [...fileCounts.entries()].sort((a, b) => b[1] - a[1]);
        for (const [f, count] of sorted.slice(0, 15)) {
            console.log(`  ${f}: ${count}`);
        }

        console.log("\nHard-coded template ARIA violations:");
        for (const v of ariaViolations) {
            const relative = v.file.replace(/.*projects\/mona-ui\//, "");
            console.log(`  ${relative}:${v.line} -> ${v.detail}`);
        }

        console.log("\nAudit baseline report generated successfully.");
        process.exit(0);
    }

    // Default or CI mode: Pager must be 100% clean
    const pagerViolations = violations.filter(v => v.file.includes("/pager/"));
    if (pagerViolations.length > 0) {
        console.error(`\nFAILED: Reference implementation 'pager' contains ${pagerViolations.length} violations:`);
        for (const v of pagerViolations) {
            console.error(`  ${v.file}:${v.line} - ${v.detail}`);
        }
        process.exit(1);
    }

    console.log("Reference implementation 'pager' is 100% clean.");
    console.log("Total migration debt recorded for upcoming phases.");
}

runAudit();
