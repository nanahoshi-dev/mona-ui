import { Component, computed, inject } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupDataInjectionToken } from "@nanahoshi/mona-ui/popup";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import type { EditorMentionService } from "../../services/editor-mention.service";
import {
    EDITOR_MENTION_LIST_CLASSES,
    EDITOR_MENTION_STATUS_CLASSES,
    editorMentionOptionThemeVariants
} from "../../styles/editor.styles";

/**
 * The mention suggestions, in the popup at the `@`. Focus stays in the content: the arrow keys move the highlight
 * from there, and a click picks a suggestion without taking focus.
 */
@Component({
    selector: "mona-editor-mention-list",
    templateUrl: "./editor-mention-list.component.html"
})
export class EditorMentionListComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly listClass = EDITOR_MENTION_LIST_CLASSES;
    protected readonly mention = inject<EditorMentionService>(PopupDataInjectionToken);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly options = computed(() => {
        const highlighted = this.mention.highlightedIndex();
        return this.mention.items().map((item, index) => ({
            class: editorMentionOptionThemeVariants({ highlighted: index === highlighted }),
            highlighted: index === highlighted,
            id: this.mention.optionId(index),
            index,
            label: item.label
        }));
    });
    protected readonly statusClass = EDITOR_MENTION_STATUS_CLASSES;

    protected onOptionClick(index: number): void {
        this.mention.select(index);
    }

    protected onOptionPointerDown(event: PointerEvent): void {
        // Keeps focus, and the selection, in the content.
        event.preventDefault();
    }

    protected onOptionPointerEnter(index: number): void {
        this.mention.highlightedIndex.set(index);
    }
}
