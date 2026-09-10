import { describe, expect, it } from "vitest";
import { parseTemplate } from "@angular/compiler";
import {
    type AllowlistEntry,
    type AuditViolation,
    collectLiteralStrings,
    isAllowlisted,
    isUserFacingText,
    MANUAL_REVIEW_PATTERNS,
    matchesFilePattern,
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
                detail: expect.stringMatching(/(?:Static|Literal string in) host binding \[attr\.aria-roledescription\]: "carousel"/)
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

        it("detects literal strings inside complex host binding expressions (ternaries, binary expressions)", () => {
            const code = `
                @Component({
                    selector: "test-panel",
                    template: "",
                    host: {
                        "[attr.aria-label]": "open() ? 'Close panel' : 'Open panel'",
                        "[title]": "error() ? 'Retry request' : messages().ready"
                    }
                })
                export class TestPanelComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-panel.component.ts", code, violations);

            expect(violations).toHaveLength(3);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Close panel"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Open panel"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Retry request"))).toBe(true);
        });

        it("ignores host binding expressions using messages() and dynamic expressions without literals", () => {
            const code = `
                @Component({
                    selector: "test-panel",
                    template: "",
                    host: {
                        "[attr.aria-label]": "open() ? messages().close : messages().open",
                        "[title]": "error() ? messages().retry : messages().ready"
                    }
                })
                export class CleanPanelComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("clean-panel.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects double-quoted string literals inside host binding expressions (quote symmetry)", () => {
            const code = `
                @Component({
                    selector: "test-panel",
                    template: "",
                    host: {
                        "[attr.aria-label]": 'open() ? "Close panel" : "Open panel"'
                    }
                })
                export class TestPanelComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-panel.component.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Close panel"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Open panel"))).toBe(true);
        });

        it("detects ampersands and entities inside host binding expressions", () => {
            const code = `
                @Component({
                    selector: "test-panel",
                    template: "",
                    host: {
                        "[title]": 'ready() ? "Ready & waiting" : messages().busy'
                    }
                })
                export class TestPanelComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-panel.component.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining("Ready & waiting")
            });
        });

        it("fails closed with an audit violation when host binding expression is malformed", () => {
            const code = `
                @Component({
                    selector: "test-panel",
                    template: "",
                    host: {
                        "[attr.aria-label]": "open(?"
                    }
                })
                export class TestMalformedPanelComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-malformed-panel.component.ts", code, violations);

            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.detail.includes("Host binding parse error"))).toBe(true);
        });

        it("flags only the hard-coded branch in computed accessibility property with mixed messages() and literals", () => {
            const code = `
                export class PanelComponent {
                    protected readonly ariaLabel = computed(() =>
                        this.expanded() ? "Collapse panel" : this.messages().expandPanel
                    );
                    protected readonly panelAriaLabel = computed(() =>
                        this.expanded() ? this.messages().collapseHeader : \`Open \${this.panelName()}\`
                    );
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-panel.component.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining("Collapse panel")
            });
            expect(violations[1]).toMatchObject({
                category: "i18n-aria",
                detail: expect.stringContaining("Open")
            });
        });

        it("detects conditional and template expressions in semantic object properties", () => {
            const code = `
                export const item1 = {
                    label: enabled ? "Disable feature" : "Enable feature"
                };
                export const item2 = {
                    title: \`Delete \${name}\`
                };
                export const item3 = {
                    message: error ? "Retry request" : messages().ready
                };
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-objects.ts", code, violations);

            expect(violations).toHaveLength(4);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Disable feature"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Enable feature"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Delete"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Retry request"))).toBe(true);
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

        it("detects hard-coded strings in semantic class property declarations (computed, linkedSignal, signal)", () => {
            const code = `
                export class DemoComponent {
                    protected readonly title = computed(() => "Delete item");
                    protected readonly tooltip = linkedSignal(() => "Retry request");
                    protected readonly message = signal("Loading items");
                    protected readonly customPlaceholder = "Search records...";
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("demo.component.ts", code, violations);

            expect(violations).toHaveLength(4);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes('property "title": "Delete item"'))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes('property "tooltip": "Retry request"'))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes('property "message": "Loading items"'))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes('property "customPlaceholder": "Search records..."'))).toBe(true);
        });

        it("ignores semantic class properties using localized messages or dynamic signals", () => {
            const code = `
                export class CleanDemoComponent {
                    protected readonly title = computed(() => this.messages().title);
                    protected readonly tooltip = linkedSignal(() => this.messages().retry);
                    protected readonly message = signal(this.messages().loading);
                    protected readonly ariaLabel = computed(() => this.messages().close);
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("clean-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects hard-coded strings in linkedSignal config object overload", () => {
            const code = `
                export class DemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation: () => "Retry request"
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("demo.component.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0].category).toBe("i18n-text");
            expect(violations[0].detail).toContain('property "tooltip": "Retry request"');
        });

        it("ignores linkedSignal config object overload using localized messages", () => {
            const code = `
                export class CleanDemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation: () => this.messages().retry
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("clean-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects literals inside logical AND expressions and satisfies expressions", () => {
            const code = `
                export class LogicalComponent {
                    protected readonly ariaLabel = computed(() => this.expanded() && "Collapse panel");
                    protected readonly options = {
                        label: this.enabled() && ("Disable feature" satisfies string)
                    };
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("logical.component.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Collapse panel"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Disable feature"))).toBe(true);
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

        it("matches exact canonical file path and rejects similar substrings like .backup or nested duplicate prefixes", () => {
            const pattern = "projects/mona-ui/chart/foo.ts";
            expect(matchesFilePattern("projects/mona-ui/chart/foo.ts", pattern)).toBe(true);
            expect(matchesFilePattern("C:/repo/projects/mona-ui/chart/foo.ts", pattern)).toBe(true);
            expect(matchesFilePattern("projects/mona-ui/chart/foo.ts.backup", pattern)).toBe(false);
            expect(matchesFilePattern("projects/mona-ui/other/projects/mona-ui/chart/foo.ts", pattern)).toBe(false);

            const allowlist: AllowlistEntry[] = [
                {
                    category: "rtl-physical-style",
                    filePattern: "projects/mona-ui/chart/foo.ts",
                    lineSnippet: "[style.left.px]",
                    reason: "Exact match test"
                }
            ];

            const exactViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/chart/foo.ts",
                line: 1
            };
            const backupViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/chart/foo.ts.backup",
                line: 1
            };
            const nestedViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical style",
                file: "projects/mona-ui/other/projects/mona-ui/chart/foo.ts",
                line: 1
            };

            const snippet = '<div [style.left.px]="x"></div>';
            expect(isAllowlisted(exactViolation, snippet, allowlist)).toBe(true);
            expect(isAllowlisted(backupViolation, snippet, allowlist)).toBe(false);
            expect(isAllowlisted(nestedViolation, snippet, allowlist)).toBe(false);
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

        it("fails closed with an audit violation when inline template has syntax errors", () => {
            const code = `
                @Component({
                    selector: "mona-test-malformed",
                    template: \`<div><span></div></span>\`
                })
                export class TestMalformedComponent {}
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-malformed.component.ts", code, violations);

            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.detail.includes("Inline template parse error"))).toBe(true);
        });
    });

    describe("Semantic helper return literal scanning", () => {
        it("detects hard-coded text returned from semantic helper functions", () => {
            const code = `
                function getDefaultTitle() {
                    return "Info";
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-helper.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "i18n-text",
                detail: expect.stringContaining('Hard-coded text returned from semantic helper "getDefaultTitle": "Info"')
            });
        });

        it("detects hard-coded text returned from class methods with semantic names", () => {
            const code = `
                class NotificationHelper {
                    public getCloseTitle(): string {
                        return "Close notification";
                    }
                    public getAriaAnnouncement(): string {
                        return "New notification arrived";
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-helper.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Close notification"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("New notification arrived"))).toBe(true);
        });

        it("ignores predicate methods and technical return values", () => {
            const code = `
                class ChartComponent {
                    public isOutsideLabel(): boolean {
                        const position = "outside";
                        return position === "outside";
                    }
                    public computeLabelTransform(): string {
                        return "translate(0, -50%)";
                    }
                    public getMessage(): string {
                        return messages().messageText;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-chart.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects template expressions returned from semantic helper functions", () => {
            const code = `
                function getAriaLabel(page: number): string {
                    return \`Page \${page}\`;
                }
                function getTitle(name: string): string {
                    return \`Delete \${name}?\`;
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-helper.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Page"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Delete"))).toBe(true);
        });

        it("ignores technical transform helpers returning template expressions", () => {
            const code = `
                class ChartComponent {
                    public computeLabelTransform(x: number): string {
                        return \`translate(\${x}px, 0)\`;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-chart.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects hard-coded text returned from semantic getters (class accessors and object accessors)", () => {
            const code = `
                class ComponentState {
                    public get ariaLabel(): string {
                        return "Close panel";
                    }
                    public get title(): string {
                        return \`Delete \${this.name}\`;
                    }
                }
                const stateObj = {
                    get ariaLabel() {
                        return "Close dialog";
                    }
                };
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-getters.ts", code, violations);

            expect(violations).toHaveLength(3);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Close panel"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Delete"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Close dialog"))).toBe(true);
        });

        it("audits semantic helpers ending in DOM/data entity nouns (Element, Event, Type, Node)", () => {
            const code = `
                function getAriaLabelForElement(el: HTMLElement): string {
                    return "Element label";
                }
                function getMessageForEvent(e: Event): string {
                    return "Event message";
                }
                function getTitleForType(t: string): string {
                    return "Type title";
                }
                function getDescriptionForNode(n: Node): string {
                    return "Node description";
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test-noun-helpers.ts", code, violations);

            expect(violations).toHaveLength(4);
            expect(violations.some(v => v.category === "i18n-aria" && v.detail.includes("Element label"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Event message"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Type title"))).toBe(true);
            expect(violations.some(v => v.category === "i18n-text" && v.detail.includes("Node description"))).toBe(true);
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

        it("validates narrowed spinner keyframe block ranges (triad, ring, converge)", () => {
            const triadViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 68
            };
            const ringViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 120
            };
            const convergeViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 178
            };
            const intermediateViolation1: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 90
            };
            const intermediateViolation2: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 160
            };
            const trailingViolation: AuditViolation = {
                category: "rtl-physical-style",
                detail: "Physical CSS property",
                file: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
                line: 200
            };

            // Using default ALLOWLIST
            expect(isAllowlisted(triadViolation, "left: 0;")).toBe(true);
            expect(isAllowlisted(ringViolation, "left: 73%;")).toBe(true);
            expect(isAllowlisted(convergeViolation, "right: 0;")).toBe(true);

            expect(isAllowlisted(intermediateViolation1, "left: 0;")).toBe(false);
            expect(isAllowlisted(intermediateViolation2, "right: 0;")).toBe(false);
            expect(isAllowlisted(trailingViolation, "left: 0;")).toBe(false);
        });
    });
});
