import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createEditorStyleStrategy, EDITOR_STYLE_STRATEGY, provideEditorStyles } from "./editor.styles";

describe("editor style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createEditorStyleStrategy();

        const mona = strategy.resolve("mona").base();
        const reina = strategy.resolve("reina").base();

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createEditorStyleStrategy([
            {
                base: "provider-editor-base"
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const toolbarClasses = strategy.resolve("mona").toolbar();

        expect(baseClasses).toContain("provider-editor-base");
        expect(toolbarClasses).not.toContain("provider-editor-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createEditorStyleStrategy([
            {
                theme: "reina",
                toolbar: "reina-provider-toolbar"
            }
        ]);

        expect(strategy.resolve("mona").toolbar()).not.toContain("reina-provider-toolbar");
        expect(strategy.resolve("reina").toolbar()).toContain("reina-provider-toolbar");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideEditorStyles({
                    container: "injected-editor-container"
                })
            ]
        });

        const strategy = TestBed.inject(EDITOR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").container()).toContain("injected-editor-container");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideEditorStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            container: () => "replacement-container",
                            fontColorPreview: () => "replacement-font-color-preview",
                            fontColorValue: () => "replacement-font-color-value",
                            fontFamilyDropdownList: () => "replacement-font-family-dropdown-list",
                            fontHighlightPreview: () => "replacement-font-highlight-preview",
                            fontHighlightValue: () => "replacement-font-highlight-value",
                            fontSizeDropdownList: () => "replacement-font-size-dropdown-list",
                            headingsDropdownList: () => "replacement-headings-dropdown-list",
                            imageInserterActions: () => "replacement-image-inserter-actions",
                            imageInserterForm: () => "replacement-image-inserter-form",
                            imageInserterRow: () => "replacement-image-inserter-row",
                            imageInserterRowLabel: () => "replacement-image-inserter-row-label",
                            tableCreator: () => "replacement-table-creator",
                            tableCreatorCell: () => "replacement-table-creator-cell",
                            toolbar: () => "replacement-toolbar"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(EDITOR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
