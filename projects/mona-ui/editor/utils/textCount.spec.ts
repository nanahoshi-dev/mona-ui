import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import { Mention } from "../extensions/Mention";
import { countEditorText, countText, documentText } from "./textCount";

const editors: Editor[] = [];

function editorWith(html: string): Editor {
    const editor = new Editor({ content: html, extensions: [StarterKit, Mention] });
    editors.push(editor);
    return editor;
}

afterEach(() => {
    editors.splice(0).forEach(editor => editor.destroy());
});

describe("countText", () => {
    it("counts characters as people see them", () => {
        expect(countText("abc", "characters")).toBe(3);
        expect(countText("👨‍👩‍👧", "characters")).toBe(1);
        expect(countText("é", "characters")).toBe(1);
        expect(countText("🇯🇵 ok", "characters")).toBe(4);
    });

    it("counts words, without punctuation", () => {
        expect(countText("Hello, world! It's fine.", "words")).toBe(4);
        expect(countText("   ", "words")).toBe(0);
    });

    it("counts the words of text without spaces", () => {
        expect(countText("今日は良い天気です", "words", "ja-JP")).toBeGreaterThan(1);
    });
});

describe("countEditorText", () => {
    it("counts the text without the markup", () => {
        expect(countEditorText("<p><strong>Hi</strong> there</p>", "characters")).toBe(8);
        expect(countEditorText("<p>Hi&nbsp;&amp;&nbsp;bye</p>", "characters")).toBe(8);
        expect(countEditorText("", "characters")).toBe(0);
    });

    it("keeps the words of separate blocks and lines apart", () => {
        expect(countEditorText("<p>one</p><p>two</p><ul><li><p>three</p></li></ul>", "words")).toBe(3);
        expect(countEditorText("<p>one<br>two</p>", "words")).toBe(2);
        expect(countEditorText("<p>one</p><p>two</p>", "characters")).toBe(6);
    });

    it("counts as the editor counts its document", () => {
        const html =
            '<h2>Plan</h2><p>Ask <span data-type="mention" data-id="7" data-label="Ana">@Ana</span> about 🇯🇵<br>today</p>' +
            "<blockquote><p>Quoted words here</p></blockquote>";
        const editor = editorWith(html);
        for (const unit of ["characters", "words"] as const) {
            expect(countEditorText(editor.getHTML(), unit)).toBe(countText(documentText(editor.state.doc, unit), unit));
        }
        expect(countText(documentText(editor.state.doc, "words"), "words")).toBe(8);
    });
});

describe("documentText", () => {
    it("is a mention's @label", () => {
        const editor = editorWith('<p>Hi <span data-type="mention" data-id="7" data-label="Ana">@Ana</span></p>');
        expect(documentText(editor.state.doc, "characters")).toBe("Hi @Ana");
    });
});
