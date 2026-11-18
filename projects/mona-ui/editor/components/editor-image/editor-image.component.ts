import { Component, computed, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { WindowComponent, WindowContentTemplateDirective } from "@nanahoshi/mona-ui/window";
import { NodeSelection } from "@tiptap/pm/state";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorImageInsertEvent } from "../../models/EditorImageInsertEvent";
import type { ImageInsertFormModel } from "../../models/ImageInsertFormModel";
import { EditorImageUploadService } from "../../services/editor-image-upload.service";
import { EditorService } from "../../services/editor.service";
import { EditorImageInserterComponent } from "../editor-image-inserter/editor-image-inserter.component";

/** A size attribute as a number of pixels, or null when it isn't one. */
function pixels(value: unknown): number | null {
    const number = Number(value);
    return value == null || value === "" || !Number.isFinite(number) ? null : number;
}

@Component({
    selector: "mona-editor-image",
    imports: [WindowComponent, EditorImageInserterComponent, ButtonDirective, WindowContentTemplateDirective],
    templateUrl: "./editor-image.component.html"
})
export class EditorImageComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);

    /** The image the selection is on, which the form edits instead of adding one. */
    readonly #selectedImage = computed<ImageInsertFormModel | null>(() => {
        const selection = this.#editorService.state()?.selection;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== "extendedImage") {
            return null;
        }
        const attributes = selection.node.attrs;
        return {
            alt: String(attributes["alt"] ?? ""),
            height: pixels(attributes["height"]),
            link: String(attributes["src"] ?? ""),
            width: pixels(attributes["width"])
        };
    });

    /** The image the open form edits, or null when it adds one. */
    protected readonly editedImage = signal<ImageInsertFormModel | null>(null);
    protected readonly inserterVisible = signal(false);
    protected readonly label = computed(() =>
        this.#selectedImage() ? this.messages().editImage : this.messages().insertImage
    );
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly upload = inject(EditorImageUploadService).options;

    public onDisplayInserterClick(): void {
        this.editedImage.set(this.#selectedImage());
        this.inserterVisible.set(true);
    }

    public onImageInsert(event: EditorImageInsertEvent): void {
        this.insertImage(event);
        this.closeInserter();
    }

    public onInsertCancel(): void {
        this.closeInserter();
    }

    public onInserterClose(): void {
        this.closeInserter();
    }

    private closeInserter(): void {
        this.inserterVisible.set(false);
    }

    /** Adds the image, or changes the selected one. */
    private insertImage(event: EditorImageInsertEvent): void {
        const chain = this.#editorService.editor.chain().focus();
        if (this.editedImage() && this.#selectedImage()) {
            // Changed in place, so the image keeps any attribute the form doesn't show.
            chain
                .updateAttributes("extendedImage", {
                    alt: event.alt,
                    height: event.height,
                    src: event.link,
                    title: event.alt,
                    width: event.width
                })
                .run();
            return;
        }
        chain
            .setImage({
                alt: event.alt,
                height: event.height ?? undefined,
                src: event.link,
                title: event.alt,
                width: event.width ?? undefined
            })
            .run();
    }
}
