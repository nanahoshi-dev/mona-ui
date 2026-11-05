import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { Editor } from "@tiptap/core";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import { EditorImageInserterComponent } from "../components/editor-image-inserter/editor-image-inserter.component";
import { EditorTableCreatorComponent } from "../components/editor-table-creator/editor-table-creator.component";
import type { EditorSettings } from "../models/EditorSettings";
import type { EditorTableInsertEvent } from "../models/EditorTableInsertEvent";
import { EditorService } from "../services/editor.service";
import { normalizeLinkUrl } from "../utils/linkUrl";

@Component({
    template: `
        <label id="editor-label">Notes</label>
        <p id="editor-hint">Markdown isn't supported.</p>
        <mona-editor
            [settings]="settings()"
            [disabled]="disabled()"
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledBy()"
            [aria-describedby]="ariaDescribedBy()"
            [placeholder]="placeholder()"
            [(value)]="value"></mona-editor>
    `,
    imports: [EditorComponent]
})
class ToolbarHostComponent {
    public readonly ariaDescribedBy = signal("");
    public readonly ariaLabel = signal("");
    public readonly ariaLabelledBy = signal("");
    public readonly disabled = signal(false);
    public readonly placeholder = signal("");
    public readonly settings = signal<Partial<EditorSettings>>({});
    public readonly value = signal("");
}

@Component({
    template: `<mona-editor-table-creator (insert)="inserted.push($event)"></mona-editor-table-creator>`,
    imports: [EditorTableCreatorComponent]
})
class TableCreatorHostComponent {
    public readonly inserted: EditorTableInsertEvent[] = [];
}

async function render<T>(component: new () => T): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [component] });
    const fixture = TestBed.createComponent(component);
    document.body.appendChild(fixture.nativeElement);
    await stable(fixture);
    return fixture;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function editorOf(fixture: ComponentFixture<unknown>): Editor {
    return fixture.debugElement.query(By.directive(EditorComponent)).injector.get(EditorService).editor;
}

function contentOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(".ProseMirror") as HTMLElement;
}

function toolbarOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("[role='toolbar']") as HTMLElement;
}

function buttonTitled(fixture: ComponentFixture<unknown>, title: string): HTMLButtonElement {
    return toolbarOf(fixture).querySelector(`button[title="${title}"]`) as HTMLButtonElement;
}

function key(target: Element, keyName: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init });
    target.dispatchEvent(event);
    return event;
}

async function axeViolations(element: Element): Promise<string[]> {
    const results = await axe.run(element, { rules: { "color-contrast": { enabled: false } } });
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.html).join(" | ")}`
    );
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("EditorComponent toolbar", () => {
    it("passes axe with every feature on", async () => {
        const fixture = await render(ToolbarHostComponent);
        expect(await axeViolations(fixture.nativeElement)).toEqual([]);
    });

    it("is a named toolbar with one Tab stop, moved by the arrow keys, Home and End", async () => {
        const fixture = await render(ToolbarHostComponent);
        const toolbar = toolbarOf(fixture);
        expect(toolbar.getAttribute("aria-label")).toBe("Formatting");

        const tabStops = () => Array.from(toolbar.querySelectorAll<HTMLElement>("[tabindex='0']"));
        expect(tabStops()).toHaveLength(1);
        const first = tabStops()[0];
        expect(first.getAttribute("title")).toBe("Bold");

        first.focus();
        key(first, "ArrowRight");
        await stable(fixture);
        expect(document.activeElement?.getAttribute("title")).toBe("Italic");
        expect(tabStops()).toEqual([document.activeElement]);

        key(document.activeElement as Element, "End");
        await stable(fixture);
        expect(document.activeElement?.getAttribute("title")).toBe("Insert table");

        key(document.activeElement as Element, "Home");
        await stable(fixture);
        expect(document.activeElement).toBe(first);

        key(first, "ArrowLeft");
        await stable(fixture);
        expect(document.activeElement?.getAttribute("title")).toBe("Insert table");
    });

    it("names its groups by purpose", async () => {
        const fixture = await render(ToolbarHostComponent);
        const names = Array.from(toolbarOf(fixture).querySelectorAll("[role='group']")).map(group =>
            group.getAttribute("aria-label")
        );
        expect(names).toEqual(["Text style", "Alignment", "Link", "Lists", "Indentation", "History", "Table"]);
    });

    it("reports the state of toggles through aria-pressed, and none on actions", async () => {
        const fixture = await render(ToolbarHostComponent);
        const bold = buttonTitled(fixture, "Bold");
        expect(bold.getAttribute("aria-pressed")).toBe("false");

        bold.click();
        await stable(fixture);
        expect(editorOf(fixture).isActive("bold")).toBe(true);
        expect(bold.getAttribute("aria-pressed")).toBe("true");

        const undo = buttonTitled(fixture, "Undo");
        undo.click();
        await stable(fixture);
        expect(undo.hasAttribute("aria-pressed")).toBe(false);
        expect(buttonTitled(fixture, "Remove link").hasAttribute("aria-pressed")).toBe(false);
        expect(buttonTitled(fixture, "Quotation").getAttribute("aria-pressed")).toBe("false");
    });

    it("enables Indent in a paragraph and Outdent once indented", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set("<p>Text</p>");
        await stable(fixture);
        editorOf(fixture).commands.setTextSelection(2);
        await stable(fixture);
        expect(buttonTitled(fixture, "Indent").disabled).toBe(false);
        expect(buttonTitled(fixture, "Outdent").disabled).toBe(true);

        buttonTitled(fixture, "Indent").click();
        await stable(fixture);
        expect(editorOf(fixture).getHTML()).toContain("margin-inline-start: 30px");
        expect(buttonTitled(fixture, "Outdent").disabled).toBe(false);
    });
});

describe("EditorComponent content", () => {
    it("is a named multi-line textbox, also after its attributes change", async () => {
        const fixture = await render(ToolbarHostComponent);
        const content = contentOf(fixture);
        expect(content.getAttribute("role")).toBe("textbox");
        expect(content.getAttribute("aria-multiline")).toBe("true");
        expect(content.getAttribute("aria-label")).toBe("Rich text editor");
        expect(content.getAttribute("dir")).toBe("ltr");

        fixture.componentInstance.disabled.set(true);
        await stable(fixture);
        expect(content.getAttribute("role")).toBe("textbox");
        expect(content.getAttribute("aria-multiline")).toBe("true");
    });

    it("takes its name and description from aria-label, aria-labelledby and aria-describedby", async () => {
        const fixture = await render(ToolbarHostComponent);
        const host = fixture.nativeElement.querySelector("mona-editor") as HTMLElement;
        fixture.componentInstance.ariaLabel.set("Comment");
        await stable(fixture);
        expect(contentOf(fixture).getAttribute("aria-label")).toBe("Comment");
        expect(host.hasAttribute("aria-label")).toBe(false);

        fixture.componentInstance.ariaLabelledBy.set("editor-label");
        fixture.componentInstance.ariaDescribedBy.set("editor-hint");
        await stable(fixture);
        expect(contentOf(fixture).getAttribute("aria-labelledby")).toBe("editor-label");
        expect(contentOf(fixture).hasAttribute("aria-label")).toBe(false);
        expect(contentOf(fixture).getAttribute("aria-describedby")).toBe("editor-hint");
    });

    it("shows the placeholder while empty and gives it to assistive technology", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.placeholder.set("Write a comment");
        await stable(fixture);
        const placeholder = () =>
            Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("[aria-hidden='true']")).find(
                element => element.textContent?.trim() === "Write a comment"
            );
        expect(placeholder()).toBeDefined();
        expect(contentOf(fixture).getAttribute("aria-placeholder")).toBe("Write a comment");

        editorOf(fixture).commands.insertContent("Hi");
        await stable(fixture);
        expect(placeholder()).toBeUndefined();
    });

    it("leaves Tab to lists, and lets Escape then Tab leave the editor", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set("<ul><li><p>One</p></li><li><p>Two</p></li></ul>");
        await stable(fixture);
        const editor = editorOf(fixture);
        // The end of "Two": ul, li, p and "One" closed, then li and p opened.
        editor.commands.setTextSelection(13);

        const nested = key(contentOf(fixture), "Tab");
        expect(nested.defaultPrevented).toBe(true);
        expect(editor.getHTML()).toContain("<ul><li><p>Two</p></li></ul>");

        key(contentOf(fixture), "Escape");
        const leaves = key(contentOf(fixture), "Tab");
        expect(leaves.defaultPrevented).toBe(false);
    });

    it("indents from the keyboard with Mod-] and Mod-[ outside lists, not Tab", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set("<p>Text</p>");
        await stable(fixture);
        const editor = editorOf(fixture);
        editor.commands.setTextSelection(2);

        expect(key(contentOf(fixture), "Tab").defaultPrevented).toBe(false);
        key(contentOf(fixture), "]", { ctrlKey: true });
        expect(editor.getHTML()).toContain("margin-inline-start: 30px");
        key(contentOf(fixture), "[", { ctrlKey: true });
        expect(editor.getHTML()).toBe("<p>Text</p>");
    });

    it("aligns to the start and end, and reads older left and right alignments", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set('<p style="text-align: right">Right</p>');
        await stable(fixture);
        editorOf(fixture).commands.setTextSelection(2);
        await stable(fixture);
        expect(buttonTitled(fixture, "Align text to the end").getAttribute("aria-pressed")).toBe("true");

        buttonTitled(fixture, "Align text to the start").click();
        await stable(fixture);
        expect(editorOf(fixture).getHTML()).toBe('<p style="text-align: start;">Right</p>');
        expect(buttonTitled(fixture, "Align text to the start").getAttribute("aria-pressed")).toBe("true");
    });

    it("offers the font sizes from the settings", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.settings.set({ fontSizeList: ["1rem", "2rem"] });
        await stable(fixture);
        const service = fixture.debugElement.query(By.directive(EditorComponent)).injector.get(EditorService);
        expect(service.fontSizes().toArray()).toEqual(["1rem", "2rem"]);
    });
});

describe("EditorComponent link dialog", () => {
    function dialogButton(text: string): HTMLButtonElement | undefined {
        return Array.from(document.querySelectorAll<HTMLButtonElement>("[role='dialog'] button")).find(
            button => button.textContent?.trim() === text
        );
    }

    function dialogInput(): HTMLInputElement {
        return document.querySelector("[role='dialog'] mona-text-box input") as HTMLInputElement;
    }

    async function typeUrl(fixture: ComponentFixture<unknown>, url: string): Promise<void> {
        const input = dialogInput();
        input.value = url;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await stable(fixture);
    }

    it("links the selection, adding https:// to a bare host", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set("<p>Mona UI</p>");
        await stable(fixture);
        editorOf(fixture).commands.setTextSelection({ from: 1, to: 5 });
        buttonTitled(fixture, "Insert link").click();
        await stable(fixture);

        expect(document.querySelector("[role='dialog']")?.textContent).toContain("Insert link");
        expect(document.activeElement).toBe(dialogInput());
        const label = document.querySelector("[role='dialog'] label") as HTMLElement;
        expect(dialogInput().getAttribute("aria-labelledby")).toBe(label.id);
        await typeUrl(fixture, "example.com");
        dialogButton("Apply")?.click();
        await stable(fixture);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(editorOf(fixture).getHTML()).toContain(
            '<a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com">Mona</a>'
        );
    });

    it("keeps the dialog open and explains why for a URL it can't use", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set("<p>Mona UI</p>");
        await stable(fixture);
        editorOf(fixture).commands.setTextSelection({ from: 1, to: 5 });
        buttonTitled(fixture, "Insert link").click();
        await stable(fixture);

        await typeUrl(fixture, "javascript:alert(1)");
        dialogButton("Apply")?.click();
        await stable(fixture);

        expect(document.querySelector("[role='dialog']")).not.toBeNull();
        const error = document.querySelector("[role='dialog'] p[id]") as HTMLElement;
        expect(error.textContent).toContain("Enter a web address");
        expect(dialogInput().getAttribute("aria-describedby")).toBe(error.id);
        expect(editorOf(fixture).getHTML()).not.toContain("<a");
    });

    it("edits and removes an existing link", async () => {
        const fixture = await render(ToolbarHostComponent);
        fixture.componentInstance.value.set('<p><a href="https://old.example">Mona</a> UI</p>');
        await stable(fixture);
        editorOf(fixture).commands.setTextSelection(2);
        await stable(fixture);
        buttonTitled(fixture, "Insert link").click();
        await stable(fixture);

        expect(document.querySelector("[role='dialog']")?.textContent).toContain("Edit link");
        expect(dialogInput().value).toBe("https://old.example");
        dialogButton("Remove link")?.click();
        await stable(fixture);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editorOf(fixture).getHTML()).toBe("<p>Mona UI</p>");
    });

    it("accepts web, mail, phone and relative links, and refuses other schemes", () => {
        expect(normalizeLinkUrl(" https://example.com/a ")).toBe("https://example.com/a");
        expect(normalizeLinkUrl("mailto:team@example.com")).toBe("mailto:team@example.com");
        expect(normalizeLinkUrl("tel:+15551234")).toBe("tel:+15551234");
        expect(normalizeLinkUrl("/docs#install")).toBe("/docs#install");
        expect(normalizeLinkUrl("www.example.com/page")).toBe("https://www.example.com/page");
        expect(normalizeLinkUrl("javascript:alert(1)")).toBeNull();
        expect(normalizeLinkUrl("data:text/html,hi")).toBeNull();
        expect(normalizeLinkUrl("not a url")).toBeNull();
        expect(normalizeLinkUrl("")).toBeNull();
    });
});

describe("EditorTableCreatorComponent", () => {
    it("is one Tab stop of named buttons that the arrow keys size and Enter inserts", async () => {
        const fixture = await render(TableCreatorHostComponent);
        const buttons = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
        expect(buttons()).toHaveLength(64);
        expect(buttons().filter(button => button.tabIndex === 0)).toHaveLength(1);
        expect(buttons()[0].getAttribute("aria-label")).toBe("Rows: 1, columns: 1");

        buttons()[0].focus();
        key(buttons()[0], "ArrowRight");
        await stable(fixture);
        key(document.activeElement as Element, "ArrowDown");
        await stable(fixture);
        key(document.activeElement as Element, "ArrowDown");
        await stable(fixture);

        expect(document.activeElement?.getAttribute("aria-label")).toBe("Rows: 3, columns: 2");
        expect(fixture.nativeElement.querySelector("[aria-live]").textContent.trim()).toBe("Rows: 3, columns: 2");
        expect(buttons().filter(button => button.hasAttribute("data-highlighted"))).toHaveLength(6);

        (document.activeElement as HTMLButtonElement).click();
        expect(fixture.componentInstance.inserted).toEqual([{ col: 2, row: 3 }]);
        expect(await axeViolations(fixture.nativeElement)).toEqual([]);
    });
});

describe("EditorImageInserterComponent", () => {
    it("labels its fields", async () => {
        const fixture = await render(EditorImageInserterComponent);
        expect(await axeViolations(fixture.nativeElement)).toEqual([]);
        const labelledBy = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll("input[aria-labelledby]")
        ).map(input => document.getElementById(input.getAttribute("aria-labelledby") ?? "")?.textContent?.trim());
        expect(labelledBy).toEqual(["Image URL", "Alt text", "Width (px)", "Height (px)"]);
    });
});
