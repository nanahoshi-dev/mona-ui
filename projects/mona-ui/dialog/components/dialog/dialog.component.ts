import {
    afterNextRender,
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { DialogContentTemplateDirective } from "../../directives/dialog-content-template.directive";
import { DialogDescriptionTemplateDirective } from "../../directives/dialog-description-template.directive";
import { DialogFooterTemplateDirective } from "../../directives/dialog-footer-template.directive";
import { DialogIconTemplateDirective } from "../../directives/dialog-icon-template.directive";
import { DialogTitleTemplateDirective } from "../../directives/dialog-title-template.directive";
import { ActionsLayout } from "../../models/ActionsLayout";
import { DialogAction } from "../../models/DialogAction";
import type { DialogActionEvent } from "../../models/DialogActionEvent";
import { DialogRef } from "../../models/DialogRef";
import { DialogService } from "../../services/dialog.service";
import { DialogMessages } from "@nanahoshi/mona-ui/i18n";
import { DialogVariantInput, DialogVariantProps } from "../../styles/dialog.styles";

@Component({
    selector: "mona-dialog",
    template: ``,
    host: {
        "[attr.aria-label]": "null",
        class: "hidden"
    }
})
export class DialogComponent implements DialogVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dialogService = inject(DialogService);
    #destroyed = false;
    #dialogRef?: DialogRef;

    private readonly contentTemplate = contentChild(DialogContentTemplateDirective, { read: TemplateRef });
    private readonly descriptionTemplate = contentChild(DialogDescriptionTemplateDirective, { read: TemplateRef });
    private readonly footerTemplate = contentChild(DialogFooterTemplateDirective, { read: TemplateRef });
    private readonly iconTemplate = contentChild(DialogIconTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(DialogTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Emitted when the user clicks an action button. Call `event.preventDefault()` on the emitted
     * `DialogActionEvent` to keep the dialog open.
     */
    public readonly action = output<DialogActionEvent>();

    /**
     * @description Sets the actions of the dialog.
     * @default []
     */
    public readonly actions = input<Iterable<DialogAction>>([]);

    /**
     * @description Sets the layout of the actions in the dialog footer.
     * @default "end"
     */
    public readonly actionsLayout = input<ActionsLayout>("end");

    /**
     * @description Accessible name for the dialog when it has no `title` or title template.
     */
    public readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });

    /**
     * @description Sets the visibility of the close button in the dialog header.
     * @default true
     */
    public readonly closable = input(true);

    /**
     * @description Emits before the dialog closes, whatever closes it: an action, the close button, Escape, or the
     * component being destroyed. Call `preventDefault()` to keep it open (a close caused by destruction can't be
     * kept).
     */
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Sets whether the dialog should close when the escape key is pressed.
     * @default true
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Emits when the dialog has closed and its leave animation has finished.
     */
    public readonly closed = output<void>();

    /**
     * @description Sets the description of the dialog.
     */
    public readonly description = input<string>();

    /**
     * @description Sets the element that should receive focus when the dialog is opened. When omitted, focus
     * moves to the first focusable element automatically.
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
     * @description Sets the custom messages for the dialog.
     */
    public readonly messages = input<Partial<DialogMessages>>();

    /**
     * @description Sets the minimum height of the dialog.
     */
    public readonly minHeight = input<number>();

    /**
     * @description Sets the minimum width of the dialog.
     */
    public readonly minWidth = input<number>();

    /**
     * @description Whether the dialog is modal: a backdrop, `aria-modal="true"`, focus kept inside, page scroll
     * locked, and the rest of the page inert.
     * @default true
     */
    public readonly modal = input(true);

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<DialogVariantProps["rounded"]>("medium");

    /**
     * @description Primary text content displayed by the component.
     */
    public readonly text = input<string>();

    /**
     * @description Title text displayed in the component header or trigger.
     */
    public readonly title = input<string>();

    /**
     * @description Sets the top position of the dialog.
     */
    public readonly top = input<number>();

    /**
     * @description Visual severity type of the dialog, controlling its icon and semantic role. Set to `null` to
     * render the dialog without an icon.
     * @default "info"
     */
    public readonly type = input<DialogVariantProps["type"] | null>("info");

    /**
     * @description Sets the width of the dialog.
     */
    public readonly width = input<number>();

    public constructor() {
        afterNextRender({
            write: () => this.#openDialog()
        });
        effect(() => {
            const actions = this.actions() ? [...this.actions()] : undefined;
            const update = {
                actions,
                actionsLayout: this.actionsLayout(),
                ariaLabel: this.ariaLabel(),
                closable: this.closable(),
                description: this.description(),
                messages: this.messages(),
                rounded: this.rounded(),
                text: this.text(),
                title: this.title(),
                type: this.type()
            };
            this.#dialogRef?.update(update);
        });
        this.#destroyRef.onDestroy(() => {
            // Outputs can't emit once the component is destroyed, so this close is silent.
            this.#destroyed = true;
            this.#dialogRef?.close();
        });
    }

    #openDialog(): void {
        const actions = this.actions() ? [...this.actions()] : undefined;
        this.#dialogRef = this.#dialogService.show({
            actions,
            actionsLayout: this.actionsLayout(),
            ariaLabel: this.ariaLabel(),
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
            messages: this.messages(),
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

        this.#dialogRef.action$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((event: DialogActionEvent) => {
            this.action.emit(event);
        });
        this.#dialogRef.close$.subscribe((event: PopupCloseEvent) => {
            if (!this.#destroyed) {
                this.close.emit(event);
            }
        });
        this.#dialogRef.closed$.subscribe(() => {
            if (!this.#destroyed) {
                this.closed.emit();
            }
        });
    }
}
