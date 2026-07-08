import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, NgZone } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { WindowReference } from "../models/WindowReference";
import { DefaultMaxWindowHeight, DefaultMaxWindowWidth } from "../utils/defaults";

const KeyboardMoveStep = 10;
const KeyboardMoveStepFine = 1;

@Directive({
    selector: "div[monaWindowDragHandler]",
    host: {
        "(keydown)": "onKeydown($event)"
    }
})
export class WindowDragHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #zone = inject(NgZone);
    #activeCleanup?: () => void;

    public readonly draggable = input(true);
    public readonly windowRef = input.required<WindowReference>();

    public constructor() {
        afterNextRender({
            read: () => this.#setEvents()
        });
        this.#destroyRef.onDestroy(() => this.#activeCleanup?.());
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.draggable()) {
            return;
        }
        const step = event.shiftKey ? KeyboardMoveStepFine : KeyboardMoveStep;
        const element = this.windowRef().element;
        const innerWidth = this.#document.defaultView?.innerWidth || DefaultMaxWindowWidth;
        const innerHeight = this.#document.defaultView?.innerHeight || DefaultMaxWindowHeight;
        const initialTop = element.getBoundingClientRect().top;
        const initialLeft = element.getBoundingClientRect().left;
        let top = initialTop;
        let left = initialLeft;

        switch (event.key) {
            case "ArrowUp":
                top = Math.max(0, initialTop - step);
                break;
            case "ArrowDown":
                top = Math.min(innerHeight, initialTop + step);
                break;
            case "ArrowLeft":
                left = Math.max(0, initialLeft - step);
                break;
            case "ArrowRight":
                left = Math.min(innerWidth, initialLeft + step);
                break;
            default:
                return;
        }

        event.preventDefault();
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
        this.windowRef().moveStart$$.next();
        this.windowRef().move$$.next({ top, left });
        this.windowRef().moveEnd$$.next();
    }

    #onPointerDown(event: PointerEvent): void {
        if (!this.draggable()) {
            return;
        }

        const element = this.windowRef().element;
        const initialX = event.clientX;
        const initialY = event.clientY;
        const initialTop = element.getBoundingClientRect().top;
        const initialLeft = element.getBoundingClientRect().left;
        const innerWidth = this.#document.defaultView?.innerWidth || DefaultMaxWindowWidth;
        const innerHeight = this.#document.defaultView?.innerHeight || DefaultMaxWindowHeight;
        let dragInitiated = false;

        const onPointerMove = (event: PointerEvent) => {
            if (!dragInitiated) {
                dragInitiated = true;
                this.windowRef().moveStart$$.next();
            }
            if (event.clientX < 0 || event.clientX > innerWidth || event.clientY < 0 || event.clientY > innerHeight) {
                return;
            }
            const deltaX = event.clientX - initialX;
            const deltaY = event.clientY - initialY;
            const top = initialTop + deltaY;
            const left = initialLeft + deltaX;
            element.style.top = `${top}px`;
            element.style.left = `${left}px`;
            this.windowRef().move$$.next({ top, left });
        };

        const cleanup = () => {
            this.#document.removeEventListener("pointermove", onPointerMove);
            this.#document.removeEventListener("pointerup", onPointerUp);
            this.#activeCleanup = undefined;
        };

        const onPointerUp = () => {
            cleanup();
            if (dragInitiated) {
                this.windowRef().moveEnd$$.next();
                dragInitiated = false;
            }
        };

        this.#activeCleanup = cleanup;
        this.#document.addEventListener("pointermove", onPointerMove);
        this.#document.addEventListener("pointerup", onPointerUp);
    }

    #setEvents(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => this.#onPointerDown(event));
        });
    }
}
