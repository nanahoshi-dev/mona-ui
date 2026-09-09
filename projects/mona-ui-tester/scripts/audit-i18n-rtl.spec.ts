import { describe, expect, it } from "vitest";
import { parseTemplate } from "@angular/compiler";
import {
    type AllowlistEntry,
    type AuditViolation,
    collectLiteralStrings,
    isAllowlisted,
    isUserFacingText,
    MANUAL_REVIEW_PATTERNS,
    scanFileContent,
    scanTemplateNodes,
    scanTypeScriptAst
} from "./audit-i18n-rtl";

describe("audit-i18n-rtl", () => {
    describe("isUserFacingText", () => {
        it("returns true for natural language text across multiple scripts (Unicode-aware)", () => {
            expect(isUserFacingText("Hello world")).toBe(true);
            expect(isUserFacingText("Button group")).toBe(true);
            expect(isUserFacingText("Enter the URL")).toBe(true);
            expect(isUserFacingText("Türkçe")).toBe(true);
            expect(isUserFacingText("العربية")).toBe(true);
            expect(isUserFacingText("Русский")).toBe(true);
            expect(isUserFacingText("Ελληνικά")).toBe(true);
            expect(isUserFacingText("日本語")).toBe(true);
            expect(isUserFacingText("中文")).toBe(true);
            expect(isUserFacingText("한국어")).toBe(true);
        });

        it("returns false for pure numbers and symbols", () => {
            expect(isUserFacingText("")).toBe(false);
            expect(isUserFacingText("   ")).toBe(false);
            expect(isUserFacingText("100")).toBe(false);
            expect(isUserFacingText("100%")).toBe(false);
            expect(isUserFacingText("-12.5")).toBe(false);
            expect(isUserFacingText("#1")).toBe(false);
            expect(isUserFacingText("١٢٣")).toBe(false);
            expect(isUserFacingText("۱۲۳%")).toBe(false);
            expect(isUserFacingText("&times;")).toBe(false);
            expect(isUserFacingText("&nbsp;")).toBe(false);
            expect(isUserFacingText("->")).toBe(false);
            expect(isUserFacingText("/")).toBe(false);
        });
    });

    describe("TypeScript AST scanning", () => {
        it("detects hard-coded semantic object properties like { text: 'UNLOCALIZED TEST' }", () => {
            const code = `
                export const items = [
                    { text: "UNLOCALIZED TEST", value: 1 }
                ];
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Hard-coded literal property "text": "UNLOCALIZED TEST"')
            });
        });

        it("detects static host ARIA bindings like [attr.aria-roledescription]: 'carousel'", () => {
            const code = `
                @Component({
                    selector: "test-carousel",
                    template: "",
                    host: {
                        "[attr.aria-roledescription]": "'carousel'",
                        "[attr.aria-label]": "ariaLabel()"
                    }
                })
                export class TestCarouselComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Static host binding [attr.aria-roledescription]: "carousel"')
            });
        });

        it("ignores dynamic host bindings calling signals/methods", () => {
            const code = `
                @Component({
                    selector: "test-comp",
                    template: "",
                    host: {
                        "[attr.aria-label]": "ariaLabel() || messages().breadcrumb",
                        "[attr.title]": "railTitle()"
                    }
                })
                export class TestComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores technical tokens in object properties", () => {
            const code = `
                export const operators = [
                    { label: "horizontal", text: "contains" },
                    { text: "eq", label: "start" },
                    { text: "button" }
                ];
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects hard-coded strings in accessibility computed properties", () => {
            const code = `
                export class LegendComponent {
                    protected readonly legendAriaLabel = computed(() => {
                        return "Chart legend";
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Hard-coded text in accessibility property "legendAriaLabel": "Chart legend"')
            });
        });

        it("detects indirect DOMRect.left / right coordinate access", () => {
            const code = `
                function getPosition(el: HTMLElement) {
                    const rect = el.getBoundingClientRect();
                    return rect.left + 10;
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-manual-review",
                detail: expect.stringContaining('Manual review: indirect DOMRect.left access via "rect.left"')
            });
        });

        it("detects destructured DOMRect.left from getBoundingClientRect()", () => {
            const code = `
                function getPosition(el: HTMLElement) {
                    const { left } = el.getBoundingClientRect();
                    return left;
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-manual-review",
                detail: expect.stringContaining("Manual review: destructured DOMRect.left from getBoundingClientRect()")
            });
        });
    });

    describe("HTML Template AST scanning", () => {
        it("detects unlocalized button text", () => {
            const html = `<button>UNLOCALIZED TEST</button>`;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Hard-coded text node: "UNLOCALIZED TEST"')
            });
        });

        it("detects static aria-label attributes", () => {
            const html = `<div aria-label="Close dialog"></div>`;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Static aria-label attribute: "Close dialog"')
            });
        });

        it("detects bound literal accessibility attributes across all ARIA text attributes", () => {
            const html = `
                <div [attr.aria-roledescription]="'carousel'"></div>
                <div [attr.aria-valuetext]="'Loading'"></div>
                <div [aria-placeholder]="'Search'"></div>
                <div [attr.title]="'Information'"></div>
            `;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(4);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Literal string in [aria-roledescription] binding: "carousel"')
            });
            expect(violations[1]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Literal string in [aria-valuetext] binding: "Loading"')
            });
            expect(violations[2]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Literal string in [aria-placeholder] binding: "Search"')
            });
            expect(violations[3]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Literal string in [title] binding: "Information"')
            });
        });

        it("detects physical [style.left] style bindings", () => {
            const html = `<div [style.left.px]="10"></div>`;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining("Physical [style.left.px] style binding")
            });
        });

        it("flags template parse failures when template has syntax errors", () => {
            const malformedHtml = `<div><span></div></span>`;
            const parsed = parseTemplate(malformedHtml, "malformed.html");
            expect(parsed.errors).toBeDefined();
            expect(parsed.errors!.length).toBeGreaterThan(0);
        });
    });

    describe("Allowlist matching", () => {
        const customAllowlist: AllowlistEntry[] = [
            {
                category: "rtl-physical-style",
                filePattern: "chart/components/chart/chart.component.html",
                lineSnippet: "[style.left.px]",
                reason: "Cartesian chart scene overlay position"
            }
        ];

        it("suppresses violation only when lineSnippet matches", () => {
            const matchViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/chart/components/chart/chart.component.html",
                line: 10
            };
            const matchingLine = '<div [style.left.px]="x"></div>';
            expect(isAllowlisted(matchViolation, matchingLine, customAllowlist)).toBe(true);

            const nonMatchingLine = '<div class="ml-4"></div>';
            expect(isAllowlisted(matchViolation, nonMatchingLine, customAllowlist)).toBe(false);
        });

        it("does not suppress violation when lineContent is missing if lineSnippet is required", () => {
            const matchViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/chart/components/chart/chart.component.html",
                line: 10
            };
            expect(isAllowlisted(matchViolation, undefined, customAllowlist)).toBe(false);
        });

        it("does not suppress violations in other files", () => {
            const otherViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/other/other.component.html",
                line: 10
            };
            const line = '<div [style.left.px]="x"></div>';
            expect(isAllowlisted(otherViolation, line, customAllowlist)).toBe(false);
        });
    });

    describe("Manual review pattern detection", () => {
        it("detects directional horizontal gradients in CSS and styles", () => {
            const pattern = MANUAL_REVIEW_PATTERNS.find(p => p.label.includes("directional gradient"));
            expect(pattern).toBeDefined();

            expect("linear-gradient(to right, red, blue)".match(pattern!.regex)).not.toBeNull();
            expect("linear-gradient(to left, red, blue)".match(pattern!.regex)).not.toBeNull();
            expect("linear-gradient(to_right, white, transparent)".match(pattern!.regex)).not.toBeNull();
            expect("linear-gradient(90deg, red, blue)".match(pattern!.regex)).not.toBeNull();
            expect("linear-gradient(270deg, red, blue)".match(pattern!.regex)).not.toBeNull();
            // Vertical or diagonal gradients are not flagged as horizontal directional gradients
            expect("linear-gradient(to top, red, blue)".match(pattern!.regex)).toBeNull();
            expect("linear-gradient(135deg, red, blue)".match(pattern!.regex)).toBeNull();
        });

        it("detects physical horizontal translate utility and transforms", () => {
            const translateUtilPattern = MANUAL_REVIEW_PATTERNS.find(p => p.label.includes("translate-x-*"));
            const translateXPattern = MANUAL_REVIEW_PATTERNS.find(p => p.label.includes("translateX"));

            expect(translateUtilPattern).toBeDefined();
            expect(translateXPattern).toBeDefined();

            expect("-translate-x-3".match(translateUtilPattern!.regex)).not.toBeNull();
            expect("translate-x-1/2".match(translateUtilPattern!.regex)).not.toBeNull();
            expect("rtl:translate-x-3".match(translateUtilPattern!.regex)).not.toBeNull();
            expect("translate-y-4".match(translateUtilPattern!.regex)).toBeNull();

            expect("translateX(-50%)".match(translateXPattern!.regex)).not.toBeNull();
            expect("translateY(-50%)".match(translateXPattern!.regex)).toBeNull();
        });

        it("scans CSS and SCSS files through scanFileContent for directional gradients and translateX", () => {
            const cssContent = `
                .header-gradient {
                    background: linear-gradient(to right, #fff, #000);
                }
                .slide-item {
                    transform: translateX(10px);
                }
            `;
            const violations: AuditViolation[] = [];
            scanFileContent("projects/mona-ui/test/test.component.css", cssContent, violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "rtl-manual-review",
                detail: expect.stringContaining("directional gradient"),
                line: 3
            });
            expect(violations[1]).toMatchObject({
                category: "rtl-manual-review",
                detail: expect.stringContaining("translateX"),
                line: 6
            });

            const scssContent = `
                .badge-track {
                    background: linear-gradient(90deg, red, blue);
                }
            `;
            const scssViolations: AuditViolation[] = [];
            scanFileContent("projects/mona-ui/test/test.component.scss", scssContent, scssViolations);
            expect(scssViolations).toHaveLength(1);
            expect(scssViolations[0]).toMatchObject({
                category: "rtl-manual-review",
                detail: expect.stringContaining("directional gradient")
            });
        });
    });

    describe("Nested Angular expression AST traversal", () => {
        it("detects hard-coded strings in ternary conditional expressions inside interpolations", () => {
            const html = `<div>{{ active ? 'Active' : 'Inactive' }}</div>`;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Hard-coded text in interpolation expression: "Active"')
            });
            expect(violations[1]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Hard-coded text in interpolation expression: "Inactive"')
            });
        });

        it("detects hard-coded strings in binary expressions and ternaries in ARIA bindings", () => {
            const html = `
                <button [attr.aria-label]="isExpanded ? 'Collapse panel' : 'Expand panel'"></button>
                <div [attr.title]="'Details: ' + title"></div>
            `;
            const parsed = parseTemplate(html, "test.html");
            const violations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, "test.html", violations);

            expect(violations).toHaveLength(3);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Literal string in [aria-label] binding: "Collapse panel"')
            });
            expect(violations[1]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining('Literal string in [aria-label] binding: "Expand panel"')
            });
            expect(violations[2]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Literal string in [title] binding: "Details:"')
            });
        });

        it("collects nested literal strings with collectLiteralStrings helper", () => {
            const html = `{{ a ? (b ? 'One' : 'Two') : 'Three' }}`;
            const parsed = parseTemplate(html, "test.html");
            const boundText = parsed.nodes[0] as unknown as { value: unknown };
            const literals = collectLiteralStrings(boundText.value);

            expect(literals).toContain("One");
            expect(literals).toContain("Two");
            expect(literals).toContain("Three");
        });
    });

    describe("Inline @Component template scanning", () => {
        it("detects hard-coded text and ARIA strings inside inline Component templates", () => {
            const code = `
                @Component({
                    selector: "mona-test-inline",
                    template: \`
                        <div class="header">
                            <span>Unlocalized inline label</span>
                            <button [attr.aria-label]="'Inline close button'"></button>
                        </div>
                    \`
                })
                export class TestInlineComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-inline.component.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Unlocalized inline label"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Inline close button"))).toBe(true);
        });
    });

    describe("Allowlist lineRange matching", () => {
        const rangeAllowlist: AllowlistEntry[] = [
            {
                category: "rtl-physical-style",
                filePattern: "spinner/components/spinner/spinner.component.css",
                lineRange: [60, 190],
                reason: "Spinner radial keyframe dot positions"
            }
        ];

        it("suppresses violations falling within lineRange and preserves outside", () => {
            const insideViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 100
            };
            expect(isAllowlisted(insideViolation, "left: 39%;", rangeAllowlist)).toBe(true);

            const outsideViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 210
            };
            expect(isAllowlisted(outsideViolation, "left: 10px;", rangeAllowlist)).toBe(false);
        });
    });
});
