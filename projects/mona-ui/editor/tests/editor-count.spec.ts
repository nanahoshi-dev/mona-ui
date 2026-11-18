import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { Editor } from "@tiptap/core";
import axe from "axe-core";
import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import { EditorService } from "../services/editor.service";

@Component({
    template: `
        <p id="hint">Keep it short.</p>
        <mona-editor
            aria-describedby="hint"
            [characterLimit]="limit()"
            [showCharacterCount]="showCharacters()"
            [showWordCount]="showWords()"
            [(value)]="value"></mona-editor>
    `,
    imports: [EditorComponent]
})
class CountHostComponent {
    public readonly limit = signal<number | null>(null);
    public readonly showCharacters = signal(false);
    public readonly showWords = signal(false);
    public readonly value = signal("<p>Hello brave world</p>");
}

/** The announcer of the last render. */
let announce: MockInstance<LiveAnnouncer["announce"]>;

async function render(setup?: (host: CountHostComponent) => void): Promise<ComponentFixture<CountHostComponent>> {
    TestBed.configureTestingModule({ imports: [CountHostComponent] });
    const fixture = TestBed.createComponent(CountHostComponent);
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

function editorElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-editor") as HTMLElement;
}

/** The counts under the content. */
function counts(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(editorElement(fixture).querySelectorAll<HTMLElement>(":scope > div > span"));
}

function countTexts(fixture: ComponentFixture<unknown>): string[] {
    return counts(fixture).map(count => count.textContent?.trim() ?? "");
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

describe("EditorComponent counts", () => {
    it("shows no counts unless asked", async () => {
        const fixture = await render();
        expect(counts(fixture)).toEqual([]);
        expect(contentOf(fixture).getAttribute("aria-describedby")).toBe("hint");
    });

    it("counts the words and characters as the content changes", async () => {
        const fixture = await render(host => {
            host.showCharacters.set(true);
            host.showWords.set(true);
        });
        expect(countTexts(fixture)).toEqual(["3 words", "17 characters"]);

        editorOf(fixture).commands.insertContentAt(18, " 👋🏽");
        await stable(fixture);
        expect(countTexts(fixture)).toEqual(["3 words", "19 characters"]);

        editorOf(fixture).commands.setContent("<p>One</p>");
        await stable(fixture);
        expect(countTexts(fixture)).toEqual(["1 word", "3 characters"]);
    });

    it("says how many characters are left under the limit, and how many are over it", async () => {
        const fixture = await render(host => {
            host.limit.set(20);
            host.showCharacters.set(true);
        });
        const host = fixture.componentInstance;
        expect(countTexts(fixture)).toEqual(["3 characters left"]);
        expect(editorElement(fixture).hasAttribute("data-invalid")).toBe(false);

        host.value.set("<p>Hello brave new world, and more</p>");
        await stable(fixture);
        expect(countTexts(fixture)).toEqual(["11 characters too many"]);
        expect(counts(fixture)[0]?.className).toContain("text-error");
        expect(editorElement(fixture).hasAttribute("data-invalid")).toBe(true);
        expect(contentOf(fixture).getAttribute("aria-invalid")).toBe("true");
        // Nothing is cut: typing past the limit is allowed.
        expect(editorOf(fixture).getText()).toBe("Hello brave new world, and more");

        host.value.set("<p>Hello</p>");
        await stable(fixture);
        expect(countTexts(fixture)).toEqual(["15 characters left"]);
        expect(editorElement(fixture).hasAttribute("data-invalid")).toBe(false);
        expect(contentOf(fixture).hasAttribute("aria-invalid")).toBe(false);
    });

    it("describes the content with the limit, after its own description", async () => {
        const fixture = await render(host => host.limit.set(1));
        const describedBy = contentOf(fixture).getAttribute("aria-describedby")?.split(" ") ?? [];
        expect(describedBy[0]).toBe("hint");
        expect(document.getElementById(describedBy[1] ?? "")?.textContent?.trim()).toBe(
            "You can enter up to 1 character."
        );
        expect(await axeViolations(fixture.nativeElement)).toEqual([]);

        fixture.componentInstance.limit.set(null);
        await stable(fixture);
        expect(contentOf(fixture).getAttribute("aria-describedby")).toBe("hint");
        expect(counts(fixture)).toEqual([]);
    });

    it("announces how many characters are left once typing stops, while the content has focus", async () => {
        const fixture = await render(host => host.limit.set(20));
        const editor = editorOf(fixture);
        // jsdom's focus doesn't reach ProseMirror's focus tracking.
        editor.isFocused = true;

        editor.commands.insertContentAt(18, "!");
        editor.commands.insertContentAt(19, "!");
        await new Promise(resolve => setTimeout(resolve, 600));
        expect(announce).not.toHaveBeenCalled();
        await new Promise(resolve => setTimeout(resolve, 600));
        expect(announce).toHaveBeenCalledExactlyOnceWith("1 character left", "polite");

        editor.isFocused = false;
        editor.commands.insertContentAt(20, "!");
        await new Promise(resolve => setTimeout(resolve, 1100));
        expect(announce).toHaveBeenCalledOnce();
    });
});
