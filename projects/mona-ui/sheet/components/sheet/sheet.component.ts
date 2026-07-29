import { CdkTrapFocus } from "@angular/cdk/a11y";
import { GlobalPositionStrategy } from "@angular/cdk/overlay";
import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    inject,
    Injector,
    input,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import {
    PopupCloseEvent,
    PopupCloseSource,
    PopupRef,
    PopupService,
    slideFromBottomPopupAnimation,
    slideFromLeftPopupAnimation,
    slideFromRightPopupAnimation,
    slideFromTopPopupAnimation,
    type PopupAnimationSettings
} from "@nanahoshi/mona-ui/popup";
import { take } from "rxjs";
import { twMerge } from "tailwind-merge";
import { SheetSide } from "../../models/SheetSide";
import {
    sheetBaseVariants,
    sheetCloseButtonVariants,
    sheetContentVariants,
    sheetDescriptionVariants,
    sheetHeaderVariants,
    sheetTitleVariants,
    type SheetVariantInput
} from "../../styles/sheet.styles";

@Component({
    selector: "mona-sheet",
    imports: [ButtonDirective, CdkTrapFocus, LucideX],
    templateUrl: "./sheet.component.html",
    host: {
        class: "hidden"
    }
})
export class SheetComponent implements SheetVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);
    #destroyed = false;
    #horizontal = false;
    #popupRef?: PopupRef;
    private readonly sheetTemplate = viewChild.required<TemplateRef<void>>("sheetTemplate");
    protected readonly baseClass = computed(() => {
        const variantClass = sheetBaseVariants({ side: this.side() });
        const userClass = classInputToClass(this.userClass());
        return twMerge(variantClass, userClass);
    });
    protected readonly closeButtonClass = computed(() => sheetCloseButtonVariants());
    protected readonly contentClass = computed(() => sheetContentVariants());
    protected readonly descriptionClass = computed(() => sheetDescriptionVariants());
    protected readonly descriptionId = createElementControlId();
    protected readonly headerClass = computed(() => sheetHeaderVariants());
    protected readonly titleClass = computed(() => sheetTitleVariants());
    protected readonly titleId = createElementControlId();

    /** @description Accessible name used when no visible title is provided. */
    public readonly ariaLabel = input<string>();

    /** @description Whether the close button is displayed. @default true */
    public readonly closable = input(true);

    /** @description Emitted before the sheet closes. Call preventDefault() to keep it open. */
    public readonly close = output<PopupCloseEvent>();

    /** @description Whether clicking the backdrop requests that the sheet close. @default true */
    public readonly closeOnBackdropClick = input(true);

    /** @description Whether pressing Escape requests that the sheet close. @default true */
    public readonly closeOnEscape = input(true);

    /** @description Emitted after the leave animation completes and the popup is disposed. */
    public readonly closed = output<void>();

    /** @description Supporting text displayed below the title. */
    public readonly description = input<string>();

    /** @description Explicit sheet height. Numbers are interpreted as pixels. */
    public readonly height = input<number | string>();

    /** @description Edge of the viewport from which the sheet opens. @default "right" */
    public readonly side = input<SheetSide>("right");

    /** @description Title displayed in the sheet header and used as its accessible name. */
    public readonly title = input<string>();

    public readonly userClass = input<string, ClassInputType>(undefined, {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /** @description Explicit sheet width. Numbers are interpreted as pixels. */
    public readonly width = input<number | string>();

    public constructor() {
        afterNextRender({
            read: () => this.#open()
        });
        this.#destroyRef.onDestroy(() => {
            this.#destroyed = true;
            this.#popupRef?.close();
        });
    }

    protected closeSheet(): void {
        this.#popupRef?.close(new PopupCloseEvent({ via: PopupCloseSource.CloseButton }));
    }

    /** Escape and backdrop clicks reach the popup unconditionally, so their inputs are honoured here. */
    #isSuppressedCloseSource(via: PopupCloseSource | undefined): boolean {
        return (
            (via === PopupCloseSource.Escape && !this.closeOnEscape()) ||
            (via === PopupCloseSource.BackdropClick && !this.closeOnBackdropClick())
        );
    }

    #open(): void {
        const activeElement = this.#document.activeElement;
        const anchor = activeElement instanceof HTMLElement ? activeElement : this.#document.body;
        const side = this.side();
        this.#horizontal = side === "left" || side === "right";

        this.#popupRef = this.#popupService.create({
            anchor,
            animation: this.#resolveAnimation(side),
            backdropClass: [
                "fixed",
                "inset-0",
                "bg-background/50",
                "backdrop-blur-xs",
                // Keeps the backdrop fade in step with the sheet's slide-out instead of the CDK default of 400ms.
                "[transition-duration:240ms]!"
            ],
            blockScroll: true,
            /*
             * Both close paths are wired up even when the matching input is currently `false`. PopupService
             * decides once, at creation, whether to listen at all, so opting out there would freeze these
             * inputs at their initial values. Vetoing in `beforeClose` instead keeps them live.
             */
            closeOnBackdropClick: true,
            closeOnEscape: true,
            closeOnOutsideClick: false,
            content: this.sheetTemplate(),
            hasBackdrop: true,
            height: this.#resolveHeight(),
            maxHeight: this.#horizontal ? "100dvh" : "90dvh",
            maxWidth: "100dvw",
            popupClass: "overflow-clip",
            popupWrapperClass: "mona-popup-constrain-height",
            positionStrategy: "global",
            restoreFocus: true,
            width: this.#resolveWidth()
        });

        this.#positionOverlay(this.#popupRef, side);
        this.#trackSize(this.#popupRef);
        this.#popupRef.beforeClose.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (this.#isSuppressedCloseSource(event.via)) {
                event.preventDefault();
                return;
            }
            if (!this.#destroyed) {
                this.close.emit(event);
            }
        });
        this.#popupRef.closed.pipe(take(1), takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.closed.emit());
    }

    #positionOverlay(ref: PopupRef, side: SheetSide): void {
        const strategy = ref.overlayRef.getConfig().positionStrategy;
        if (!(strategy instanceof GlobalPositionStrategy)) {
            return;
        }
        switch (side) {
            case "top":
                strategy.top("0").left("0");
                break;
            case "right":
                strategy.top("0").right("0");
                break;
            case "bottom":
                strategy.bottom("0").left("0");
                break;
            case "left":
                strategy.top("0").left("0");
                break;
        }
        ref.overlayRef.updatePosition();
    }

    #resolveAnimation(side: SheetSide): Required<PopupAnimationSettings> {
        switch (side) {
            case "top":
                return slideFromTopPopupAnimation;
            case "right":
                return slideFromRightPopupAnimation;
            case "bottom":
                return slideFromBottomPopupAnimation;
            case "left":
                return slideFromLeftPopupAnimation;
        }
    }

    #resolveHeight(): number | string {
        return this.height() ?? (this.#horizontal ? "100dvh" : "auto");
    }

    #resolveWidth(): number | string {
        return this.width() ?? (this.#horizontal ? "min(100dvw, 24rem)" : "100dvw");
    }

    /** Keeps the overlay in sync with later `width`/`height` changes; `side` stays fixed at open time. */
    #trackSize(ref: PopupRef): void {
        effect(() => ref.overlayRef.updateSize({ height: this.#resolveHeight(), width: this.#resolveWidth() }), {
            injector: this.#injector
        });
    }
}
