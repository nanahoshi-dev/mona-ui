import { afterNextRender, DestroyRef, Directive, ElementRef, inject, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent, take, takeUntil } from "rxjs";
import { ListService } from "../../common/list/services/list.service";
import { PopupRef } from "../../popup/models/PopupRef";
import { PopupService } from "../../popup/services/popup.service";
import { PreventableEvent } from "../../utils/PreventableEvent";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../animations/dropdown.animation";
import { DropdownPopupInputToken } from "../models/DropdownPopupInput";
import { DropdownService } from "../services/dropdown.service";

@Directive({
    selector: "[monaDropdownPopupHandler]"
})
export class DropdownPopupHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #listService = inject(ListService);
    readonly #host = inject(DropdownPopupInputToken);
    readonly #hostElementRef = inject(ElementRef);
    readonly #popupService = inject(PopupService);

    public constructor() {
        afterNextRender({
            read: () => {
                this.setKeyboardEvents();
            }
        });
        this.#dropdownService.triggerPopupOpen$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.openPopup());
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
                this.openPopup();
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
        this.#dropdownService.navigate$.next({ item });
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
            this.togglePopup();
        } else if (e.key === "Enter") {
            this.#dropdownService.keydown$.next(e);
            if (e.defaultPrevented) {
                return;
            }
            this.togglePopup();
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

    private openPopup(): void {
        let popupRef = this.#dropdownService.popupRef();
        if (popupRef || this.#host.readonly()) {
            return;
        }

        const event = new PreventableEvent("popupOpen");
        this.#host.open.emit(event);
        if (event.isDefaultPrevented()) {
            return;
        }

        const anchor = this.#hostElementRef.nativeElement;
        const content = this.#dropdownService.popupTemplate() as TemplateRef<any>;
        const height = this.#listService.viewItems().none() ? 200 : undefined;
        const maxHeight = this.#host.popupHeight() != null ? (this.#host.popupHeight() ?? undefined) : 200;
        const restoreFocus = this.#dropdownService.restoreFocus();
        const width = this.#host.popupWidth() ?? this.#hostElementRef.nativeElement.getBoundingClientRect().width;

        popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint: "bottomleft",
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            content,
            closeOnOutsideClick: true,
            closeOnScroll: true,
            hasBackdrop: false,
            height,
            maxHeight,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            restoreFocus,
            width,
            withPush: false,
            withScrollTracking: true
        });
        this.#dropdownService.popupRef.set(popupRef);
        this.setPopupCloseSubscriptions(popupRef);
        this.handleScrollOnPopupOpen();
        window.setTimeout(() => this.#dropdownService.popupOpenComplete$.next());
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
                filter(e => !this.#host.readonly() && !!e.target && (e.target as HTMLElement).tagName !== "INPUT")
            )
            .subscribe(() => this.togglePopup());
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.#host.readonly())
            )
            .subscribe(e => this.handleKeyDown(e));
    }

    private setPopupCloseSubscriptions(popupRef: PopupRef): void {
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.#host.close.emit(event);
        });
        popupRef.closed.pipe(take(1)).subscribe(event => {
            this.#dropdownService.popupRef.set(null);
            this.#dropdownService.popupCloseComplete$.next(event);
            this.#listService.clearHighlightedItem();
            this.#listService.clearFilter();
        });
    }

    private togglePopup(): void {
        if (this.#dropdownService.popupRef()) {
            this.closePopup();
            return;
        }
        this.openPopup();
    }
}
