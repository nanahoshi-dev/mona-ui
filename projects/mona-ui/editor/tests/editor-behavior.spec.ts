import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField, required } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import type { Editor, JSONContent } from "@tiptap/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import type { ContentChangeEvent } from "../models/ContentChangeEvent";
import type { EditorSettings } from "../models/EditorSettings";
import { EditorService } from "../services/editor.service";

@Component({
    template: `
        <button type="button" id="outside">Outside</button>
        <mona-editor
            [settings]="settings()"
            [(value)]="value"
            [disabled]="disabled()"
            [readonly]="readonly()"
            [required]="requiredState()"
            [touched]="touched()"
            (touch)="touched.set(true)"
            (update)="updates.push($event)"></mona-editor>
    `,
    imports: [EditorComponent]
})
class ValueHostComponent {
    public readonly disabled = signal(false);
    public readonly readonly = signal(false);
    public readonly requiredState = signal(false);
    public readonly settings = signal<Partial<EditorSettings>>({});
    public readonly touched = signal(false);
    public readonly updates: ContentChangeEvent[] = [];
    public readonly value = signal("");
}

@Component({
    template: `<mona-editor [content]="content()" (update)="onUpdate($event)"></mona-editor>`,
    imports: [EditorComponent]
})
class ContentHostComponent {
    public readonly content = signal<string | JSONContent>("<p>Hello</p>");
    public updates = 0;

    public onUpdate(event: ContentChangeEvent): void {
        this.updates++;
        this.content.set(event.html);
    }
}

@Component({
    template: `<mona-editor [formField]="form.body"></mona-editor>`,
    imports: [EditorComponent, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal({ body: "<p>From the form</p>" });
    public readonly disabled = signal(false);
    public readonly form = form(this.#model, schema => {
        fieldDisabled(schema.body, { when: () => this.disabled() });
        required(schema.body);
    });
    public readonly model = this.#model;
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

function contentElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(".ProseMirror") as HTMLElement;
}

function toolbar(fixture: ComponentFixture<unknown>): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-editor > div:not(:last-child)");
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("EditorComponent content", () => {
    it("keeps the src, alt, title, width and height of images", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);

        editor
            .chain()
            .setImage({ alt: "A cat", height: 20, src: "https://example.com/cat.png", title: "Cat", width: 30 })
            .run();
        expect(editor.getHTML()).toContain('src="https://example.com/cat.png"');
        expect(editor.getHTML()).toContain('alt="A cat"');
        expect(editor.getHTML()).toContain('title="Cat"');
        expect(editor.getHTML()).toContain('width="30"');
        expect(editor.getHTML()).toContain('height="20"');

        fixture.componentInstance.value.set('<p><img src="https://example.com/dog.png" alt="A dog" width="12"></p>');
        await stable(fixture);
        expect(editor.getHTML()).toContain('src="https://example.com/dog.png"');
        expect(editor.getHTML()).toContain('alt="A dog"');
        expect(editor.getHTML()).toContain('width="12"');
    });

    it("keeps the document when the settings change, and drops the toolbar of a removed feature", async () => {
        const fixture = await render(ValueHostComponent);
        fixture.componentInstance.value.set("<p>Hello <u>world</u></p>");
        await stable(fixture);
        expect(fixture.nativeElement.querySelector("mona-editor-table")).not.toBeNull();

        fixture.componentInstance.settings.set({ table: false, underline: false });
        await stable(fixture);

        expect(editorOf(fixture).getHTML()).toBe("<p>Hello world</p>");
        expect(fixture.nativeElement.querySelector("mona-editor-table")).toBeNull();
        expect(editorOf(fixture).extensionManager.extensions.some(extension => extension.name === "table")).toBe(false);
    });

    it("registers link and underline once, and turns them off with their settings", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const fixture = await render(ValueHostComponent);
        const names = editorOf(fixture).extensionManager.extensions.map(extension => extension.name);
        expect(names.filter(name => name === "link")).toHaveLength(1);
        expect(names.filter(name => name === "underline")).toHaveLength(1);
        expect(warn.mock.calls.flat().join(" ")).not.toContain("Duplicate extension names");

        fixture.componentInstance.settings.set({ code: false, link: false, underline: false });
        await stable(fixture);
        const editor = editorOf(fixture);
        editor.commands.setContent(
            '<p><a href="https://example.com">a</a> <u>b</u> <code>c</code></p><pre><code>d</code></pre>'
        );
        expect(editor.getHTML()).not.toContain("<a ");
        expect(editor.getHTML()).not.toContain("<u>");
        expect(editor.getHTML()).not.toContain("<code>");
        expect(editor.getHTML()).not.toContain("<pre>");
        warn.mockRestore();
    });

    it("reads the font size of pasted text, and no font size as none", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);
        editor.commands.setContent(
            '<p><span style="font-size: 18px">big</span> <span style="color: red">red</span></p>'
        );
        expect(editor.getHTML()).toContain("font-size: 18px");
        expect(editor.getJSON().content?.[0]?.content?.[2]?.marks?.[0]?.attrs?.["fontSize"]).toBeNull();
    });
});

describe("EditorComponent value", () => {
    it("emits the user's changes through the value and update, and an empty editor as an empty value", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);

        editor.commands.insertContent("Hi");
        await stable(fixture);
        expect(fixture.componentInstance.value()).toBe("<p>Hi</p>");
        expect(fixture.componentInstance.updates.map(update => update.html)).toEqual(["<p>Hi</p>"]);

        editor.commands.clearContent(true);
        await stable(fixture);
        expect(fixture.componentInstance.value()).toBe("");
    });

    it("applies a value set from outside without emitting an update", async () => {
        const fixture = await render(ValueHostComponent);
        fixture.componentInstance.value.set("<p>From outside</p>");
        await stable(fixture);

        expect(editorOf(fixture).getHTML()).toBe("<p>From outside</p>");
        expect(fixture.componentInstance.updates).toHaveLength(0);
    });

    it("keeps the cursor where the user types when the value is bound both ways", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);
        editor.commands.insertContent("Hello world");
        await stable(fixture);

        editor.commands.setTextSelection(3);
        editor.commands.insertContent("X");
        await stable(fixture);

        expect(editor.getHTML()).toBe("<p>HeXllo world</p>");
        expect(editor.state.selection.from).toBe(4);
    });

    it("doesn't re-apply content that the editor itself emitted (deprecated content input)", async () => {
        const fixture = await render(ContentHostComponent);
        const editor = editorOf(fixture);
        expect(editor.getHTML()).toBe("<p>Hello</p>");

        editor.commands.setTextSelection(3);
        editor.commands.insertContent("X");
        await stable(fixture);

        expect(fixture.componentInstance.updates).toBe(1);
        expect(editor.getHTML()).toBe("<p>HeXllo</p>");
        expect(editor.state.selection.from).toBe(4);

        fixture.componentInstance.content.set({ type: "paragraph", content: [{ type: "text", text: "Replaced" }] });
        await stable(fixture);
        expect(editor.getHTML()).toBe("<p>Replaced</p>");
        expect(fixture.componentInstance.updates).toBe(1);
    });
});

describe("EditorComponent states", () => {
    it("can't be edited while disabled, and its toolbar is inert", async () => {
        const fixture = await render(ValueHostComponent);
        fixture.componentInstance.disabled.set(true);
        await stable(fixture);

        expect(editorOf(fixture).isEditable).toBe(false);
        expect(contentElement(fixture).getAttribute("contenteditable")).toBe("false");
        expect(contentElement(fixture).getAttribute("aria-disabled")).toBe("true");
        expect(toolbar(fixture)?.hasAttribute("inert")).toBe(true);
        expect(fixture.nativeElement.querySelector("mona-editor").getAttribute("data-disabled")).toBe("true");

        fixture.componentInstance.disabled.set(false);
        await stable(fixture);
        expect(editorOf(fixture).isEditable).toBe(true);
        expect(contentElement(fixture).hasAttribute("aria-disabled")).toBe(false);
        expect(toolbar(fixture)?.hasAttribute("inert")).toBe(false);
        expect(fixture.componentInstance.updates).toHaveLength(0);
    });

    it("hides the toolbar and marks the content read-only while readonly", async () => {
        const fixture = await render(ValueHostComponent);
        fixture.componentInstance.readonly.set(true);
        await stable(fixture);

        expect(editorOf(fixture).isEditable).toBe(false);
        expect(contentElement(fixture).getAttribute("aria-readonly")).toBe("true");
        expect(toolbar(fixture)).toBeNull();
    });

    it("emits touch on blur, and is invalid once touched while required and empty", async () => {
        const fixture = await render(ValueHostComponent);
        fixture.componentInstance.requiredState.set(true);
        await stable(fixture);
        expect(contentElement(fixture).getAttribute("aria-required")).toBe("true");
        expect(contentElement(fixture).hasAttribute("aria-invalid")).toBe(false);

        contentElement(fixture).dispatchEvent(new FocusEvent("focus"));
        contentElement(fixture).dispatchEvent(new FocusEvent("blur"));
        await stable(fixture);

        expect(fixture.componentInstance.touched()).toBe(true);
        expect(contentElement(fixture).getAttribute("aria-invalid")).toBe("true");
        expect(fixture.nativeElement.querySelector("mona-editor").getAttribute("data-invalid")).toBe("true");
    });

    it("works as a signal form field", async () => {
        const fixture = await render(SignalFormHostComponent);
        const editor = editorOf(fixture);
        expect(editor.getHTML()).toBe("<p>From the form</p>");

        editor.commands.insertContentAt(editor.state.doc.content.size - 1, "!");
        await stable(fixture);
        expect(fixture.componentInstance.model().body).toBe("<p>From the form!</p>");

        fixture.componentInstance.disabled.set(true);
        await stable(fixture);
        expect(editor.isEditable).toBe(false);
    });
});

describe("EditorComponent lifecycle", () => {
    it("doesn't take focus or set a font when it loads", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);

        expect(contentElement(fixture).contains(document.activeElement)).toBe(false);
        editor.commands.insertContent("Typed");
        expect(editor.getHTML()).toBe("<p>Typed</p>");
    });

    it("creates the editor only after it renders, and can be destroyed before that", () => {
        TestBed.configureTestingModule({ imports: [ValueHostComponent] });
        const fixture = TestBed.createComponent(ValueHostComponent);
        const service = fixture.debugElement.query(By.directive(EditorComponent)).injector.get(EditorService);
        expect(service.ready()).toBe(false);
        expect(() => fixture.destroy()).not.toThrow();
    });

    it("destroys the Tiptap editor with the component", async () => {
        const fixture = await render(ValueHostComponent);
        const editor = editorOf(fixture);
        fixture.destroy();
        expect(editor.isDestroyed).toBe(true);
    });

    it("focuses the editor through focus()", async () => {
        const fixture = await render(ValueHostComponent);
        const component = fixture.debugElement.query(By.directive(EditorComponent))
            .componentInstance as EditorComponent;
        const editor = editorOf(fixture);
        editor.commands.setTextSelection(1);
        const viewFocus = vi.spyOn(editor.view, "focus");
        component.focus();
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(viewFocus).toHaveBeenCalled();
        expect(editor.state.selection.from).toBe(1);
    });
});
