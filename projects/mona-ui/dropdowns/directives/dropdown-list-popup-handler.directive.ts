import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { filter, fromEvent, switchMap, take } from "rxjs";
import { DropdownPopupInputToken } from "../models/DropdownPopupInput";
import { DropdownListService } from "../services/dropdown-list.service";
import { DropdownService } from "../services/dropdown.service";
import { DropdownPopupHandlerDirective } from "./dropdown-popup-handler.directive";

@Directive({
    selector: "[monaDropdownListPopupHandler]",
    hostDirectives: [DropdownPopupHandlerDirective]
})
export class DropdownListPopupHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownListService = inject(DropdownListService, { optional: true });
    readonly #dropdownService = inject(DropdownService);
    readonly #host = inject(DropdownPopupInputToken);
    readonly #hostElementRef = inject(ElementRef);
    readonly #listService = inject(ListService);
    readonly #popupClosed$ = toObservable(this.#dropdownService.popupRef).pipe(
        filter(popupRef => !!popupRef),
        switchMap(popupRef => popupRef.closed.pipe(take(1)))
    );
    readonly #popupOpened$ = toObservable(this.#dropdownService.popupRef).pipe(
        filter(popupRef => !!popupRef),
        switchMap(popupRef => popupRef.opened.pipe(take(1)))
    );

    public constructor() {
        afterNextRender({
            read: () => {
                this.setKeyboardEvents();
                this.#popupClosed$
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe(() => this.setPopupCloseSubscriptions());
                this.#popupOpened$
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe(() => this.handleScrollOnPopupOpen());
            }
        });
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private handleArrowKeys(event: KeyboardEvent): void {
        const navigateEvent = new PreventableEvent("beforeNavigate", event);
        this.#dropdownService.beforeNavigate$.next(navigateEvent);
        if (navigateEvent.isDefaultPrevented()) {
            return;
        }
        event.preventDefault();
        if (event.altKey) {
            if (event.key === "ArrowDown") {
                this.#dropdownService.triggerPopupOpen$.next({});
            } else {
                this.closePopup();
            }
            return;
        }
        const previousItem = this.#listService.selectedListItems().lastOrDefault();
        const direction = event.key === "ArrowDown" ? "next" : "previous";
        const mode = this.#listService.navigableOptions().mode;
        const item = this.#listService.navigate(direction, mode, false);
        if (!item || previousItem === item) {
            return;
        }
        this.#dropdownListService?.navigate$.next({ item });
    }

    private handleKeyDown(e: KeyboardEvent): void {
        const event = new PreventableEvent("beforeKeydown", e);
        this.#dropdownService.beforeKeydown$.next(event);
        if (event.isDefaultPrevented()) {
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            this.handleArrowKeys(e);
        } else if (e.key === "Escape") {
            this.closePopup();
        } else if (e.key === "Tab") {
            this.closePopup();
        } else if (e.key === " ") {
            e.preventDefault();
            this.#dropdownService.triggerPopupToggle$.next({});
        } else if (e.key === "Enter") {
            this.#dropdownService.keydown$.next(e);
            if (e.defaultPrevented) {
                return;
            }
            this.#dropdownService.triggerPopupToggle$.next({});
        } else {
            this.#dropdownService.keydown$.next(e);
        }
    }

    private handleScrollOnPopupOpen(): void {
        const selectedDataItem = this.#listService.selectedListItems().lastOrDefault();
        const highlightedItem = this.#listService.highlightedItem();
        if (selectedDataItem) {
            this.scrollToSelectedItem();
        } else if (highlightedItem) {
            this.scrollToHighlightedItem();
        }
    }

    private scrollToHighlightedItem(): void {
        const highlightedItem = this.#listService.highlightedItem();
        if (!highlightedItem) {
            return;
        }
        window.setTimeout(() => this.#listService.scrollToItem(highlightedItem, false));
    }

    private scrollToSelectedItem(): void {
        const item = this.#listService.selectedListItems().lastOrDefault();
        if (!item) {
            return;
        }
        window.setTimeout(() => this.#listService.scrollToItem(item, false));
    }

    private setKeyboardEvents(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(
                    e =>
                        !this.#host.disabled() &&
                        !this.#host.readonly() &&
                        !!e.target &&
                        (e.target as HTMLElement).tagName !== "INPUT"
                )
            )
            .subscribe(() => this.#dropdownService.triggerPopupToggle$.next({}));
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.#host.disabled() && !this.#host.readonly())
            )
            .subscribe(e => this.handleKeyDown(e));
    }

    private setPopupCloseSubscriptions(): void {
        this.#listService.clearHighlightedItem();
        this.#listService.clearFilter();
    }
}
