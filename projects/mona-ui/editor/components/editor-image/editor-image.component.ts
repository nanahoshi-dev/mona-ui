import { Component, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { WindowComponent, WindowContentTemplateDirective } from "@nanahoshi/mona-ui/window";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorImageInsertEvent } from "../../models/EditorImageInsertEvent";
import { EditorService } from "../../services/editor.service";
import { EditorImageInserterComponent } from "../editor-image-inserter/editor-image-inserter.component";

@Component({
    selector: "mona-editor-image",
    imports: [WindowComponent, EditorImageInserterComponent, ButtonDirective, WindowContentTemplateDirective],
    templateUrl: "./editor-image.component.html"
})
export class EditorImageComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly inserterVisible = signal(false);

    public onDisplayInserterClick(): void {
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

    private insertImage(event: EditorImageInsertEvent): void {
        this.#editorService.editor
            .chain()
            .setImage({
                src: event.link,
                alt: event.alt,
                title: event.alt
            })
            .updateAttributes("extendedImage", {
                width: event.width,
                height: event.height
            })
            .run();
    }
}
