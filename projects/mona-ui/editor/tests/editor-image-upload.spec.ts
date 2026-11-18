import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { FileUploadContext, FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
import type { Editor } from "@tiptap/core";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { EditorComponent } from "../components/editor/editor.component";
import { EditorImageInserterComponent } from "../components/editor-image-inserter/editor-image-inserter.component";
import type { EditorImageInsertEvent } from "../models/EditorImageInsertEvent";
import type { ImageInsertFormModel } from "../models/ImageInsertFormModel";
import { EditorService } from "../services/editor.service";

@Component({
    template: `
        <mona-editor [imageMaxFileSize]="maxFileSize()" [imageUpload]="upload()" [(value)]="value"></mona-editor>
    `,
    imports: [EditorComponent]
})
class UploadHostComponent {
    public readonly maxFileSize = signal<number | null>(null);
    public readonly upload = signal<FileUploadHandler | null>(null);
    public readonly value = signal("<p>Hello</p>");
}

@Component({
    template: `
        <mona-editor-image-inserter
            [image]="image()"
            [upload]="upload()"
            (insert)="inserted.push($event)"></mona-editor-image-inserter>
    `,
    imports: [EditorImageInserterComponent]
})
class InserterHostComponent {
    public readonly image = signal<ImageInsertFormModel | null>(null);
    public readonly inserted: EditorImageInsertEvent[] = [];
    public readonly upload = signal<FileUploadHandler | null>(null);
}

interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly reject: (error: unknown) => void;
    readonly resolve: (value: T) => void;
}

interface UploadCall {
    readonly context: FileUploadContext;
    readonly done: Deferred<unknown>;
    readonly file: File;
}

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, reject, resolve };
}

/** An upload function that records each call, and leaves each upload running until the test settles it. */
function handler(): { readonly calls: UploadCall[]; readonly upload: FileUploadHandler } {
    const calls: UploadCall[] = [];
    const upload: FileUploadHandler = (uploaded, context) => {
        const done = deferred<unknown>();
        calls.push({ context, done, file: uploaded });
        return done.promise;
    };
    return { calls, upload };
}

function image(name = "cat.png", size = 10, type = "image/png"): File {
    return new File([new Uint8Array(size)], name, { type });
}

/** The announcer of the last render. */
let announce: MockInstance<LiveAnnouncer["announce"]>;

async function render<T>(component: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [component] });
    const fixture = TestBed.createComponent(component);
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

/** Lets a settled upload's promise callbacks run, then the view catch up. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let i = 0; i < 3; i++) {
        await Promise.resolve();
    }
    await stable(fixture);
}

function editorOf(fixture: ComponentFixture<unknown>): Editor {
    return fixture.debugElement.query(By.directive(EditorComponent)).injector.get(EditorService).editor;
}

function contentOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(".ProseMirror") as HTMLElement;
}

function placeholders(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(contentOf(fixture).querySelectorAll<HTMLElement>("[role='img']"));
}

/** A paste as the browser sends it: `DataTransfer` isn't in jsdom, so a plain object stands in. */
function paste(target: HTMLElement, files: readonly File[], html = ""): Event {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    const clipboardData = {
        files,
        getData: (type: string) => (type === "text/html" ? html : ""),
        types: html ? ["text/html", "Files"] : ["Files"]
    };
    Object.defineProperty(event, "clipboardData", { value: clipboardData });
    target.dispatchEvent(event);
    return event;
}

function drop(target: HTMLElement, files: readonly File[]): Event {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    const dataTransfer = { dropEffect: "copy", files, getData: () => "", types: ["Files"] };
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
    target.dispatchEvent(event);
    return event;
}

async function axeViolations(element: Element): Promise<string[]> {
    const results = await axe.run(element, { rules: { "color-contrast": { enabled: false } } });
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.html).join(" | ")}`
    );
}

const objectUrlMethods = ["createObjectURL", "revokeObjectURL"] as const;
const objectUrlDescriptors = objectUrlMethods.map(name => Object.getOwnPropertyDescriptor(URL, name));
beforeEach(() => {
    // jsdom has no object URLs; the placeholder's preview uses one.
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
    objectUrlMethods.forEach((name, index) => {
        const descriptor = objectUrlDescriptors[index];
        if (descriptor) {
            Object.defineProperty(URL, name, descriptor);
        } else {
            delete (URL as unknown as Record<string, unknown>)[name];
        }
    });
    vi.restoreAllMocks();
    document.body.innerHTML = "";
});

describe("EditorComponent image upload", () => {
    it("uploads a pasted image, with a placeholder where it goes until the image takes its place", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        const editor = editorOf(fixture);
        editor.commands.setTextSelection(6);

        const event = paste(contentOf(fixture), [image()]);
        await stable(fixture);

        expect(event.defaultPrevented).toBe(true);
        expect(calls.map(call => call.file.name)).toEqual(["cat.png"]);
        const [placeholder] = placeholders(fixture);
        expect(placeholder?.getAttribute("aria-label")).toBe("Uploading cat.png");
        expect(placeholder?.querySelector("img")?.getAttribute("src")).toBe("blob:preview");
        expect(fixture.componentInstance.value()).toBe("<p>Hello</p>");
        expect(announce).toHaveBeenCalledWith("Uploading cat.png", "polite");

        calls[0]!.context.progress(5);
        const bar = placeholder?.lastElementChild?.firstElementChild as HTMLElement;
        expect(bar.style.inlineSize).toBe("50%");

        calls[0]!.done.resolve("https://example.com/cat.png");
        await settle(fixture);

        expect(placeholders(fixture)).toEqual([]);
        expect(fixture.componentInstance.value()).toContain('<p>Hello</p><img src="https://example.com/cat.png">');
        expect(announce).toHaveBeenCalledWith("cat.png inserted.", "polite");
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
        expect(editor.can().undo()).toBe(true);
    });

    it("keeps the placeholder through edits beside it, and drops it when the content around it goes", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        const editor = editorOf(fixture);
        editor.commands.setTextSelection(6);
        paste(contentOf(fixture), [image()]);
        await stable(fixture);

        // Backspace before the placeholder, and text typed after it.
        editor.commands.deleteRange({ from: 5, to: 6 });
        editor.commands.insertContentAt(5, "p!");
        editor.commands.insertContentAt(1, "Oh, ");
        await stable(fixture);
        expect(placeholders(fixture)).toHaveLength(1);

        calls[0]!.done.resolve("https://example.com/cat.png");
        await settle(fixture);
        const html = fixture.componentInstance.value();
        expect(html).toContain("<p>Oh, Hell</p>");
        expect(html.indexOf("Oh, Hell")).toBeLessThan(html.indexOf("<img"));
        expect(html.indexOf("<img")).toBeLessThan(html.indexOf("p!"));

        paste(contentOf(fixture), [image("dog.png")]);
        await stable(fixture);
        editor.commands.setContent("<p>Gone</p>");
        await stable(fixture);
        expect(placeholders(fixture)).toEqual([]);
        calls[1]!.done.resolve("https://example.com/dog.png");
        await settle(fixture);
        expect(editor.getHTML()).toBe("<p>Gone</p>");
    });

    it("puts the images of one paste in their order, whichever finishes first", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        editorOf(fixture).commands.setTextSelection(6);
        paste(contentOf(fixture), [image("one.png"), image("two.png"), image("three.png")]);
        await stable(fixture);
        expect(placeholders(fixture).map(element => element.getAttribute("aria-label"))).toEqual([
            "Uploading one.png",
            "Uploading two.png",
            "Uploading three.png"
        ]);

        calls[1]!.done.resolve("https://example.com/two.png");
        await settle(fixture);
        calls[0]!.done.resolve("https://example.com/one.png");
        await settle(fixture);
        calls[2]!.done.resolve("https://example.com/three.png");
        await settle(fixture);

        const sources = Array.from(contentOf(fixture).querySelectorAll("img")).map(img => img.getAttribute("src"));
        expect(sources).toEqual([
            "https://example.com/one.png",
            "https://example.com/two.png",
            "https://example.com/three.png"
        ]);
    });

    it("uploads a dropped image where it is dropped", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        const editor = editorOf(fixture);
        // jsdom has no layout to find the drop position from.
        vi.spyOn(editor.view, "posAtCoords").mockReturnValue({ inside: -1, pos: 3 });

        const event = drop(contentOf(fixture), [image()]);
        await stable(fixture);
        expect(event.defaultPrevented).toBe(true);
        expect(calls).toHaveLength(1);

        calls[0]!.done.resolve("https://example.com/cat.png");
        await settle(fixture);
        expect(fixture.componentInstance.value()).toBe('<p>He</p><img src="https://example.com/cat.png"><p>llo</p>');
    });

    it("removes the placeholder and says so when an upload fails or returns no address", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        paste(contentOf(fixture), [image("cat.png"), image("dog.png")]);
        await stable(fixture);

        calls[0]!.done.reject(new Error("offline"));
        calls[1]!.done.resolve({ url: "https://example.com/dog.png" });
        await settle(fixture);

        expect(placeholders(fixture)).toEqual([]);
        expect(fixture.componentInstance.value()).toBe("<p>Hello</p>");
        expect(announce).toHaveBeenCalledWith("cat.png couldn't be uploaded.", "polite");
        expect(announce).toHaveBeenCalledWith("dog.png couldn't be uploaded.", "polite");
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("imageUpload should return the image's address"), {
            url: "https://example.com/dog.png"
        });
    });

    it("turns down a file larger than imageMaxFileSize, without uploading it", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => {
            host.maxFileSize.set(5);
            host.upload.set(upload);
        });
        paste(contentOf(fixture), [image("big.png", 10)]);
        await stable(fixture);

        expect(calls).toEqual([]);
        expect(placeholders(fixture)).toEqual([]);
        expect(announce).toHaveBeenCalledWith(
            expect.stringMatching(/^big\.png wasn't added\. The file is larger than /u),
            "polite"
        );
    });

    it("leaves a paste to the editor for files it doesn't take, with HTML, and without imageUpload", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));

        expect(paste(contentOf(fixture), [image("notes.txt", 10, "text/plain")]).defaultPrevented).toBe(false);
        paste(contentOf(fixture), [image()], '<img src="https://example.com/web.png">');
        fixture.componentInstance.upload.set(null);
        await stable(fixture);
        expect(paste(contentOf(fixture), [image()]).defaultPrevented).toBe(false);
        // ProseMirror reads a paste it didn't take again after 50ms, from a hidden element.
        await new Promise(resolve => setTimeout(resolve, 60));
        await stable(fixture);

        expect(calls).toEqual([]);
        expect(placeholders(fixture)).toEqual([]);
    });

    it("stops its uploads when the editor goes away", async () => {
        const { calls, upload } = handler();
        const fixture = await render(UploadHostComponent, host => host.upload.set(upload));
        paste(contentOf(fixture), [image()]);
        await stable(fixture);

        fixture.destroy();
        expect(calls[0]!.context.signal.aborted).toBe(true);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");

        calls[0]!.done.resolve("https://example.com/cat.png");
        await settle(fixture);
        expect(announce).not.toHaveBeenCalledWith("cat.png inserted.", "polite");
    });
});

describe("EditorImageInserterComponent upload", () => {
    it("takes an image file when the editor uploads images, and puts its address in the link field", async () => {
        const { calls, upload } = handler();
        const fixture = await render(InserterHostComponent);
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelector("mona-file-upload")).toBeNull();

        fixture.componentInstance.upload.set(upload);
        await stable(fixture);
        expect(root.querySelector("mona-file-upload")).not.toBeNull();
        expect(await axeViolations(root)).toEqual([]);

        const input = root.querySelector("input[type='file']") as HTMLInputElement;
        Object.defineProperty(input, "files", { configurable: true, value: [image()] });
        input.dispatchEvent(new Event("change"));
        await stable(fixture);
        calls[0]!.done.resolve("https://example.com/cat.png");
        await settle(fixture);

        const link = root.querySelector("mona-text-box input") as HTMLInputElement;
        expect(link.value).toBe("https://example.com/cat.png");
        const insert = Array.from(root.querySelectorAll("button")).find(
            button => button.textContent?.trim() === "Insert"
        );
        insert?.click();
        expect(fixture.componentInstance.inserted[0]?.link).toBe("https://example.com/cat.png");
    });

    it("edits an image: its fields filled in, and Save", async () => {
        const fixture = await render(InserterHostComponent, host =>
            host.image.set({ alt: "A cat", height: 80, link: "https://example.com/cat.png", width: 120 })
        );
        const root = fixture.nativeElement as HTMLElement;
        const values = Array.from(root.querySelectorAll<HTMLInputElement>("mona-text-box input")).map(
            input => input.value
        );
        expect(values).toEqual(["https://example.com/cat.png", "A cat"]);

        const save = Array.from(root.querySelectorAll("button")).find(button => button.textContent?.trim() === "Save");
        save?.click();
        expect(fixture.componentInstance.inserted).toEqual([
            { alt: "A cat", height: 80, link: "https://example.com/cat.png", width: 120 }
        ]);
    });
});

describe("EditorImageComponent", () => {
    it("edits the selected image instead of adding one", async () => {
        const fixture = await render(UploadHostComponent, host =>
            host.value.set('<p>Hi</p><img src="https://example.com/cat.png" alt="A cat">')
        );
        const editor = editorOf(fixture);
        const button = (): HTMLButtonElement =>
            (fixture.nativeElement as HTMLElement).querySelector("mona-editor-image button") as HTMLButtonElement;
        expect(button().title).toBe("Insert image");

        editor.commands.setNodeSelection(4);
        await stable(fixture);
        expect(button().title).toBe("Edit image");

        button().click();
        await stable(fixture);
        const dialog = document.querySelector("[role='dialog']") as HTMLElement;
        expect(dialog.textContent).toContain("Edit image");
        const alt = Array.from(dialog.querySelectorAll<HTMLInputElement>("mona-text-box input"))[1] as HTMLInputElement;
        expect(alt.value).toBe("A cat");

        alt.value = "A sleeping cat";
        alt.dispatchEvent(new Event("input"));
        await stable(fixture);
        const save = Array.from(dialog.querySelectorAll("button")).find(
            button => button.textContent?.trim() === "Save"
        );
        save?.click();
        await stable(fixture);

        expect(editor.getHTML()).toMatch(
            /^<p>Hi<\/p><img src="https:\/\/example\.com\/cat\.png" alt="A sleeping cat" title="A sleeping cat">(<p><\/p>)?$/u
        );
    });
});
