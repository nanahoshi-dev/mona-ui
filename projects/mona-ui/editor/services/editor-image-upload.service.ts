import { DOCUMENT } from "@angular/common";
import { DestroyRef, inject, Injectable, isDevMode, signal, untracked } from "@angular/core";
import { type FileUploadHandler, formatFileSize } from "@nanahoshi/mona-ui/file-upload";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { matchesAccept, parseAccept, runUpload } from "@nanahoshi/mona-ui/internal";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import type { EditorView } from "@tiptap/pm/view";
import {
    addImagePlaceholder,
    findImagePlaceholder,
    imagePlaceholderRemoval,
    removeImagePlaceholder
} from "../extensions/ImageUpload";
import { EDITOR_DEFAULT_MESSAGES } from "../i18n/editor.default-messages";
import {
    EDITOR_IMAGE_UPLOAD_BAR_CLASSES,
    EDITOR_IMAGE_UPLOAD_CLASSES,
    EDITOR_IMAGE_UPLOAD_PREVIEW_CLASSES,
    EDITOR_IMAGE_UPLOAD_TRACK_CLASSES
} from "../styles/editor.styles";
import { type EditorImageUploader, EditorService } from "./editor.service";

/**
 * How the editor uploads images.
 * @internal
 */
export interface EditorImageUploadOptions {
    /** The `accept` tokens an image file must match, such as `image/*`. */
    readonly accept: string;
    /** The upload function, or null when the editor doesn't upload images. */
    readonly handler: FileUploadHandler | null;
    /** The largest file, in bytes, or null for no limit. */
    readonly maxFileSize: number | null;
}

/**
 * Uploads the images pasted or dropped into the editor: a placeholder shows each one where it goes while it uploads,
 * and the image takes its place once the upload returns its address.
 * @internal
 */
@Injectable()
export class EditorImageUploadService implements EditorImageUploader {
    readonly #announcer = injectLiveAnnouncer();
    readonly #document = inject(DOCUMENT);
    readonly #editorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    readonly #messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    readonly #uploads = new Map<string, () => void>();
    #nextId = 0;

    /** Set by the editor from its `imageUpload`, `imageAccept` and `imageMaxFileSize`. */
    public readonly options = signal<EditorImageUploadOptions>({ accept: "image/*", handler: null, maxFileSize: null });

    public constructor() {
        this.#editorService.imageUploader = this;
        inject(DestroyRef).onDestroy(() => {
            for (const abort of [...this.#uploads.values()]) {
                abort();
            }
            this.#uploads.clear();
        });
    }

    /** The files to upload out of a paste or drop: none without an upload function, else those `accept` allows. */
    public accepted(files: readonly File[]): File[] {
        const { accept, handler } = untracked(this.options);
        if (handler == null) {
            return [];
        }
        const tokens = parseAccept(accept);
        return files.filter(file => matchesAccept(file, tokens));
    }

    /** Uploads the files, putting their images at the position in the order given. */
    public upload(view: EditorView, files: readonly File[], position: number): void {
        for (const file of files) {
            this.#upload(view, file, position);
        }
    }

    #announce(message: string): void {
        void this.#announcer.announce(message, "polite");
    }

    #placeholder(previewUrl: string, label: string): { readonly bar: HTMLElement; readonly element: HTMLElement } {
        const element = this.#document.createElement("span");
        element.className = EDITOR_IMAGE_UPLOAD_CLASSES;
        element.contentEditable = "false";
        element.setAttribute("role", "img");
        element.setAttribute("aria-label", label);
        const preview = this.#document.createElement("img");
        preview.className = EDITOR_IMAGE_UPLOAD_PREVIEW_CLASSES;
        preview.alt = "";
        preview.src = previewUrl;
        const track = this.#document.createElement("span");
        track.className = EDITOR_IMAGE_UPLOAD_TRACK_CLASSES;
        const bar = this.#document.createElement("span");
        bar.className = EDITOR_IMAGE_UPLOAD_BAR_CLASSES;
        bar.style.inlineSize = "0%";
        track.append(bar);
        element.append(preview, track);
        return { bar, element };
    }

    #upload(view: EditorView, file: File, position: number): void {
        const { handler, maxFileSize } = untracked(this.options);
        if (handler == null) {
            return;
        }
        const messages = untracked(this.#messages);
        if (maxFileSize != null && file.size > maxFileSize) {
            const size = formatFileSize(maxFileSize, untracked(this.#i18n.localeId));
            this.#announce(messages.imageTooLarge(file.name, size));
            return;
        }

        const id = `mona-image-upload-${this.#nextId++}`;
        const previewUrl = URL.createObjectURL(file);
        const { bar, element } = this.#placeholder(previewUrl, messages.imageUploading(file.name));
        addImagePlaceholder(view, id, position, element);
        this.#announce(messages.imageUploading(file.name));

        const finish = (): void => {
            this.#uploads.delete(id);
            URL.revokeObjectURL(previewUrl);
        };
        const fail = (): void => {
            if (!view.isDestroyed) {
                removeImagePlaceholder(view, id);
            }
            this.#announce(untracked(this.#messages).imageUploadFailed(file.name));
        };

        // Registered first: an observable can complete before runUpload returns.
        let abort: (() => void) | null = null;
        this.#uploads.set(id, () => {
            abort?.();
            finish();
        });
        abort = runUpload(handler, file, {
            failure: () => {
                finish();
                fail();
            },
            progress: fraction => {
                bar.style.inlineSize = `${Math.round(fraction * 100)}%`;
            },
            success: response => {
                finish();
                if (typeof response !== "string" || response === "") {
                    if (isDevMode()) {
                        console.warn(
                            "[Mona Editor] imageUpload should return the image's address as a string, but it returned:",
                            response
                        );
                    }
                    fail();
                    return;
                }
                this.#insert(view, id, response, file.name);
            }
        });
    }

    /** Puts the uploaded image where its placeholder is, unless the content around the placeholder was deleted. */
    #insert(view: EditorView, id: string, src: string, name: string): void {
        if (view.isDestroyed || !this.#editorService.ready() || this.#editorService.editor.view !== view) {
            return;
        }
        const position = findImagePlaceholder(view.state, id);
        if (position === null) {
            return;
        }
        const removal = imagePlaceholderRemoval(id);
        this.#editorService.editor
            .chain()
            .command(({ tr }) => {
                tr.setMeta(removal.key, removal.value);
                return true;
            })
            .insertContentAt(position, { attrs: { src }, type: "extendedImage" }, { updateSelection: false })
            .run();
        this.#announce(untracked(this.#messages).imageInserted(name));
    }
}
