import { describe, expect, it } from "vitest";
import { parseTemplate } from "@angular/compiler";
import {
    type AllowlistEntry,
    type AuditViolation,
    collectLiteralStrings,
    isAllowlisted,
    isPhysicalCssPropertyName,
    isStyleName,
    isUserFacingText,
    MANUAL_REVIEW_PATTERNS,
    matchesFilePattern,
    scanFile,
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

        it("detects hard-coded strings in linkedSignal config object method shorthand", () => {
            const code = `
                export class MethodDemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation() {
                            return "Retry request";
                        }
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("method-demo.component.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0].category).toBe("i18n-text");
            expect(violations[0].detail).toContain('property "tooltip": "Retry request"');
        });

        it("ignores linkedSignal config object method shorthand using localized messages", () => {
            const code = `
                export class CleanMethodDemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation() {
                            return this.messages().retry;
                        }
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("clean-method-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects hard-coded strings in linkedSignal method shorthand with branching", () => {
            const code = `
                export class BranchMethodDemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation() {
                            if (this.error()) {
                                return "Retry request";
                            }
                            return this.messages().ready;
                        }
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("branch-method-demo.component.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0].category).toBe("i18n-text");
            expect(violations[0].detail).toContain('property "tooltip": "Retry request"');
        });

        it("ignores literals in nested arrow functions inside linkedSignal computation", () => {
            const code = `
                export class NestedArrowLinkedSignalComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation() {
                            const helper = () => {
                                return "Nested arrow detail";
                            };
                            return this.messages().ready;
                        }
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("nested-arrow-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores literals in nested concise arrow functions inside semantic method", () => {
            const code = `
                export class NestedConciseArrowComponent {
                    public getLabel(): string {
                        const helper = () => "Do not audit me";
                        return this.messages().label;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("nested-concise-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores literals in nested block-bodied arrow functions inside semantic method", () => {
            const code = `
                export class NestedBlockArrowComponent {
                    public getLabel(): string {
                        const helper = () => {
                            return "Do not audit me either";
                        };
                        return this.messages().label;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("nested-block-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores literals in nested function declarations inside semantic method", () => {
            const code = `
                export class NestedFunctionDeclComponent {
                    public getLabel(): string {
                        function helper(): string {
                            return "Nested only";
                        }
                        return this.messages().label;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("nested-fn-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores literals in nested class methods inside semantic method", () => {
            const code = `
                export class NestedClassMethodComponent {
                    public getLabel(): string {
                        class Helper {
                            value(): string {
                                return "Nested class literal";
                            }
                        }
                        return this.messages().label;
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("nested-class-demo.component.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects literals returned directly by semantic method", () => {
            const code = `
                export class DirectMethodReturnComponent {
                    public getTooltip(): string {
                        return "Missing image";
                    }
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("direct-method-demo.component.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0].category).toBe("i18n-text");
            expect(violations[0].detail).toContain('"getTooltip": "Missing image"');
        });

        it("detects template and conditional fragments in direct linkedSignal computation return", () => {
            const code = `
                export class FragmentMethodDemoComponent {
                    protected readonly tooltip = linkedSignal({
                        source: this.retryState,
                        computation() {
                            return this.isError()
                                ? \`Template: \${this.code()} - Missing item\`
                                : "Fallback label";
                        }
                    });
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("fragment-demo.component.ts", code, violations);

            expect(violations.length).toBeGreaterThanOrEqual(2);
            expect(violations.some(v => v.detail.includes("Missing item"))).toBe(true);
            expect(violations.some(v => v.detail.includes("Fallback label"))).toBe(true);
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

    describe("TypeScript-authored physical CSS styles", () => {
        it("detects physical properties in function returning Partial<CSSStyleDeclaration>", () => {
            const code = `
                function makeStyle(): Partial<CSSStyleDeclaration> {
                    return { left: "10px" };
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style property "left" in style object')
            });
        });

        it("detects physical properties in object with satisfies Partial<CSSStyleDeclaration>", () => {
            const code = `
                const position = 50;
                const s = { right: \`\${position}%\` } satisfies Partial<CSSStyleDeclaration>;
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style property "right" in style object')
            });
        });

        it("detects assignments to styles.left and styles.right on style objects", () => {
            const code = `
                const styles: Partial<CSSStyleDeclaration> = {};
                styles.right = "20%";
                styles.left = "10px";
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style assignment to "right"')
            });
            expect(violations[1]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style assignment to "left"')
            });
        });

        it("detects assignment to element.style.left and this.element.nativeElement.style.right", () => {
            const code = `
                element.style.left = "0";
                this.element.nativeElement.style.right = "0";
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style assignment to "left"')
            });
            expect(violations[1]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style assignment to "right"')
            });
        });

        it("detects Object.assign with element.style", () => {
            const code = `
                Object.assign(element.style, { left: "10px", top: "20px" });
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(1);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style property "left" in style object')
            });
        });

        it("detects physical properties in nested spread inside style object", () => {
            const code = `
                function transform(isRtl: boolean): Partial<CSSStyleDeclaration> {
                    return {
                        position: "absolute",
                        ...(isRtl ? { right: "10%" } : { left: "10%" })
                    };
                }
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations.some(v => v.detail.includes('"right"'))).toBe(true);
            expect(violations.some(v => v.detail.includes('"left"'))).toBe(true);
        });

        it("ignores data bounds, coordinates, and rect objects without style context", () => {
            const code = `
                const bounds = { left: 10, right: 20 };
                const rect = { left: 0, top: 0, width: 100, height: 50 };
                rect.left = 10;
                const point = { left: 5 };
                windowRef.move({ top: 0, left: 0 });
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("ignores CVA variant maps containing left and right keys", () => {
            const code = `
                const variants = cva("base", {
                    variants: {
                        position: {
                            top: "after:top-0",
                            left: "after:left-0",
                            right: "after:right-0"
                        }
                    }
                });
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("allows intentional allowlisted Cartesian and semantic physical styles", () => {
            const violation: AuditViolation = {
                category: "rtl-physical-style",
                detail: 'Physical style assignment to "right"',
                file: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
                line: 20
            };
            expect(isAllowlisted(violation, "styles.right = `${valuePosition}%`;")).toBe(true);
        });

        it("detects physical styles in camelCase style helpers, methods, and properties", () => {
            const code = `
                function makeHandleStyle() {
                    return { left: "10px" };
                }

                class Demo {
                    handleStyle() {
                        return { right: "20%" };
                    }

                    readonly computedHandleStyle = computed(() => ({
                        marginLeft: "4px"
                    }));
                }

                const labelStyles = {
                    paddingRight: "1rem"
                };
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(4);
            expect(violations.some(v => v.detail.includes('"left"'))).toBe(true);
            expect(violations.some(v => v.detail.includes('"right"'))).toBe(true);
            expect(violations.some(v => v.detail.includes('"marginLeft"'))).toBe(true);
            expect(violations.some(v => v.detail.includes('"paddingRight"'))).toBe(true);
        });

        it("ignores non-style objects with coincidental names like lifestyle, styleId, styleTokenName, styleGuideText, and stylesheetMetadata", () => {
            const code = `
                const lifestyle = { left: 10, right: 20 };
                const stylesheetMetadata = { left: "0px", right: "0px" };
                const styleId = { left: "id-1", right: "id-2" };
                const styleTokenName = { left: "token-left", right: "token-right" };
                const styleGuideText = { left: "Guide Left", right: "Guide Right" };
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(0);
        });

        it("detects physical properties written via CSSStyleDeclaration.setProperty()", () => {
            const code = `
                element.style.setProperty("left", "10px");
                styles.setProperty("padding-right", "1rem");
                configuration.setProperty("left", 10);
            `;
            const violations: AuditViolation[] = [];
            scanTypeScriptAst("test.ts", code, violations);

            expect(violations).toHaveLength(2);
            expect(violations[0]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style property "left" in setProperty call')
            });
            expect(violations[1]).toMatchObject({
                category: "rtl-physical-style",
                detail: expect.stringContaining('Physical style property "padding-right" in setProperty call')
            });
        });

        describe("narrowed allowlists and same-file regression guards", () => {
            it("slider.styles.ts: allows orientation-qualified left-0, but rejects unrelated left-0", () => {
                const violation: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical position utility",
                    file: "projects/mona-ui/slider/styles/slider.styles.ts",
                    line: 74
                };
                expect(isAllowlisted(violation, 'data-[orientation="horizontal"]:left-0')).toBe(true);
                expect(isAllowlisted(violation, 'data-[orientation="vertical"]:left-0')).toBe(true);
                expect(isAllowlisted(violation, 'data-[role="unrelated"]:left-0')).toBe(false);
                expect(isAllowlisted(violation, "left-0")).toBe(false);
            });

            it("scroll-view.styles.ts: allows variant key-value left/right-0, but rejects unrelated left/right-0", () => {
                const violationLeft: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical position utility",
                    file: "projects/mona-ui/scroll-view/styles/scroll-view.styles.ts",
                    line: 58
                };
                const violationRight: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical position utility",
                    file: "projects/mona-ui/scroll-view/styles/scroll-view.styles.ts",
                    line: 59
                };
                expect(isAllowlisted(violationLeft, 'left: "left-0"')).toBe(true);
                expect(isAllowlisted(violationRight, 'right: "right-0"')).toBe(true);
                expect(isAllowlisted(violationLeft, 'content: "left-0"')).toBe(false);
                expect(isAllowlisted(violationRight, 'content: "right-0"')).toBe(false);
                expect(isAllowlisted(violationLeft, "left-0")).toBe(false);
            });

            it("sidebar.styles.ts: allows variant rail left: right-0 and right: left-0, but rejects unrelated physical utilities", () => {
                const violation: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical position utility",
                    file: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
                    line: 413
                };
                expect(isAllowlisted(violation, 'left: "right-0"')).toBe(true);
                expect(isAllowlisted(violation, 'right: "left-0"')).toBe(true);
                expect(isAllowlisted(violation, 'other: "right-0"')).toBe(false);
                expect(isAllowlisted(violation, 'other: "left-0"')).toBe(false);
            });

            it("slider.component.html: allows disambiguated left and right handle bindings, rejects cross-matching and unrelated bindings", () => {
                const violation: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical style binding",
                    file: "projects/mona-ui/slider/components/slider/slider.component.html",
                    line: 61
                };

                const leftBinding = `[style.left.%]="orientation() === 'horizontal' && !isRtl() ? handlePosition() : undefined"`;
                const rightBinding = `[style.right.%]="orientation() === 'horizontal' && isRtl() ? handlePosition() : undefined"`;
                const unrelatedLeftBinding = `[style.marginLeft.px]="orientation() === 'horizontal' && !isRtl() ? handlePosition() : undefined"`;
                const unrelatedRightBinding = `[style.marginRight.px]="orientation() === 'horizontal' && isRtl() ? handlePosition() : undefined"`;

                // 1. intended left binding is allowed
                expect(isAllowlisted(violation, leftBinding)).toBe(true);
                // 2. intended right binding is allowed
                expect(isAllowlisted(violation, rightBinding)).toBe(true);
                // 3. an unrelated physical binding with the same condition is rejected
                expect(isAllowlisted(violation, unrelatedLeftBinding)).toBe(false);
                expect(isAllowlisted(violation, unrelatedRightBinding)).toBe(false);

                // Check discrimination: right snippet doesn't match left line snippet
                const rightAllowlistEntry = [
                    {
                        category: "rtl-physical-style" as const,
                        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
                        lineSnippet: '[style.right.%]="orientation() === \'horizontal\' && isRtl() ? handlePosition() : undefined"',
                        reason: "test"
                    }
                ];
                expect(isAllowlisted(violation, leftBinding, rightAllowlistEntry)).toBe(false);

                const leftAllowlistEntry = [
                    {
                        category: "rtl-physical-style" as const,
                        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
                        lineSnippet: '[style.left.%]="orientation() === \'horizontal\' && !isRtl() ? handlePosition() : undefined"',
                        reason: "test"
                    }
                ];
                expect(isAllowlisted(violation, rightBinding, leftAllowlistEntry)).toBe(false);
            });

            it("range-slider.component.html: allows disambiguated primary handle left/right bindings, rejects cross-matching and unrelated", () => {
                const violation: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical style binding",
                    file: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
                    line: 61
                };

                const leftBinding = `[style.left.%]="orientation() === 'horizontal' && !isRtl() ? primaryHandlePosition() : undefined"`;
                const rightBinding = `[style.right.%]="orientation() === 'horizontal' && isRtl() ? primaryHandlePosition() : undefined"`;
                const unrelatedBinding = `[style.paddingLeft.px]="orientation() === 'horizontal' && !isRtl() ? primaryHandlePosition() : undefined"`;

                expect(isAllowlisted(violation, leftBinding)).toBe(true);
                expect(isAllowlisted(violation, rightBinding)).toBe(true);
                expect(isAllowlisted(violation, unrelatedBinding)).toBe(false);

                const rightOnlyEntry = [
                    {
                        category: "rtl-physical-style" as const,
                        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
                        lineSnippet: '[style.right.%]="orientation() === \'horizontal\' && isRtl() ? primaryHandlePosition() : undefined"',
                        reason: "test"
                    }
                ];
                expect(isAllowlisted(violation, leftBinding, rightOnlyEntry)).toBe(false);
            });

            it("range-slider.component.html: allows disambiguated secondary handle left/right bindings, rejects cross-matching and unrelated", () => {
                const violation: AuditViolation = {
                    category: "rtl-physical-style",
                    detail: "Physical style binding",
                    file: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
                    line: 87
                };

                const leftBinding = `[style.left.%]="orientation() === 'horizontal' && !isRtl() ? secondaryHandlePosition() : undefined"`;
                const rightBinding = `[style.right.%]="orientation() === 'horizontal' && isRtl() ? secondaryHandlePosition() : undefined"`;
                const unrelatedBinding = `[style.paddingRight.px]="orientation() === 'horizontal' && isRtl() ? secondaryHandlePosition() : undefined"`;

                expect(isAllowlisted(violation, leftBinding)).toBe(true);
                expect(isAllowlisted(violation, rightBinding)).toBe(true);
                expect(isAllowlisted(violation, unrelatedBinding)).toBe(false);

                const leftOnlyEntry = [
                    {
                        category: "rtl-physical-style" as const,
                        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
                        lineSnippet: '[style.left.%]="orientation() === \'horizontal\' && !isRtl() ? secondaryHandlePosition() : undefined"',
                        reason: "test"
                    }
                ];
                expect(isAllowlisted(violation, rightBinding, leftOnlyEntry)).toBe(false);
            });
        });

        describe("isPhysicalCssPropertyName canonical helper and AST detection", () => {
            it("canonical helper identifies physical properties including borderLeftStyle, borderRightStyle, and hyphenated equivalents", () => {
                // border*style
                expect(isPhysicalCssPropertyName("borderLeftStyle")).toBe(true);
                expect(isPhysicalCssPropertyName("borderRightStyle")).toBe(true);
                expect(isPhysicalCssPropertyName("border-left-style")).toBe(true);
                expect(isPhysicalCssPropertyName("border-right-style")).toBe(true);

                // border*width, border*color
                expect(isPhysicalCssPropertyName("borderLeftWidth")).toBe(true);
                expect(isPhysicalCssPropertyName("borderRightColor")).toBe(true);
                expect(isPhysicalCssPropertyName("border-left-width")).toBe(true);
                expect(isPhysicalCssPropertyName("border-right-color")).toBe(true);

                // margin, padding, left, right
                expect(isPhysicalCssPropertyName("left")).toBe(true);
                expect(isPhysicalCssPropertyName("right")).toBe(true);
                expect(isPhysicalCssPropertyName("marginLeft")).toBe(true);
                expect(isPhysicalCssPropertyName("marginRight")).toBe(true);
                expect(isPhysicalCssPropertyName("padding-left")).toBe(true);
                expect(isPhysicalCssPropertyName("padding-right")).toBe(true);

                // radii
                expect(isPhysicalCssPropertyName("borderTopLeftRadius")).toBe(true);
                expect(isPhysicalCssPropertyName("border-bottom-right-radius")).toBe(true);

                // logical properties are NOT physical
                expect(isPhysicalCssPropertyName("borderInlineStartStyle")).toBe(false);
                expect(isPhysicalCssPropertyName("borderInlineEndStyle")).toBe(false);
                expect(isPhysicalCssPropertyName("border-inline-start-style")).toBe(false);
                expect(isPhysicalCssPropertyName("borderInlineStart")).toBe(false);
                expect(isPhysicalCssPropertyName("borderInlineEnd")).toBe(false);
                expect(isPhysicalCssPropertyName("marginInlineStart")).toBe(false);
                expect(isPhysicalCssPropertyName("padding-inline-end")).toBe(false);
                expect(isPhysicalCssPropertyName("insetInlineStart")).toBe(false);
            });

            it("AST detects borderLeftStyle and borderRightStyle in style objects, assignments, and setProperty calls", () => {
                const code = `
                    const handleStyle = { borderLeftStyle: "solid" };
                    const handleStyles = { borderRightStyle: "none" };
                    styles.borderLeftStyle = "solid";
                    styles["border-right-style"] = "none";
                    element.style.setProperty("border-left-style", "solid");
                `;
                const violations: AuditViolation[] = [];
                scanTypeScriptAst("test.ts", code, violations);

                expect(violations).toHaveLength(5);
                expect(violations.some(v => v.detail.includes('"borderLeftStyle"') && v.detail.includes("style object"))).toBe(true);
                expect(violations.some(v => v.detail.includes('"borderRightStyle"') && v.detail.includes("style object"))).toBe(true);
                expect(violations.some(v => v.detail.includes('"borderLeftStyle"') && v.detail.includes("assignment"))).toBe(true);
                expect(violations.some(v => v.detail.includes('"border-right-style"') && v.detail.includes("assignment"))).toBe(true);
                expect(violations.some(v => v.detail.includes('"border-left-style"') && v.detail.includes("setProperty"))).toBe(true);
            });

            it("AST ignores logical properties and non-style context assignments", () => {
                const code = `
                    const handleStyle = { borderInlineStartStyle: "solid" };
                    configuration.borderLeftStyle = "metadata";
                `;
                const violations: AuditViolation[] = [];
                scanTypeScriptAst("test.ts", code, violations);

                expect(violations).toHaveLength(0);
            });
        });

        describe("isStyleName and stylesheet heuristic narrowing", () => {
            it("treats stylesheet, stylesheetOverrides, and componentStylesheet as style names", () => {
                expect(isStyleName("stylesheet")).toBe(true);
                expect(isStyleName("stylesheetOverrides")).toBe(true);
                expect(isStyleName("componentStylesheet")).toBe(true);
                expect(isStyleName("myStyleSheet")).toBe(true);
            });

            it("treats metadata, tokens, and guides as non-style names", () => {
                expect(isStyleName("stylesheetMetadata")).toBe(false);
                expect(isStyleName("styleId")).toBe(false);
                expect(isStyleName("styleTokenName")).toBe(false);
                expect(isStyleName("styleGuideText")).toBe(false);
                expect(isStyleName("lifestyle")).toBe(false);
            });

            it("AST detects physical properties in stylesheet and stylesheetOverrides objects, but ignores stylesheetMetadata", () => {
                const positiveCode = `
                    const stylesheet = { left: "10px" };
                    const stylesheetOverrides = { paddingRight: "8px" };
                `;
                const posViolations: AuditViolation[] = [];
                scanTypeScriptAst("test.ts", positiveCode, posViolations);

                expect(posViolations).toHaveLength(2);
                expect(posViolations.some(v => v.detail.includes('"left"'))).toBe(true);
                expect(posViolations.some(v => v.detail.includes('"paddingRight"'))).toBe(true);

                const negativeCode = `
                    const stylesheetMetadata = { left: "column-name" };
                `;
                const negViolations: AuditViolation[] = [];
                scanTypeScriptAst("test.ts", negativeCode, negViolations);

                expect(negViolations).toHaveLength(0);
            });
        });
    });

    describe("scanFile path filtering", () => {
        it("skips files in /locales/ directory", () => {
            const violations: AuditViolation[] = [];
            scanFile("projects/mona-ui/locales/es-es/es-es.messages.ts", violations);
            expect(violations).toHaveLength(0);
        });

        it("skips files in /i18n/ directory", () => {
            const violations: AuditViolation[] = [];
            scanFile("projects/mona-ui/i18n/models/mona-locale.ts", violations);
            expect(violations).toHaveLength(0);
        });
    });
});
