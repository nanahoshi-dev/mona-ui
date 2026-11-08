import {
    afterNextRender,
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
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { WindowMessages } from "@nanahoshi/mona-ui/i18n";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { WindowActionTemplateDirective } from "../../directives/window-action-template.directive";
import { WindowContentTemplateDirective } from "../../directives/window-content-template.directive";
import { WindowFooterTemplateDirective } from "../../directives/window-footer-template.directive";
import { WindowTitleTemplateDirective } from "../../directives/window-title-template.directive";
import type { WindowRef } from "../../models/WindowRef";
import { WindowService } from "../../services/window.service";
import type { WindowVariantInput, WindowVariantProps } from "../../styles/window.styles";

@Component({
    selector: "mona-window",
    // Content placed directly inside <mona-window> is the window's content, unless a monaWindowContentTemplate is given.
    template: `<ng-template #projectedContent><ng-content /></ng-template>`,
    host: {
        "[attr.aria-label]": "null",
        class: "hidden"
    }
})
export class WindowComponent implements WindowVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #windowService = inject(WindowService);
    #destroyed = false;
    #windowRef?: WindowRef;
    private readonly actionTemplate = contentChild(WindowActionTemplateDirective, { read: TemplateRef });
    private readonly contentTemplate = contentChild(WindowContentTemplateDirective, { read: TemplateRef });
    private readonly footerTemplate = contentChild(WindowFooterTemplateDirective, { read: TemplateRef });
    private readonly projectedContent = viewChild.required("projectedContent", { read: TemplateRef });
    private readonly titleTemplate = contentChild(WindowTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Accessible name for the window when it has no `title` or title template.
     */
    public readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });

    /**
     * @description Sets the visibility of the close button in the window header.
     * @default true
     */
    public readonly closable = input(true);

    /**
     * @description Emits before the window closes, whatever closes it: the close button, Escape, a programmatic close,
     * or the component being destroyed. Call `preventDefault()` to keep it open (a close caused by destruction can't
     * be kept).
     */
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Sets whether the window should close when the escape key is pressed.
     * @default true
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Emitted after the window has fully closed (post-animation). Preventing this event has no effect.
     */
    public readonly closed = output<void>();

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
     * @default true
     */
    public readonly maximizable = input<boolean>();

    /**
     * @description Internationalization message overrides for accessible labels.
     */
    public readonly messages = input<Partial<WindowMessages>>();

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
     * @default true
     */
    public readonly minimizable = input<boolean>();

    /**
     * @description Sets whether the window should have an overlay behind it.
     * @default false
     */
    public readonly modal = input<boolean>();

    /**
     * @description Sets whether the user can resize the window.
     * @default false
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
        afterNextRender({ write: () => this.#openWindow() });
        this.#destroyRef.onDestroy(() => {
            // Outputs can't emit once the component is destroyed, so this close is silent.
            this.#destroyed = true;
            this.#windowRef?.close();
        });
    }

    /** Closes the window. */
    public closeWindow(): void {
        this.#windowRef?.close();
    }

    /**
     * Moves the window, in pixels. An axis that isn't given keeps its place.
     */
    public move(position: { top?: number; left?: number }): void {
        this.#windowRef?.move(position);
    }

    /**
     * Opens the window. Called once after the first render; call it again to reopen a window that was closed. Does
     * nothing while the window is open.
     */
    public openWindow(): void {
        this.#openWindow();
    }

    /**
     * Resizes the window, in pixels. A dimension that isn't given keeps its size.
     */
    public resize(dimensions: { width?: number; height?: number }): void {
        this.#windowRef?.resize(dimensions);
    }

    #openWindow(): void {
        if (this.#windowRef || this.#destroyed) {
            return;
        }
        this.#windowRef = this.#windowService.open({
            actionTemplate: this.actionTemplate(),
            ariaLabel: this.ariaLabel(),
            closable: this.closable(),
            closeOnEscape: this.closeOnEscape(),
            content: this.contentTemplate() ?? this.projectedContent(),
            draggable: this.draggable(),
            focusedElement: this.focusedElement(),
            footerTemplate: this.footerTemplate(),
            height: this.height(),
            left: this.left(),
            look: this.look(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            maximizable: this.maximizable(),
            messages: this.messages(),
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
        const windowRef = this.#windowRef;
        if (!windowRef) {
            return;
        }
        // Not tied to this component's lifetime: destroying it closes the window, and these finish with it.
        windowRef.close$.subscribe(event => {
            if (!this.#destroyed) {
                this.close.emit(event);
            }
        });
        windowRef.closed$.subscribe(() => {
            if (this.#windowRef === windowRef) {
                this.#windowRef = undefined;
            }
            if (!this.#destroyed) {
                this.closed.emit();
            }
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
