import { Component, inject, signal } from "@angular/core";
import { DIALOG_DATA } from "@nanahoshi/mona-ui/dialog";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { normalizeLinkUrl } from "../../utils/linkUrl";

/**
 * @internal The link dialog's data: the link at the selection, or `""`.
 */
export interface EditorLinkDialogData {
    readonly href: string;
}

/**
 * @internal The content of the link dialog: one URL field. The dialog's own actions apply, remove or cancel; Enter in
 * the field applies.
 */
@Component({
    selector: "mona-editor-link-dialog",
    imports: [TextBoxComponent],
    template: `
        <div class="flex flex-col gap-1 p-2">
            <label class="ps-0.5 text-sm font-semibold" [id]="labelId">{{ messages().enterUrl }}</label>
            <mona-text-box
                size="small"
                [(value)]="url"
                [aria-labelledby]="labelId"
                [aria-describedby]="invalid() ? errorId : ''"
                [invalid]="invalid()"
                [touched]="invalid()"></mona-text-box>
            @if (invalid()) {
                <p class="m-0 ps-0.5 text-sm text-error" [id]="errorId">{{ messages().invalidUrl }}</p>
            }
        </div>
    `
})
export class EditorLinkDialogComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly errorId = createElementControlId();
    protected readonly invalid = signal(false);
    protected readonly labelId = createElementControlId();
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    public readonly url = signal(inject<EditorLinkDialogData>(DIALOG_DATA).href);

    /**
     * Returns the URL to store, or `null` after showing why the typed one can't be used.
     */
    public validate(): string | null {
        const href = normalizeLinkUrl(this.url());
        this.invalid.set(href === null);
        return href;
    }
}
