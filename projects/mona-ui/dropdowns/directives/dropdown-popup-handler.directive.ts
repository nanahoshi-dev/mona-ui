import type { GlobalPositionStrategy } from "@angular/cdk/overlay";
import {
    afterNextRender,
    computed,
    DestroyRef,
    Directive,
    DOCUMENT,
    ElementRef,
    inject,
    type TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { focusCanReturn } from "@nanahoshi/mona-ui/internal";
import {
    dropdownPopupAnimation,
    type PopupRef,
    PopupService,
    type PopupSettings,
    slideFromBottomPopupAnimation
} from "@nanahoshi/mona-ui/popup";
import { fromEvent, merge, take, takeUntil } from "rxjs";
import { DropdownSheetComponent, type DropdownSheetData } from "../components/dropdown-sheet/dropdown-sheet.component";
import { DROPDOWN_POPUP_INPUT_TOKEN } from "../models/DropdownPopupInput";
import { DropdownService } from "../services/dropdown.service";

/** Screens narrower than this open a dropdown with `adaptiveMode="auto"` as a bottom sheet. */
const SMALL_SCREEN_QUERY = "(max-width: 639.98px)";

/** How much of the visible viewport the bottom sheet may take, so the page above it still shows. */
const SHEET_MAX_HEIGHT_RATIO = 0.85;

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
@Directive({
    selector: "[monaDropdownPopupHandler]"
})
export class DropdownPopupHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #dropdownService = inject(DropdownService);
    readonly #host = inject(DROPDOWN_POPUP_INPUT_TOKEN);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #popupService = inject(PopupService);
    /** Set once the host is destroyed: its outputs can no longer emit, so closing the popup stays silent. */
    #hostDestroyed = false;

    public constructor() {
        afterNextRender({
            read: () => {
                this.#dropdownService.triggerPopupOpen$
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe(s => this.openPopup(s));
                this.#dropdownService.triggerPopupToggle$
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe(s => this.togglePopup(s));
            }
        });
        this.#destroyRef.onDestroy(() => {
            this.#hostDestroyed = true;
            this.closePopup();
        });
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private createPopup(anchor: HTMLElement, content: TemplateRef<void>, settings: Partial<PopupSettings>): PopupRef {
        const anchorConnectionPoint = settings.anchorConnectionPoint ?? "bottomleft";
        const closeOnOutsideClick = settings.closeOnOutsideClick ?? true;
        const closeOnScroll = settings.closeOnScroll ?? true;
        const hasBackdrop = settings.hasBackdrop ?? false;
        const height = settings.height;
        // The host's popupHeight caps the popup; shorter lists still shrink to fit.
        const maxHeight = this.getMaxHeight(settings.maxHeight ?? (this.#host.popupHeight() || undefined), height);
        const minWidth = this.getMinWidth(settings.minWidth, settings.width);
        const offset = settings.offset ?? { horizontal: 0, vertical: 4 };
        const popupConnectionPoint = settings.popupConnectionPoint ?? "topleft";
        const restoreFocus = this.#dropdownService.restoreFocus();
        const width = settings.width ?? (this.#host.popupWidth() || anchor.getBoundingClientRect().width);
        const withPush = settings.withPush ?? false;
        const withScrollTracking = settings.withScrollTracking ?? false;

        return this.#popupService.create({
            anchor,
            anchorConnectionPoint,
            animation: dropdownPopupAnimation,
            content,
            closeOnOutsideClick,
            closeOnScroll,
            hasBackdrop,
            height,
            maxHeight,
            minWidth,
            offset,
            popupConnectionPoint,
            restoreFocus,
            width,
            withPush,
            withScrollTracking
        });
    }

    /**
     * Opens the popup as a sheet along the bottom of the screen, with the field's name and a close button above the
     * dropdown's popup content. Focus stays where it is, as with the popup under the field.
     */
    private createSheet(anchor: HTMLElement, content: TemplateRef<void>, restoreFocus: boolean | "auto"): PopupRef {
        const data: DropdownSheetData = { content, title: computed(() => this.sheetTitle()) };
        const popupRef = this.#popupService.create({
            anchor,
            animation: slideFromBottomPopupAnimation,
            // Keeps the backdrop fade in step with the sheet's slide-out instead of the CDK default of 400ms.
            backdropClass: ["fixed", "inset-0", "bg-background/50", "backdrop-blur-xs", "[transition-duration:240ms]!"],
            blockScroll: true,
            closeOnBackdropClick: true,
            closeOnEscape: true,
            closeOnOutsideClick: false,
            closeOnScroll: false,
            content: DropdownSheetComponent,
            data,
            hasBackdrop: true,
            maxHeight: `${SHEET_MAX_HEIGHT_RATIO * 100}dvh`,
            popupClass: "overflow-clip",
            popupWrapperClass: "mona-popup-constrain-height",
            positionStrategy: "global",
            restoreFocus,
            width: "100dvw"
        });
        this.followVisualViewport(popupRef);
        return popupRef;
    }

    /**
     * Keeps the sheet on the bottom edge of what is visible. An on-screen keyboard (opened by the filter box) shrinks
     * the visual viewport but not the layout viewport the overlay is placed in, so the sheet is lifted above it.
     */
    private followVisualViewport(popupRef: PopupRef): void {
        const strategy = popupRef.overlayRef.getConfig().positionStrategy as
            Partial<GlobalPositionStrategy> | undefined;
        if (typeof strategy?.bottom !== "function" || typeof strategy.left !== "function") {
            return;
        }
        const view = this.#document.defaultView;
        const viewport = view?.visualViewport ?? null;
        const place = (): void => {
            const keyboardInset =
                view && viewport ? Math.max(0, view.innerHeight - viewport.height - viewport.offsetTop) : 0;
            strategy.bottom?.(`${Math.round(keyboardInset)}px`);
            strategy.left?.("0px");
            if (viewport) {
                popupRef.overlayRef.updateSize({
                    maxHeight: `${Math.round(viewport.height * SHEET_MAX_HEIGHT_RATIO)}px`
                });
            }
            popupRef.overlayRef.updatePosition();
        };
        place();
        if (viewport) {
            merge(fromEvent(viewport, "resize"), fromEvent(viewport, "scroll"))
                .pipe(takeUntil(popupRef.closed))
                .subscribe(place);
        }
    }

    private getMaxHeight(maxHeight: PopupSettings["maxHeight"], height: PopupSettings["height"]): number | string {
        if (typeof maxHeight === "number") {
            return maxHeight;
        }
        if (maxHeight === "auto" && height === "auto") {
            return "auto";
        }
        if (!maxHeight || maxHeight === "auto") {
            if (!height || height === "auto") {
                return 200;
            }
            return height;
        }
        return maxHeight ?? 200;
    }

    private getMinWidth(minWidth: PopupSettings["minWidth"], width: PopupSettings["width"]): number | string {
        if (typeof minWidth === "number") {
            return minWidth;
        }
        if (!minWidth || minWidth === "auto") {
            if (!width || width === "auto") {
                return this.#hostElementRef.nativeElement.getBoundingClientRect().width;
            }
            return width;
        }
        return minWidth ?? this.#hostElementRef.nativeElement.getBoundingClientRect().width;
    }

    private openPopup(settings: Partial<PopupSettings>): void {
        let popupRef = this.#dropdownService.popupRef();
        if (popupRef || this.#host.disabled() || this.#host.readonly()) {
            return;
        }

        const event = new PreventableEvent("popupOpen");
        this.#host.open.emit(event);
        if (event.isDefaultPrevented()) {
            return;
        }

        const anchor = this.#hostElementRef.nativeElement;
        const content = this.#dropdownService.popupTemplate() as TemplateRef<void>;
        const restoreFocus = this.#dropdownService.restoreFocus();
        const sheet = this.opensAsSheet();
        // Set first: the popup content renders while the popup is created, styled for where it opens.
        this.#dropdownService.sheet.set(sheet);
        popupRef = sheet
            ? this.createSheet(anchor, content, restoreFocus)
            : this.createPopup(anchor, content, settings);
        this.#dropdownService.popupRef.set(popupRef);
        this.setPopupCloseSubscriptions(popupRef);
        window.setTimeout(() => {
            if (this.#hostDestroyed) {
                return;
            }
            this.#dropdownService.popupOpenComplete$.next();
            this.#host.opened.emit();
        });
    }

    /** Whether the popup opens as a bottom sheet: with `adaptiveMode="auto"`, on a small screen. */
    private opensAsSheet(): boolean {
        if (this.#host.adaptiveMode?.() !== "auto") {
            return false;
        }
        return this.#document.defaultView?.matchMedia?.(SMALL_SCREEN_QUERY).matches ?? false;
    }

    private setPopupCloseSubscriptions(popupRef: PopupRef): void {
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            // A destroyed host can't keep its popup open, so it isn't asked.
            if (!this.#hostDestroyed) {
                this.#host.close.emit(event);
            }
        });
        popupRef.closeStart.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.#dropdownService.popupCloseStart$.next(event);
        });
        popupRef.closed.pipe(take(1)).subscribe(event => {
            // Checked before the overlay is disposed, while focus inside the popup is still there to see.
            this.#dropdownService.focusCanReturn.set(
                focusCanReturn(this.#document, this.#hostElementRef.nativeElement, popupRef.overlayRef.overlayElement)
            );
            this.#dropdownService.popupRef.set(null);
            this.#dropdownService.sheet.set(false);
            this.#dropdownService.popupCloseComplete$.next(event);
            if (!this.#hostDestroyed) {
                this.#host.closed.emit();
            }
        });
    }

    /**
     * The bottom sheet's title: the host's `adaptiveTitle`, or else its accessible name (`aria-labelledby` first, as
     * assistive technology reads it, then `aria-label`).
     */
    private sheetTitle(): string {
        const title = this.#host.adaptiveTitle?.().trim();
        if (title) {
            return title;
        }
        const host: HTMLElement = this.#hostElementRef.nativeElement;
        const labelledBy = (host.getAttribute("aria-labelledby") ?? "")
            .split(/\s+/)
            .filter(id => id.length > 0)
            .map(id => this.#document.getElementById(id)?.textContent?.replace(/\s+/g, " ").trim() ?? "")
            .filter(text => text.length > 0)
            .join(" ");
        return labelledBy || host.getAttribute("aria-label")?.trim() || "";
    }

    private togglePopup(settings: Partial<PopupSettings>): void {
        if (this.#dropdownService.popupRef()) {
            this.closePopup();
            return;
        }
        this.openPopup(settings);
    }
}
