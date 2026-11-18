import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { Editor } from "@tiptap/core";
import axe from "axe-core";
import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import type { EditorMention, EditorMentionSearch } from "../models/EditorMention";
import { EditorService } from "../services/editor.service";

const PEOPLE: readonly EditorMention[] = [
    { id: "1", label: "Ana" },
    { id: "2", label: "Andrés" },
    { id: "3", label: "Bo" }
];

const searchPeople: EditorMentionSearch = query =>
    PEOPLE.filter(person => person.label.toLowerCase().startsWith(query.toLowerCase()));

@Component({
    template: `<mona-editor [mentionSearch]="search()" [(value)]="value"></mona-editor>`,
    imports: [EditorComponent]
})
class MentionHostComponent {
    public readonly search = signal<EditorMentionSearch | null>(searchPeople);
    public readonly value = signal("<p>Hi</p>");
}

/** The announcer of the last render. */
let announce: MockInstance<LiveAnnouncer["announce"]>;

async function render(setup?: (host: MentionHostComponent) => void): Promise<ComponentFixture<MentionHostComponent>> {
    TestBed.configureTestingModule({ imports: [MentionHostComponent] });
    const fixture = TestBed.createComponent(MentionHostComponent);
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
    setup?.(fixture.componentInstance);
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

/** Types text at the caret, as one change. */
async function type(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
    editorOf(fixture).commands.insertContent(text);
    await stable(fixture);
}

async function key(
    fixture: ComponentFixture<unknown>,
    keyName: string,
    init: KeyboardEventInit = {}
): Promise<KeyboardEvent> {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init });
    contentOf(fixture).dispatchEvent(event);
    await stable(fixture);
    return event;
}

function listbox(): HTMLElement | null {
    return document.querySelector("[role='listbox']");
}

function options(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='option']"));
}

function popupText(): string {
    return document.querySelector(".cdk-overlay-container")?.textContent?.trim() ?? "";
}

async function axeViolations(element: Element): Promise<string[]> {
    const results = await axe.run(element, { rules: { "color-contrast": { enabled: false } } });
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.html).join(" | ")}`
    );
}

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
});

describe("EditorComponent mentions", () => {
    it("offers mentions as @ and a query are typed, with the content pointing at the highlighted one", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @an");

        expect(options().map(option => option.textContent?.trim())).toEqual(["Ana", "Andrés"]);
        expect(listbox()?.getAttribute("aria-label")).toBe("Suggestions");
        const content = contentOf(fixture);
        expect(content.getAttribute("aria-activedescendant")).toBe(options()[0]?.id);
        expect(content.getAttribute("aria-controls")).toBe(listbox()?.id);
        expect(content.getAttribute("aria-autocomplete")).toBe("list");
        expect(options().map(option => option.getAttribute("aria-selected"))).toEqual(["true", "false"]);
        expect(announce).toHaveBeenCalledWith("2 suggestions", "polite");
        expect(await axeViolations(fixture.nativeElement)).toEqual([]);
        expect(await axeViolations(document.querySelector(".cdk-overlay-container") as HTMLElement)).toEqual([]);

        await type(fixture, "d");
        expect(options().map(option => option.textContent?.trim())).toEqual(["Andrés"]);
        expect(announce).toHaveBeenCalledWith("1 suggestion", "polite");
    });

    it("moves through the suggestions with the arrow keys, and puts the highlighted one in with Enter", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @an");

        expect((await key(fixture, "ArrowDown")).defaultPrevented).toBe(true);
        expect(contentOf(fixture).getAttribute("aria-activedescendant")).toBe(options()[1]?.id);
        await key(fixture, "ArrowDown");
        expect(contentOf(fixture).getAttribute("aria-activedescendant")).toBe(options()[0]?.id);
        await key(fixture, "ArrowUp");
        expect(contentOf(fixture).getAttribute("aria-activedescendant")).toBe(options()[1]?.id);

        expect((await key(fixture, "Enter")).defaultPrevented).toBe(true);
        expect(fixture.componentInstance.value()).toBe(
            '<p>Hi <span data-type="mention" data-id="2" data-label="Andrés">@Andrés</span> </p>'
        );
        expect(listbox()).toBeNull();
        expect(contentOf(fixture).hasAttribute("aria-activedescendant")).toBe(false);
        expect(contentOf(fixture).hasAttribute("aria-controls")).toBe(false);

        // The mention is one piece: Backspace after its space takes the space, then the whole mention.
        const editor = editorOf(fixture);
        editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
        editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
        expect(editor.getHTML()).toBe("<p>Hi </p>");
    });

    it("puts a suggestion in with Tab, or with a click", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @b");
        await key(fixture, "Tab");
        await type(fixture, "and @a");

        const pointerDown = new Event("pointerdown", { bubbles: true, cancelable: true });
        options()[0]?.dispatchEvent(pointerDown);
        expect(pointerDown.defaultPrevented).toBe(true);
        options()[0]?.click();
        await stable(fixture);

        expect(fixture.componentInstance.value()).toBe(
            '<p>Hi <span data-type="mention" data-id="3" data-label="Bo">@Bo</span> and ' +
                '<span data-type="mention" data-id="1" data-label="Ana">@Ana</span> </p>'
        );
    });

    it("closes the suggestions with Escape until a new @ is typed", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @a");
        expect(listbox()).not.toBeNull();

        expect((await key(fixture, "Escape")).defaultPrevented).toBe(true);
        expect(listbox()).toBeNull();
        await type(fixture, "n");
        expect(listbox()).toBeNull();
        // Enter goes back to the content: a new paragraph.
        expect((await key(fixture, "Enter")).defaultPrevented).toBe(true);
        expect(fixture.componentInstance.value()).toBe("<p>Hi @an</p><p></p>");

        await type(fixture, "@b");
        expect(options().map(option => option.textContent?.trim())).toEqual(["Bo"]);
    });

    it("closes the suggestions when the content loses focus", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @a");
        expect(listbox()).not.toBeNull();

        contentOf(fixture).dispatchEvent(new FocusEvent("blur"));
        await stable(fixture);
        expect(listbox()).toBeNull();
    });

    it("says when nothing matches, and leaves Enter to the content", async () => {
        const fixture = await render();
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @zz");

        expect(listbox()).toBeNull();
        expect(popupText()).toBe("No matches");
        expect(announce).toHaveBeenCalledWith("No matches", "polite");
        expect(contentOf(fixture).hasAttribute("aria-activedescendant")).toBe(false);
        await key(fixture, "Enter");
        expect(fixture.componentInstance.value()).toBe("<p>Hi @zz</p><p></p>");
    });

    it("shows that it is searching, and keeps only the latest query's results", async () => {
        const pending = new Map<string, (mentions: EditorMention[]) => void>();
        const fixture = await render(host =>
            host.search.set(query => new Promise(resolve => pending.set(query, resolve)))
        );
        editorOf(fixture).commands.setTextSelection(3);
        await type(fixture, " @a");
        expect(popupText()).toBe("Searching…");

        await type(fixture, "n");
        pending.get("an")?.([{ id: "1", label: "Ana" }]);
        await stable(fixture);
        pending.get("a")?.([{ id: "9", label: "Old" }]);
        await stable(fixture);

        expect(options().map(option => option.textContent?.trim())).toEqual(["Ana"]);
    });

    it("ignores @ in code, after a letter, and without mentionSearch", async () => {
        const fixture = await render();
        const editor = editorOf(fixture);
        editor.commands.setTextSelection(3);
        await type(fixture, " name@a");
        expect(popupText()).toBe("");

        editor.commands.setContent("<pre><code>x</code></pre>");
        editor.commands.setTextSelection(2);
        await type(fixture, " @a");
        expect(popupText()).toBe("");

        fixture.componentInstance.search.set(null);
        await stable(fixture);
        editor.commands.setContent("<p>Hi</p>");
        editor.commands.setTextSelection(3);
        await type(fixture, " @a");
        expect(popupText()).toBe("");
    });

    it("keeps the mentions of its content without mentionSearch", async () => {
        const html = '<p>Hi <span data-type="mention" data-id="1" data-label="Ana">@Ana</span></p>';
        const fixture = await render(host => {
            host.search.set(null);
            host.value.set(html);
        });
        expect(editorOf(fixture).getHTML()).toBe(html);
        expect(contentOf(fixture).querySelector("[data-type='mention']")?.textContent).toBe("@Ana");
    });
});
