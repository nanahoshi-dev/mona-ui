import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import type { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import { EditorFontColorComponent } from "../components/editor-font-color/editor-font-color.component";
import { EditorFontHighlightComponent } from "../components/editor-font-highlight/editor-font-highlight.component";
import { EditorService } from "../services/editor.service";
import { editorBaseThemeVariants } from "../styles/editor.styles";
import { selectionMarkAttribute } from "../utils/selectionMarkAttribute";

@Component({
    template: `<mona-editor [(value)]="value"></mona-editor>`,
    imports: [EditorComponent]
})
class ColorHostComponent {
    public readonly value = signal("<p>one two</p>");
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function render(): Promise<ComponentFixture<ColorHostComponent>> {
    TestBed.configureTestingModule({ imports: [ColorHostComponent] });
    const fixture = TestBed.createComponent(ColorHostComponent);
    document.body.appendChild(fixture.nativeElement);
    await stable(fixture);
    return fixture;
}

function editorOf(fixture: ComponentFixture<unknown>): Editor {
    return fixture.debugElement.query(By.directive(EditorComponent)).injector.get(EditorService).editor;
}

function pickerOf(fixture: ComponentFixture<unknown>, tool: new () => unknown): ColorPickerComponent {
    return fixture.debugElement.query(By.directive(tool)).query(By.directive(ColorPickerComponent))
        .componentInstance as ColorPickerComponent;
}

describe("Editor text and highlight color", () => {
    beforeEach(() => {
        // jsdom has no canvas, which the toolbar reads colors through.
        const context = {
            fillStyle: ""
        } as unknown as CanvasRenderingContext2D;
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    describe("selectionMarkAttribute", () => {
        it("returns the color all the selected text shares", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setContent(
                '<p><span style="color: red">one</span> <span style="color: red">two</span></p>'
            );
            editor.commands.selectAll();

            // The space between the words has no color.
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBeNull();

            editor.commands.setTextSelection({ from: 1, to: 4 });
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBe("red");
        });

        it("returns null for text without the mark and for mixed colors", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setContent(
                '<p><span style="color: red">one</span><span style="color: blue">two</span></p>'
            );

            editor.commands.setTextSelection({ from: 1, to: 7 });
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBeNull();

            editor.commands.setContent("<p>plain</p>");
            editor.commands.setTextSelection({ from: 1, to: 6 });
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBeNull();
        });

        it("reads the marks the next text would get with only a cursor", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setTextSelection(1);
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBeNull();

            editor.commands.setColor("#ff0000");
            expect(selectionMarkAttribute(editor.state, "textStyle", "color")).toBe("#ff0000");
        });
    });

    describe.each([
        { name: "text color", tool: EditorFontColorComponent, mark: "color: rgb(255, 0, 0)" },
        { name: "highlight", tool: EditorFontHighlightComponent, mark: 'data-color="#ff0000"' }
    ])("$name picker", ({ tool, mark }) => {
        it("applies the color to the selection", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setTextSelection({ from: 1, to: 4 });
            await stable(fixture);

            pickerOf(fixture, tool).value.set("#ff0000");
            await stable(fixture);

            expect(editor.getHTML()).toContain(mark);
        });

        it("can apply the color just used to other text", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setTextSelection({ from: 1, to: 4 });
            await stable(fixture);
            pickerOf(fixture, tool).value.set("#ff0000");
            await stable(fixture);

            editor.commands.setTextSelection({ from: 5, to: 8 });
            await stable(fixture);
            expect(pickerOf(fixture, tool).value(), "The picker must not already hold it").toBeNull();

            pickerOf(fixture, tool).value.set("#ff0000");
            await stable(fixture);
            expect(editor.getHTML().split(mark).length - 1, editor.getHTML()).toBe(2);
        });

        it("holds nothing over a selection with mixed colors, so one color can cover it", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setTextSelection({ from: 1, to: 4 });
            await stable(fixture);
            pickerOf(fixture, tool).value.set("#ff0000");
            await stable(fixture);

            editor.commands.setTextSelection({ from: 1, to: 8 });
            await stable(fixture);
            expect(pickerOf(fixture, tool).value()).toBeNull();
        });

        it("clears the color", async () => {
            const fixture = await render();
            const editor = editorOf(fixture);
            editor.commands.setTextSelection({ from: 1, to: 4 });
            await stable(fixture);
            pickerOf(fixture, tool).value.set("#ff0000");
            await stable(fixture);

            pickerOf(fixture, tool).value.set(null);
            await stable(fixture);
            expect(editor.getHTML()).not.toContain(mark);
        });
    });

    describe("styles", () => {
        it("lets bold text take the color instead of forcing the foreground", () => {
            const classes = editorBaseThemeVariants();
            expect(classes).toContain("prose-strong:text-inherit");
            expect(classes).not.toContain("prose-strong:text-foreground");
        });
    });
});
