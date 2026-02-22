import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WindowActionTemplateDirective } from "../../directives/window-action-template.directive";
import { WindowContentTemplateDirective } from "../../directives/window-content-template.directive";
import { WindowFooterTemplateDirective } from "../../directives/window-footer-template.directive";
import { WindowTitleTemplateDirective } from "../../directives/window-title-template.directive";
import { WindowCloseEvent } from "../../models/WindowCloseEvent";
import { WindowRef } from "../../models/WindowRef";
import { WindowService } from "../../services/window.service";
import { WindowVariantInput, WindowVariantProps } from "../../styles/window.styles";

@Component({
    selector: "mona-window",
    template: ``,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "hidden"
    }
})
export class WindowComponent implements WindowVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #windowService = inject(WindowService);
    #windowRef?: WindowRef;
    private readonly actionTemplate = contentChild(WindowActionTemplateDirective, { read: TemplateRef });
    private readonly contentTemplate = contentChild(WindowContentTemplateDirective, { read: TemplateRef });
    private readonly footerTemplate = contentChild(WindowFooterTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(WindowTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Sets the visibility of the close button in the window header.
     * @default true
     */
    public readonly closable = input(true);

    /**
     * @description Emits when the window is about to be closed.
     */
    public readonly close = output<WindowCloseEvent>();

    /**
     * @description Sets whether the window should close when the escape key is pressed.
     * @default true
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Emits when the window dragging ends.
     */
    public readonly dragEnd = output();

    /**
     * @description Emits when the window dragging starts.
     */
    public readonly dragStart = output();

    /**
     * @description Sets whether the window can be dragged by the user.
     * @default true
     */
    public readonly draggable = input(true);

    /**
     * @description Sets the element that should receive focus when the window is opened.
     * Accepts an element reference or a query selector string.
     */
    public readonly focusedElement = input<HTMLElement | ElementRef<HTMLElement> | string | null>();

    /**
     * @description Sets the height of the window.
     */
    public readonly height = model<number>();

    /**
     * @description Sets the left position of the window.
     */
    public readonly left = model<number>();

    /**
     * @description Sets the look of the window.
     * @default "default"
     */
    public readonly look = input<WindowVariantProps["look"]>("default");

    /**
     * @description Sets the maximum height of the window.
     */
    public readonly maxHeight = input<number>();

    /**
     * @description Sets the maximum width of the window.
     */
    public readonly maxWidth = input<number>();

    /**
     * @description Sets whether the user can maximize the window.
     */
    public readonly maximizable = input<boolean>();

    /**
     * @description Sets the minimum height of the window.
     */
    public readonly minHeight = input<number>();

    /**
     * @description Sets the minimum width of the window.
     */
    public readonly minWidth = input<number>();

    /**
     * @description Sets whether the user can minimize the window.
     */
    public readonly minimizable = input<boolean>();

    /**
     * @description Sets whether the window should have an overlay behind it.
     */
    public readonly modal = input<boolean>();

    /**
     * @description Sets whether the user can resize the window.
     */
    public readonly resizable = input<boolean>();

    /**
     * @description Sets the border radius of the window.
     * @default "medium"
     */
    public readonly rounded = input<WindowVariantProps["rounded"]>("medium");

    /**
     * @description Sets the title of the window.
     */
    public readonly title = input<string>();

    /**
     * @description Sets the top position of the window.
     */
    public readonly top = model<number>();

    /**
     * @description Sets the width of the window.
     */
    public readonly width = model<number>();

    public constructor() {
        effect(() => {
            const top = this.top();
            const left = this.left();
            this.#windowRef?.move({ top, left });
        });
        effect(() => {
            const height = this.height();
            const width = this.width();
            const center = untracked(() => this.top() == null && this.left() == null);
            this.#windowRef?.resize({ height, width, center });
        });
        afterNextRender({ read: () => this.#openWindow() });
        this.#destroyRef.onDestroy(() => this.#windowRef?.close());
    }

    public closeWindow(): void {
        this.#windowRef?.close();
    }

    public move(position: { top?: number; left?: number }): void {
        if (position.top !== undefined) {
            this.#windowRef?.move({ top: position.top });
        }
        if (position.left !== undefined) {
            this.#windowRef?.move({ left: position.left });
        }
    }

    public openWindow(): void {
        this.#openWindow();
    }

    public resize(dimensions: { width?: number; height?: number }): void {
        if (dimensions.width !== undefined) {
            this.#windowRef?.resize({ width: dimensions.width });
        }
        if (dimensions.height !== undefined) {
            this.#windowRef?.resize({ height: dimensions.height });
        }
    }

    #openWindow(): void {
        this.#windowRef = this.#windowService.open({
            actionTemplate: this.actionTemplate(),
            closable: this.closable(),
            closeOnEscape: this.closeOnEscape(),
            content: this.contentTemplate(),
            draggable: this.draggable(),
            focusedElement: this.focusedElement(),
            footerTemplate: this.footerTemplate(),
            height: this.height(),
            left: this.left(),
            look: this.look(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            maximizable: this.maximizable(),
            minHeight: this.minHeight(),
            minWidth: this.minWidth(),
            minimizable: this.minimizable(),
            modal: this.modal(),
            resizable: this.resizable(),
            rounded: this.rounded(),
            title: this.titleTemplate() ?? this.title(),
            top: this.top(),
            width: this.width()
        });
        this.#setSubscriptions();
    }

    #setCloseSubscription(): void {
        if (!this.#windowRef) {
            return;
        }
        this.#windowRef.popupRef.beforeClose.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.close.emit(event);
        });
    }

    #setDragSubscription(): void {
        if (!this.#windowRef) {
            return;
        }
        this.#windowRef.drag$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.left != null) {
                this.left.set(event.left);
            }
            if (event.top != null) {
                this.top.set(event.top);
            }
        });
        this.#windowRef.dragEnd$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.dragEnd.emit();
        });
        this.#windowRef.dragStart$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.dragStart.emit();
        });
    }

    #setResizeSubscription(): void {
        if (!this.#windowRef) {
            return;
        }
        this.#windowRef.resize$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.width != null) {
                this.width.set(event.width);
            }
            if (event.height != null) {
                this.height.set(event.height);
            }
            if (event.left != null) {
                this.left.set(event.left);
            }
            if (event.top != null) {
                this.top.set(event.top);
            }
        });
    }

    #setSubscriptions(): void {
        this.#setCloseSubscription();
        this.#setDragSubscription();
        this.#setResizeSubscription();
    }
}
