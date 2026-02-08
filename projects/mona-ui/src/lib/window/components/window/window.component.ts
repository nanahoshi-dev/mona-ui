import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    signal,
    Signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WindowFooterTemplateDirective } from "../../directives/window-footer-template.directive";
import { WindowTitleTemplateDirective } from "../../directives/window-title-template.directive";
import { WindowCloseEvent } from "../../models/WindowCloseEvent";
import { WindowRef } from "../../models/WindowRef";
import { WindowService } from "../../services/window.service";
import { WindowVariantProps } from "../../styles/window.styles";

@Component({
    selector: "mona-window",
    templateUrl: "./window.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "hidden"
    }
})
export class WindowComponent {
    readonly #destroyRef = inject(DestroyRef);

    readonly #windowService = inject(WindowService);

    #windowRef?: WindowRef;

    private readonly footerTemplate = contentChild(WindowFooterTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(WindowTitleTemplateDirective, { read: TemplateRef });
    private readonly windowTemplate = viewChild.required<TemplateRef<any>>("windowTemplate");

    public readonly close = output<WindowCloseEvent>();
    public readonly dragEnd = output();
    public readonly dragStart = output();
    public readonly draggable = input(true);
    public readonly focusedElement = input<HTMLElement | ElementRef<HTMLElement> | string | null>();
    public readonly height = model<number>();
    public readonly left = model<number>();
    public readonly maxHeight = input<number>();
    public readonly maxWidth = input<number>();
    public readonly minHeight = input<number>();
    public readonly minWidth = input<number>();
    public readonly modal = input(true);
    public readonly resizable = input<boolean>();
    public readonly rounded = input<WindowVariantProps["rounded"]>("medium");
    public readonly title = input<string>();
    public readonly top = model<number>();
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

    #openWindow(): void {
        this.#windowRef = this.#windowService.open({
            content: this.windowTemplate(),
            draggable: this.draggable(),
            focusedElement: this.focusedElement(),
            footerTemplate: this.footerTemplate(),
            height: this.height(),
            left: this.left(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            minHeight: this.minHeight(),
            minWidth: this.minWidth(),
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
        this.#windowRef.beforeClose$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            // The close event is emitted here to allow the user to prevent the window from closing.
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
