import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    output,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take, takeUntil } from "rxjs";
import { PopupCloseEvent, PopupCloseSource } from "../../../../popup/models/PopupCloseEvent";
import { DialogContentTemplateDirective } from "../../directives/dialog-content-template.directive";
import { DialogDescriptionTemplateDirective } from "../../directives/dialog-description-template.directive";
import { DialogFooterTemplateDirective } from "../../directives/dialog-footer-template.directive";
import { DialogIconTemplateDirective } from "../../directives/dialog-icon-template.directive";
import { DialogTitleTemplateDirective } from "../../directives/dialog-title-template.directive";
import { ActionsLayout } from "../../models/ActionsLayout";
import { DialogAction } from "../../models/DialogAction";
import { DialogRef } from "../../models/DialogRef";
import { DialogService } from "../../services/dialog.service";
import { DialogVariantInput, DialogVariantProps } from "../../styles/dialog.styles";

@Component({
    selector: "mona-dialog",
    template: ``,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "hidden"
    }
})
export class DialogComponent implements DialogVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dialogService = inject(DialogService);
    #dialogRef?: DialogRef;

    private readonly contentTemplate = contentChild(DialogContentTemplateDirective, { read: TemplateRef });
    private readonly descriptionTemplate = contentChild(DialogDescriptionTemplateDirective, { read: TemplateRef });
    private readonly footerTemplate = contentChild(DialogFooterTemplateDirective, { read: TemplateRef });
    private readonly iconTemplate = contentChild(DialogIconTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(DialogTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Emits when the user clicks on an action button.
     */
    public readonly action = output<DialogAction>();

    /**
     * @description Sets the actions of the dialog.
     */
    public readonly actions = input<Iterable<DialogAction>>([]);

    /**
     * @description Sets the layout of the actions in the dialog footer.
     * @default "end"
     */
    public readonly actionsLayout = input<ActionsLayout>("end");

    /**
     * @description Sets the visibility of the close button in the dialog header.
     * @default true
     */
    public readonly closable = input(true);

    /**
     * @description Emits when the user clicks on the close button or presses the escape key.
     * This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits when the dialog is closed.
     */
    public readonly closed = output<void>();

    /**
     * @description Sets whether the dialog should close when the escape key is pressed.
     * @default true
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Sets the description of the dialog.
     */
    public readonly description = input<string>();

    /**
     * @description Sets the element that should receive focus when the dialog is opened.
     */
    public readonly focusedElement = input<HTMLElement | ElementRef<HTMLElement> | string | null>();

    /**
     * @description Sets the height of the dialog.
     */
    public readonly height = input<number>();

    /**
     * @description Sets the left position of the dialog.
     */
    public readonly left = input<number>();

    /**
     * @description Sets the maximum height of the dialog.
     */
    public readonly maxHeight = input<number>();

    /**
     * @description Sets the maximum width of the dialog.
     */
    public readonly maxWidth = input<number>();

    /**
     * @description Sets the minimum height of the dialog.
     */
    public readonly minHeight = input<number>();

    /**
     * @description Sets the minimum width of the dialog.
     */
    public readonly minWidth = input<number>();

    /**
     * @description Sets whether the dialog should have an overlay behind it.
     */
    public readonly modal = input(true);

    /**
     * @description Sets the border radius of the dialog.
     */
    public readonly rounded = input<DialogVariantProps["rounded"]>("medium");

    /**
     * @description Sets the text of the dialog.
     */
    public readonly text = input<string>();

    /**
     * @description Sets the title of the dialog.
     */
    public readonly title = input<string>();

    /**
     * @description Sets the top position of the dialog.
     */
    public readonly top = input<number>();

    /**
     * @description Sets the type of the dialog.
     */
    public readonly type = input<DialogVariantProps["type"] | null>("info");

    /**
     * @description Sets the width of the dialog.
     */
    public readonly width = input<number>();

    public constructor() {
        afterNextRender({
            read: () => this.#openDialog()
        });
        this.#destroyRef.onDestroy(() => this.#dialogRef?.close());
    }

    #openDialog(): void {
        const actions = this.actions() ? [...this.actions()] : undefined;
        this.#dialogRef = this.#dialogService.show({
            actions,
            actionsLayout: this.actionsLayout(),
            closable: this.closable(),
            closeOnEscape: this.closeOnEscape(),
            content: this.contentTemplate(),
            description: this.description(),
            descriptionTemplate: this.descriptionTemplate(),
            focusedElement: this.focusedElement(),
            footerTemplate: this.footerTemplate(),
            height: this.height(),
            iconTemplate: this.iconTemplate(),
            left: this.left(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            minHeight: this.minHeight(),
            minWidth: this.minWidth(),
            modal: this.modal(),
            rounded: this.rounded(),
            text: this.text(),
            title: this.title(),
            titleTemplate: this.titleTemplate(),
            top: this.top(),
            type: this.type(),
            width: this.width()
        });

        this.#dialogRef.result.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(result => {
            if (result.viaClose) {
                this.#dialogRef?.close(new PopupCloseEvent({ via: PopupCloseSource.CloseButton }));
                return;
            }
            this.action.emit(result.action);
            this.#dialogRef?.close();
        });

        this.#dialogRef.close$.pipe(takeUntil(this.#dialogRef.popupRef.closed)).subscribe(event => {
            this.close.emit(event);
        });
        this.#dialogRef.closed$.pipe(take(1)).subscribe(() => {
            this.closed.emit();
        });
    }
}
