import { describe, expect, it } from "vitest";
import { parseTemplate } from "@angular/compiler";
import {
    type AllowlistEntry,
    type AuditViolation,
    isAllowlisted,
    isUserFacingText,
    scanTemplateNodes,
    scanTypeScriptAst
} from "./audit-i18n-rtl";

describe("audit-i18n-rtl", () => {
    describe("isUserFacingText", () => {
        it("returns true for natural language text", () => {
            expect(isUserFacingText("Hello world")).toBe(true);
            expect(isUserFacingText("Button group")).toBe(true);
            expect(isUserFacingText("Enter the URL")).toBe(true);
        });

        it("returns false for pure numbers and symbols", () => {
            expect(isUserFacingText("")).toBe(false);
            expect(isUserFacingText("   ")).toBe(false);
            expect(isUserFacingText("100")).toBe(false);
            expect(isUserFacingText("100%")).toBe(false);
            expect(isUserFacingText("-12.5")).toBe(false);
            expect(isUserFacingText("#1")).toBe(false);
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
});
