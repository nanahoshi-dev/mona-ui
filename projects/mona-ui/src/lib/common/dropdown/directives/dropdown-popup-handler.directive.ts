import { afterNextRender, DestroyRef, Directive, ElementRef, inject, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take, takeUntil } from "rxjs";
import {
    dropdownPopupHideAnimation,
    dropdownPopupShowAnimation
} from "../../../dropdowns/animations/dropdown.animation";
import { DropdownPopupInputToken } from "../../../dropdowns/models/DropdownPopupInput";
import { PopupRef } from "../../../popup/models/PopupRef";
import { PopupSettings } from "../../../popup/models/PopupSettings";
import { PopupService } from "../../../popup/services/popup.service";
import { PreventableEvent } from "../../../utils/PreventableEvent";
import { DropdownService } from "../services/dropdown.service";

@Directive({
    selector: "[monaDropdownPopupHandler]"
})
export class DropdownPopupHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #host = inject(DropdownPopupInputToken);
    readonly #popupService = inject(PopupService);

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
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private openPopup(settings: Partial<PopupSettings>): void {
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
        const anchorConnectionPoint = settings.anchorConnectionPoint ?? "bottomleft";
        const content = this.#dropdownService.popupTemplate() as TemplateRef<any>;
        const closeOnOutsideClick = settings.closeOnOutsideClick ?? true;
        const closeOnScroll = settings.closeOnScroll ?? true;
        const hasBackdrop = settings.hasBackdrop ?? false;
        const height = settings.height;
        const maxHeight =
            settings.maxHeight ?? (this.#host.popupHeight() != null ? this.#host.popupHeight() || undefined : 200);
        const offset = settings.offset ?? { horizontal: 0, vertical: 4 };
        const popupConnectionPoint = settings.popupConnectionPoint ?? "topleft";
        const restoreFocus = this.#dropdownService.restoreFocus();
        const width =
            settings.width ??
            (this.#host.popupWidth() || this.#hostElementRef.nativeElement.getBoundingClientRect().width);
        const withPush = settings.withPush ?? false;
        const withScrollTracking = settings.withScrollTracking ?? false;

        popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint,
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            content,
            closeOnOutsideClick,
            closeOnScroll,
            hasBackdrop,
            height,
            maxHeight,
            offset,
            popupConnectionPoint,
            restoreFocus,
            width,
            withPush,
            withScrollTracking
        });
        this.#dropdownService.popupRef.set(popupRef);
        this.setPopupCloseSubscriptions(popupRef);
        window.setTimeout(() => {
            this.#dropdownService.popupOpenComplete$.next();
            this.#host.opened.emit();
        });
    }

    private setPopupCloseSubscriptions(popupRef: PopupRef): void {
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.#host.close.emit(event);
        });
        popupRef.closeStart.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.#dropdownService.popupCloseStart$.next(event);
        });
        popupRef.closed.pipe(take(1)).subscribe(event => {
            this.#dropdownService.popupRef.set(null);
            this.#dropdownService.popupCloseComplete$.next(event);
            this.#host.closed.emit();
        });
    }

    private togglePopup(settings: Partial<PopupSettings>): void {
        if (this.#dropdownService.popupRef()) {
            this.closePopup();
            return;
        }
        this.openPopup(settings);
    }
}
