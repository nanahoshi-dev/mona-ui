import { HttpEventType, HttpHeaderResponse, HttpResponse } from "@angular/common/http";
import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField, required, requiredError, validate } from "@angular/forms/signals";
import { FieldsetComponent } from "@nanahoshi/mona-ui/fieldset";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FileUploadContext, FileUploadHandler } from "../../models/FileUploadHandler";
import type { FileUploadItem } from "../../models/FileUploadItem";
import { FileUploadComponent } from "./file-upload.component";

@Component({
    template: `
        <mona-file-upload
            #picker="monaFileUpload"
            aria-label="Attachments"
            [accept]="accept()"
            [autoUpload]="autoUpload()"
            [disabled]="disabled()"
            [maxFileSize]="maxFileSize()"
            [maxFiles]="maxFiles()"
            [minFileSize]="minFileSize()"
            [multiple]="multiple()"
            [readonly]="readonly()"
            [upload]="upload()"
            [(value)]="value"
            (remove)="removed.push($event)"
            (touch)="touches = touches + 1"
            (uploadError)="failures.push($event)"
            (uploadSuccess)="successes.push($event)" />
    `,
    imports: [FileUploadComponent]
})
class HostComponent {
    public readonly accept = signal("");
    public readonly autoUpload = signal(true);
    public readonly disabled = signal(false);
    public readonly failures: FileUploadItem[] = [];
    public readonly maxFileSize = signal<number | null>(null);
    public readonly maxFiles = signal<number | null>(null);
    public readonly minFileSize = signal<number | null>(null);
    public readonly multiple = signal(true);
    public readonly readonly = signal(false);
    public readonly removed: FileUploadItem[] = [];
    public readonly successes: FileUploadItem[] = [];
    public readonly upload = signal<FileUploadHandler | null>(null);
    public readonly value = signal<File[]>([]);
    public touches = 0;
}

@Component({
    template: `
        <mona-form-field label="Attachments" hint="Up to three files.">
            <mona-file-upload [formField]="claim.files" [upload]="upload" />
        </mona-form-field>
    `,
    imports: [FileUploadComponent, FormField, FormFieldComponent]
})
class SignalFormHostComponent {
    public readonly model = signal({ files: [] as File[] });
    public readonly claim = form(this.model, path => {
        required(path.files);
        // Signal Forms' required doesn't treat an empty list as missing, so this reports it.
        validate(path.files, ({ value }) => (value().length === 0 ? requiredError() : undefined));
    });
    public upload: FileUploadHandler | null = null;
}

@Component({
    template: `
        <mona-fieldset legend="Section" [disabled]="off()">
            <mona-file-upload aria-label="Attachments" />
        </mona-fieldset>
    `,
    imports: [FieldsetComponent, FileUploadComponent]
})
class FieldsetHostComponent {
    public readonly off = signal(true);
}

@Component({
    template: `
        <mona-label text="Wrapped">
            <mona-file-upload />
        </mona-label>
        <mona-label text="Pointed" [for]="pointed" />
        <mona-file-upload #pointed />
    `,
    imports: [FileUploadComponent, LabelComponent]
})
class LabelHostComponent {}

interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly reject: (error: unknown) => void;
    readonly resolve: (value: T) => void;
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

interface UploadCall {
    readonly context: FileUploadContext;
    readonly done: Deferred<unknown>;
    readonly file: File;
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

function file(name: string, size = 10, type = ""): File {
    return new File([new Uint8Array(size)], name, { lastModified: 1, type });
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function axeViolations(element: Element): Promise<string[]> {
    const result = await axe.run(
        { include: [element] },
        { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }
    );
    return result.violations.map(violation => violation.id);
}

/** A drag event as the browser sends it: `DataTransfer` isn't in jsdom, so a plain object stands in. */
function dragEvent(type: string, files: readonly File[] = [], types: readonly string[] = ["Files"]): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { dropEffect: "none", files, types } });
    return event;
}

describe("FileUploadComponent", () => {
    /** The upload of the last setup, whose status region `lastAnnouncement` reads. */
    let lastRoot: HTMLElement | null = null;

    beforeEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
    });

    afterEach(() => {
        lastRoot = null;
        vi.restoreAllMocks();
    });

    async function setup(): Promise<{
        fixture: ComponentFixture<HostComponent>;
        host: HostComponent;
        root: HTMLElement;
    }> {
        const fixture = TestBed.createComponent(HostComponent);
        await settle(fixture);
        const root = fixture.nativeElement.querySelector("mona-file-upload") as HTMLElement;
        lastRoot = root;
        return { fixture, host: fixture.componentInstance, root };
    }

    function zone(root: HTMLElement): HTMLElement {
        return root.firstElementChild as HTMLElement;
    }

    function browseButton(root: HTMLElement): HTMLButtonElement {
        return zone(root).querySelector("button") as HTMLButtonElement;
    }

    function fileInput(root: HTMLElement): HTMLInputElement {
        return root.querySelector("input[type='file']") as HTMLInputElement;
    }

    async function choose(
        fixture: ComponentFixture<unknown>,
        root: HTMLElement,
        files: readonly File[]
    ): Promise<void> {
        const input = fileInput(root);
        Object.defineProperty(input, "files", { configurable: true, value: files });
        input.dispatchEvent(new Event("change"));
        await settle(fixture);
    }

    function rows(root: HTMLElement): HTMLElement[] {
        return Array.from(root.querySelectorAll<HTMLElement>("[data-file-row]"));
    }

    function rowText(row: HTMLElement): string {
        return (row.textContent ?? "").replace(/\s+/g, " ").trim();
    }

    function button(row: HTMLElement, label: string): HTMLButtonElement {
        const found = row.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
        if (found == null) {
            throw new Error(`No "${label}" button in ${rowText(row)}`);
        }
        return found;
    }

    /** What the component's status region says. */
    function lastAnnouncement(root: HTMLElement | null = lastRoot): string {
        return root?.querySelector("[role='status']")?.textContent?.trim() ?? "";
    }

    describe("picking files", () => {
        it("lists the chosen files with their sizes, puts them in the value, and announces them", async () => {
            const { fixture, host, root } = await setup();
            const report = file("report.pdf", 1536);
            const photo = file("photo.png", 20);

            await choose(fixture, root, [report, photo]);

            expect(host.value()).toEqual([report, photo]);
            expect(rows(root).map(rowText)).toEqual(["report.pdf 1.5 kB", "photo.png 20 bytes"]);
            expect(root.querySelector("ul")?.getAttribute("aria-label")).toBe("Files");
            expect(lastAnnouncement()).toBe("2 files added.");
            expect(fileInput(root).value).toBe("");
        });

        it("opens the dialog from the browse button and from a click on the zone", async () => {
            const { root } = await setup();
            const click = vi.spyOn(fileInput(root), "click").mockImplementation(() => undefined);

            browseButton(root).click();
            zone(root).click();

            expect(click).toHaveBeenCalledTimes(2);
        });

        it("passes accept and multiple to the file dialog", async () => {
            const { fixture, host, root } = await setup();
            host.accept.set(".pdf,image/*");
            host.multiple.set(false);
            await settle(fixture);

            expect(fileInput(root).accept).toBe(".pdf,image/*");
            expect(fileInput(root).multiple).toBe(false);
            expect(fileInput(root).getAttribute("aria-hidden")).toBe("true");
            expect(fileInput(root).tabIndex).toBe(-1);
        });

        it("skips a file that's already in the list", async () => {
            const { fixture, host, root } = await setup();
            const report = file("report.pdf");

            await choose(fixture, root, [report]);
            await choose(fixture, root, [file("report.pdf"), file("notes.txt")]);

            expect(host.value().map(added => added.name)).toEqual(["report.pdf", "notes.txt"]);
        });

        it("replaces the file when only one can be added", async () => {
            const { fixture, host, root } = await setup();
            host.multiple.set(false);
            await settle(fixture);

            expect(zone(root).textContent).toContain("Drag a file here");
            expect(browseButton(root).textContent?.trim()).toBe("Choose a file");

            await choose(fixture, root, [file("first.pdf")]);
            await choose(fixture, root, [file("second.pdf")]);

            expect(host.value().map(added => added.name)).toEqual(["second.pdf"]);
            expect(host.removed).toEqual([]);
        });
    });

    describe("checks", () => {
        it("lists files that fail the type or size checks with the reason, and leaves them out of the value", async () => {
            const { fixture, host, root } = await setup();
            host.accept.set(".pdf, image/*");
            host.maxFileSize.set(1024);
            host.minFileSize.set(2);
            await settle(fixture);
            const report = file("report.pdf", 100);

            await choose(fixture, root, [
                report,
                file("setup.exe", 100, "application/x-msdownload"),
                file("huge.png", 4096, "image/png"),
                file("empty.pdf", 0)
            ]);

            expect(host.value()).toEqual([report]);
            expect(rows(root).map(row => row.dataset["status"])).toEqual([
                "selected",
                "rejected",
                "rejected",
                "rejected"
            ]);
            expect(rows(root).slice(1).map(rowText)).toEqual([
                "setup.exe This file type isn't accepted.",
                "huge.png The file is larger than 1 kB.",
                "empty.pdf The file is smaller than 2 bytes."
            ]);
            expect(lastAnnouncement()).toBe(
                "1 file added. setup.exe wasn't added. This file type isn't accepted. huge.png wasn't added. " +
                    "The file is larger than 1 kB. empty.pdf wasn't added. The file is smaller than 2 bytes."
            );
        });

        it("clears the rejected files on the next selection, and lets them be dismissed without emitting remove", async () => {
            const { fixture, host, root } = await setup();
            host.accept.set(".pdf");
            await settle(fixture);

            await choose(fixture, root, [file("a.exe")]);
            button(rows(root)[0], "Remove a.exe").click();
            await settle(fixture);
            expect(rows(root)).toEqual([]);

            await choose(fixture, root, [file("b.exe")]);
            await choose(fixture, root, [file("c.pdf")]);
            expect(rows(root).map(rowText)).toEqual(["c.pdf 10 bytes"]);
            expect(host.removed).toEqual([]);
        });

        it("rejects the files past maxFiles", async () => {
            const { fixture, host, root } = await setup();
            host.maxFiles.set(2);
            await settle(fixture);

            await choose(fixture, root, [file("a.txt")]);
            await choose(fixture, root, [file("b.txt"), file("c.txt")]);

            expect(host.value().map(added => added.name)).toEqual(["a.txt", "b.txt"]);
            expect(rowText(rows(root)[2])).toBe("c.txt No more than 2 files can be added.");
        });

        it("keeps the first of several files dropped when only one can be added", async () => {
            const { fixture, host, root } = await setup();
            host.multiple.set(false);
            await settle(fixture);

            zone(root).dispatchEvent(dragEvent("drop", [file("a.txt"), file("b.txt")]));
            await settle(fixture);

            expect(host.value().map(added => added.name)).toEqual(["a.txt"]);
            expect(rowText(rows(root)[1])).toBe("b.txt No more than 1 file can be added.");
        });

        it("keeps the file in the list when a replacement is rejected", async () => {
            const { fixture, host, root } = await setup();
            host.multiple.set(false);
            host.accept.set(".pdf");
            await settle(fixture);

            await choose(fixture, root, [file("a.pdf")]);
            await choose(fixture, root, [file("b.exe")]);

            expect(host.value().map(added => added.name)).toEqual(["a.pdf"]);
        });

        it("states the checks under the drop zone, and describes the browse button with them", async () => {
            const { fixture, host, root } = await setup();
            expect(browseButton(root).hasAttribute("aria-describedby")).toBe(false);

            host.accept.set(".pdf,.docx");
            host.maxFileSize.set(5 * 1024 * 1024);
            host.maxFiles.set(3);
            await settle(fixture);

            const id = browseButton(root).getAttribute("aria-describedby") ?? "";
            expect(root.querySelector(`#${id}`)?.textContent).toBe(
                "File types: PDF or DOCX · Max. file size: 5 MB · Up to 3 files"
            );
        });
    });

    describe("removing files", () => {
        it("removes a file from the list and the value, emits remove, and announces it", async () => {
            const { fixture, host, root } = await setup();
            const a = file("a.txt");
            const b = file("b.txt");
            await choose(fixture, root, [a, b]);

            button(rows(root)[0], "Remove a.txt").click();
            await settle(fixture);

            expect(host.value()).toEqual([b]);
            expect(host.removed.map(item => item.file)).toEqual([a]);
            expect(lastAnnouncement()).toBe("a.txt removed.");
        });

        it("announces the same message again by emptying the status region first", async () => {
            const { fixture, root } = await setup();
            await choose(fixture, root, [
                new File(["a"], "a.txt", { lastModified: 1 }),
                new File(["b"], "a.txt", { lastModified: 2 })
            ]);

            button(rows(root)[0], "Remove a.txt").click();
            await settle(fixture);
            expect(lastAnnouncement()).toBe("a.txt removed.");

            button(rows(root)[0], "Remove a.txt").click();
            fixture.detectChanges();
            expect(lastAnnouncement()).toBe("");

            await new Promise(resolve => setTimeout(resolve, 150));
            await settle(fixture);
            expect(lastAnnouncement()).toBe("a.txt removed.");
        });

        it("moves focus to the next row, then the one before, then the browse button", async () => {
            const { fixture, root } = await setup();
            await choose(fixture, root, [file("a.txt"), file("b.txt"), file("c.txt")]);

            const first = button(rows(root)[1], "Remove b.txt");
            first.focus();
            first.click();
            await settle(fixture);
            expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove c.txt");

            (document.activeElement as HTMLButtonElement).click();
            await settle(fixture);
            expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove a.txt");

            (document.activeElement as HTMLButtonElement).click();
            await settle(fixture);
            expect(document.activeElement).toBe(browseButton(root));
        });

        it("replaces the list when the value is set from outside", async () => {
            const { fixture, host, root } = await setup();
            await choose(fixture, root, [file("a.txt")]);

            const replacement = file("z.txt");
            host.value.set([replacement]);
            await settle(fixture);
            expect(rows(root).map(rowText)).toEqual(["z.txt 10 bytes"]);

            host.value.set([]);
            await settle(fixture);
            expect(rows(root)).toEqual([]);
            expect(host.removed).toEqual([]);
        });
    });

    describe("drag and drop", () => {
        it("marks the zone while files are dragged over it, through its children", async () => {
            const { fixture, root } = await setup();

            const enter = dragEvent("dragenter");
            zone(root).dispatchEvent(enter);
            browseButton(root).dispatchEvent(dragEvent("dragenter"));
            zone(root).dispatchEvent(dragEvent("dragleave"));
            await settle(fixture);
            expect(enter.defaultPrevented).toBe(true);
            expect(zone(root).dataset["dragging"]).toBe("true");
            expect(zone(root).textContent).toContain("Drop to add");

            const over = dragEvent("dragover");
            zone(root).dispatchEvent(over);
            expect(over.defaultPrevented).toBe(true);
            expect((over as Event & { dataTransfer: { dropEffect: string } }).dataTransfer.dropEffect).toBe("copy");

            zone(root).dispatchEvent(dragEvent("dragleave"));
            await settle(fixture);
            expect(zone(root).hasAttribute("data-dragging")).toBe(false);
        });

        it("adds dropped files and marks the upload as touched", async () => {
            const { fixture, host, root } = await setup();
            const dropped = file("dropped.txt");

            zone(root).dispatchEvent(dragEvent("dragenter"));
            const drop = dragEvent("drop", [dropped]);
            zone(root).dispatchEvent(drop);
            await settle(fixture);

            expect(drop.defaultPrevented).toBe(true);
            expect(host.value()).toEqual([dropped]);
            expect(host.touches).toBe(1);
            expect(zone(root).hasAttribute("data-dragging")).toBe(false);
        });

        it("ignores drags that carry no files", async () => {
            const { fixture, root } = await setup();

            const over = dragEvent("dragover", [], ["text/plain"]);
            zone(root).dispatchEvent(over);
            zone(root).dispatchEvent(dragEvent("dragenter", [], ["text/plain"]));
            await settle(fixture);

            expect(over.defaultPrevented).toBe(false);
            expect(zone(root).hasAttribute("data-dragging")).toBe(false);
        });

        it("refuses a drop while disabled, without letting the browser open the file", async () => {
            const { fixture, host, root } = await setup();
            host.disabled.set(true);
            await settle(fixture);

            const over = dragEvent("dragover");
            zone(root).dispatchEvent(over);
            const drop = dragEvent("drop", [file("a.txt")]);
            zone(root).dispatchEvent(drop);
            await settle(fixture);

            expect((over as Event & { dataTransfer: { dropEffect: string } }).dataTransfer.dropEffect).toBe("none");
            expect(drop.defaultPrevented).toBe(true);
            expect(host.value()).toEqual([]);
            expect(host.touches).toBe(0);
        });
    });

    describe("uploading", () => {
        /** The clear and upload buttons below the list. */
        function actionButtons(root: HTMLElement): HTMLButtonElement[] {
            return Array.from(root.querySelectorAll<HTMLButtonElement>(":scope > div:not(:first-child) > button"));
        }

        function progressBar(row: HTMLElement): HTMLElement | null {
            return row.querySelector("mona-progress-bar");
        }

        it("uploads each file as it's added, shows its progress, and adds it to the value once uploaded", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);
            const report = file("report.pdf", 2048);

            await choose(fixture, root, [report]);
            expect(calls.map(call => call.file)).toEqual([report]);
            expect(rows(root)[0].dataset["status"]).toBe("uploading");
            expect(rowText(rows(root)[0])).toBe("report.pdf 2 kB · Uploading");
            expect(progressBar(rows(root)[0])?.getAttribute("aria-label")).toBe("report.pdf");
            expect(host.value()).toEqual([]);
            expect(fixture.debugElement.children[0].references["picker"].uploading()).toBe(true);

            calls[0].context.progress(1024);
            await settle(fixture);
            expect(rowText(rows(root)[0])).toBe("report.pdf 2 kB · Uploading · 50%");
            expect(progressBar(rows(root)[0])?.getAttribute("aria-valuenow")).toBe("50");

            calls[0].done.resolve({ id: 7 });
            await settle(fixture);
            expect(rowText(rows(root)[0])).toBe("report.pdf 2 kB · Uploaded");
            expect(progressBar(rows(root)[0])).toBeNull();
            expect(host.value()).toEqual([report]);
            expect(host.successes.map(item => item.response)).toEqual([{ id: 7 }]);
            expect(lastAnnouncement()).toBe("report.pdf uploaded.");
        });

        it("marks a failed upload, and uploads it again on retry with focus on its cancel button", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);

            await choose(fixture, root, [file("a.txt")]);
            const failure = new Error("offline");
            calls[0].done.reject(failure);
            await settle(fixture);

            expect(rows(root)[0].dataset["status"]).toBe("failed");
            expect(rowText(rows(root)[0])).toBe("a.txt The upload failed.");
            expect(host.failures.map(item => item.error)).toEqual([failure]);
            expect(host.value()).toEqual([]);
            expect(lastAnnouncement()).toBe("a.txt couldn't be uploaded.");

            const retry = button(rows(root)[0], "Retry the upload of a.txt");
            retry.focus();
            retry.click();
            await settle(fixture);

            expect(calls).toHaveLength(2);
            expect(rows(root)[0].dataset["status"]).toBe("uploading");
            expect(document.activeElement?.getAttribute("aria-label")).toBe("Cancel the upload of a.txt");
        });

        it("fails an upload whose function throws", async () => {
            const { fixture, host, root } = await setup();
            host.upload.set(() => {
                throw new Error("bad");
            });
            await settle(fixture);

            await choose(fixture, root, [file("a.txt")]);

            expect(rows(root)[0].dataset["status"]).toBe("failed");
        });

        it("cancels an upload: aborts its signal, removes the file and ignores what it reports later", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);

            await choose(fixture, root, [file("a.txt")]);
            button(rows(root)[0], "Cancel the upload of a.txt").click();
            await settle(fixture);

            expect(calls[0].context.signal.aborted).toBe(true);
            expect(rows(root)).toEqual([]);
            expect(host.removed.map(item => item.status)).toEqual(["uploading"]);

            calls[0].done.resolve("late");
            await settle(fixture);
            expect(host.successes).toEqual([]);
            expect(host.value()).toEqual([]);
        });

        it("reads HttpClient's progress events and response body from an observable, and unsubscribes on cancel", async () => {
            const { fixture, host, root } = await setup();
            const subjects: Array<Subject<unknown>> = [];
            host.upload.set(() => {
                const subject = new Subject<unknown>();
                subjects.push(subject);
                return subject.asObservable();
            });
            await settle(fixture);

            await choose(fixture, root, [file("a.txt", 100), file("b.txt", 100)]);
            const [a, b] = subjects;
            a.next({ type: HttpEventType.Sent });
            a.next({ loaded: 25, total: 100, type: HttpEventType.UploadProgress });
            await settle(fixture);
            expect(rowText(rows(root)[0])).toContain("25%");

            a.next(new HttpHeaderResponse({ status: 200 }));
            a.next(new HttpResponse({ body: { id: "a" }, status: 200 }));
            a.complete();
            await settle(fixture);
            expect(host.successes.map(item => item.response)).toEqual([{ id: "a" }]);

            button(rows(root)[1], "Cancel the upload of b.txt").click();
            await settle(fixture);
            expect(b.observed).toBe(false);
        });

        it("keeps the last value of any other observable as the response", async () => {
            const { fixture, host, root } = await setup();
            const subject = new Subject<unknown>();
            host.upload.set(() => subject.asObservable());
            await settle(fixture);

            await choose(fixture, root, [file("a.txt")]);
            subject.next("first");
            subject.next({ url: "/files/a" });
            subject.complete();
            await settle(fixture);

            expect(host.successes.map(item => item.response)).toEqual([{ url: "/files/a" }]);
        });

        it("waits for the upload button while autoUpload is off, and clears the list from its clear button", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            host.autoUpload.set(false);
            await settle(fixture);

            await choose(fixture, root, [file("a.txt"), file("b.txt")]);
            expect(calls).toEqual([]);
            expect(rowText(rows(root)[0])).toBe("a.txt 10 bytes · Ready to upload");

            const actions = actionButtons(root);
            expect(actions.map(action => action.textContent?.trim())).toEqual(["Clear", "Upload"]);
            actions[1].click();
            await settle(fixture);
            expect(calls.map(call => call.file.name)).toEqual(["a.txt", "b.txt"]);
            expect(document.activeElement).toBe(browseButton(root));

            calls[0].done.resolve(null);
            await settle(fixture);
            await choose(fixture, root, [file("c.txt")]);
            actionButtons(root)[0].click();
            await settle(fixture);

            expect(rows(root)).toEqual([]);
            expect(calls[1].context.signal.aborted).toBe(true);
            expect(host.removed.map(item => item.file.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
            expect(host.value()).toEqual([]);
        });

        it("treats a value set from outside as uploaded files, and stops the uploads that are running", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);
            await choose(fixture, root, [file("a.txt")]);

            const existing = file("existing.pdf");
            host.value.set([existing]);
            await settle(fixture);

            expect(calls[0].context.signal.aborted).toBe(true);
            expect(rows(root).map(row => row.dataset["status"])).toEqual(["uploaded"]);
        });

        it("aborts the running uploads when it's destroyed", async () => {
            const { fixture, host, root } = await setup();
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);
            await choose(fixture, root, [file("a.txt")]);

            fixture.destroy();

            expect(calls[0].context.signal.aborted).toBe(true);
        });
    });

    describe("state", () => {
        it("turns everything off while disabled", async () => {
            const { fixture, host, root } = await setup();
            await choose(fixture, root, [file("a.txt")]);
            host.disabled.set(true);
            await settle(fixture);
            const click = vi.spyOn(fileInput(root), "click");

            zone(root).click();

            expect(click).not.toHaveBeenCalled();
            expect(root.dataset["disabled"]).toBe("true");
            expect(zone(root).dataset["disabled"]).toBe("true");
            expect(browseButton(root).disabled).toBe(true);
            expect(fileInput(root).disabled).toBe(true);
            expect(button(rows(root)[0], "Remove a.txt").disabled).toBe(true);
        });

        it("keeps the list as it is while read-only", async () => {
            const { fixture, host, root } = await setup();
            await choose(fixture, root, [file("a.txt")]);
            host.readonly.set(true);
            await settle(fixture);

            zone(root).dispatchEvent(dragEvent("drop", [file("b.txt")]));
            await settle(fixture);

            expect(root.dataset["readonly"]).toBe("true");
            expect(browseButton(root).disabled).toBe(true);
            expect(rows(root)[0].querySelector("button")).toBeNull();
            expect(host.value().map(added => added.name)).toEqual(["a.txt"]);
        });

        it("is disabled by a disabled fieldset", async () => {
            const fixture = TestBed.createComponent(FieldsetHostComponent);
            await settle(fixture);
            const root = fixture.nativeElement.querySelector("mona-file-upload") as HTMLElement;

            expect(browseButton(root).disabled).toBe(true);

            fixture.componentInstance.off.set(false);
            await settle(fixture);
            expect(browseButton(root).disabled).toBe(false);
        });

        it("emits touch when focus leaves it, not when it moves inside or the file dialog takes the window", async () => {
            const { fixture, host, root } = await setup();
            await choose(fixture, root, [file("a.txt")]);
            const remove = button(rows(root)[0], "Remove a.txt");

            browseButton(root).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: remove }));
            expect(host.touches).toBe(0);

            const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(false);
            browseButton(root).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            expect(host.touches).toBe(0);

            hasFocus.mockReturnValue(true);
            browseButton(root).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            expect(host.touches).toBe(1);
        });

        it("names the group, and focuses the browse button", async () => {
            const { fixture, root } = await setup();

            expect(root.getAttribute("role")).toBe("group");
            expect(root.getAttribute("aria-label")).toBe("Attachments");

            fixture.debugElement.children[0].references["picker"].focus();
            expect(document.activeElement).toBe(browseButton(root));
        });

        it("passes axe with files in every status", async () => {
            const { fixture, host, root } = await setup();
            host.accept.set(".txt");
            host.maxFileSize.set(1024);
            const { calls, upload } = handler();
            host.upload.set(upload);
            await settle(fixture);

            await choose(fixture, root, [file("a.txt"), file("b.txt"), file("c.txt"), file("d.exe")]);
            calls[0].done.resolve(null);
            calls[1].done.reject(new Error("offline"));
            await settle(fixture);

            expect(rows(root).map(row => row.dataset["status"])).toEqual([
                "uploaded",
                "failed",
                "uploading",
                "rejected"
            ]);
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("forms", () => {
        it("works as a signal form field: required until a file is uploaded, and named and described by the form field", async () => {
            const fixture = TestBed.createComponent(SignalFormHostComponent);
            const done = deferred<unknown>();
            fixture.componentInstance.upload = () => done.promise;
            await settle(fixture);
            const host = fixture.componentInstance;
            const root = fixture.nativeElement.querySelector("mona-file-upload") as HTMLElement;
            const formField = fixture.nativeElement.querySelector("mona-form-field") as HTMLElement;

            const labelId = root.getAttribute("aria-labelledby") ?? "";
            expect(formField.querySelector(`#${labelId}`)?.textContent?.trim()).toContain("Attachments");
            const describedBy = (browseButton(root).getAttribute("aria-describedby") ?? "").split(" ");
            expect(describedBy.map(id => formField.querySelector(`#${id}`)?.textContent?.trim())).toContain(
                "Up to three files."
            );

            browseButton(root).dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            await settle(fixture);
            expect(host.claim.files().touched()).toBe(true);
            expect(root.dataset["invalid"]).toBe("true");
            expect(formField.textContent).toContain("This field is required.");

            const uploaded = file("claim.pdf");
            await choose(fixture, root, [uploaded]);
            expect(host.model().files).toEqual([]);
            expect(host.claim.files().valid()).toBe(false);

            done.resolve(null);
            await settle(fixture);
            expect(host.model().files).toEqual([uploaded]);
            expect(host.claim.files().valid()).toBe(true);
            expect(root.hasAttribute("data-invalid")).toBe(false);
        });

        it("is named by a mona-label around it or pointing at it, and focused from its caption", async () => {
            const fixture = TestBed.createComponent(LabelHostComponent);
            await settle(fixture);
            const [wrapped, pointed] = Array.from(
                fixture.nativeElement.querySelectorAll("mona-file-upload")
            ) as HTMLElement[];
            const nameOf = (upload: HTMLElement): string | null | undefined =>
                document.getElementById(upload.getAttribute("aria-labelledby") ?? "")?.textContent?.trim();

            expect(nameOf(wrapped)).toBe("Wrapped");
            expect(nameOf(pointed)).toBe("Pointed");

            const click = vi.spyOn(fileInput(wrapped), "click").mockImplementation(() => undefined);
            document.getElementById(wrapped.getAttribute("aria-labelledby") ?? "")?.click();
            expect(document.activeElement).toBe(browseButton(wrapped));
            expect(click).not.toHaveBeenCalled();

            // The zone opens the dialog once: the label around it doesn't also click the browse button.
            (zone(wrapped).querySelector("span") as HTMLElement).click();
            expect(click).toHaveBeenCalledTimes(1);
        });

        it("passes axe inside a form field", async () => {
            const fixture = TestBed.createComponent(SignalFormHostComponent);
            await settle(fixture);

            expect(await axeViolations(fixture.nativeElement)).toEqual([]);
        });
    });
});
