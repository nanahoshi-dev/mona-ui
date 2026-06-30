import {
    ConnectedPosition,
    ConnectionPositionPair,
    FlexibleConnectedPositionStrategyOrigin
} from "@angular/cdk/overlay";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    OnDestroy,
    output,
    StaticProvider,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent, Subject, take, takeUntil } from "rxjs";
import { rxTimeout } from "../../../common/utils/rxTimeout";
import { Action } from "../../../utils/Action";
import { PopupCloseEvent } from "../../models/PopupCloseEvent";
import { PopupOffset } from "../../models/PopupOffset";
import { PopupRef } from "../../models/PopupRef";
import { PopupAnimationSettings, PopupSettings } from "../../models/PopupSettings";
import { PopupService } from "../../services/popup.service";
import { ConnectionPoint } from "../../utils/connectionPosition";

@Component({
    selector: "mona-popup",
    templateUrl: "./popup.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupComponent<T = unknown> implements OnDestroy, AfterViewInit {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #popupService: PopupService = inject(PopupService);
    #popupOpened: boolean = false;
    #eventListenerCleanup$ = new Subject<void>();
    protected readonly contentTemplate = viewChild.required(TemplateRef);
    protected popupRef: PopupRef | null = null;

    /**
     * @description The anchor element or point for the popup.
     */
    public readonly anchor = input.required<FlexibleConnectedPositionStrategyOrigin>();

    /**
     * @description The connection point for the popup anchor.
     */
    public readonly anchorConnectionPoint = input<ConnectionPoint>("bottomcenter");

    /**
     * @description The animation settings for the popup.
     */
    public readonly animation = input<boolean | PopupAnimationSettings>(true);

    /**
     * @description The class or classes to apply to the backdrop of the popup.
     */
    public readonly backdropClass = input<string | string[]>([]);

    /**
     * @description Emits when the popup is closed.
     */
    public readonly close = output();

    /**
     * @description Whether to close the popup when clicking on the backdrop.
     * Only applies when the popup has a backdrop.
     */
    public readonly closeOnBackdropClick = input(true);

    /**
     * @description Whether to close the popup when the escape key is pressed.
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Whether to close the popup when the mouse leaves the anchor element.
     */
    public readonly closeOnMouseLeave = input(false);

    /**
     * @description Whether to close the popup when clicking outside of it.
     */
    public readonly closeOnOutsideClick = input(true);

    /**
     * @description Arbitrary data to pass to the popup.
     */
    public readonly data = input<T>();

    /**
     * @description Whether the popup should have a backdrop.
     */
    public readonly hasBackdrop = input(false);

    /**
     * @description The height of the popup.
     */
    public readonly height = input<number | string>();

    /**
     * @description The maximum height of the popup.
     */
    public readonly maxHeight = input<number | string>();

    /**
     * @description The maximum width of the popup.
     */
    public readonly maxWidth = input<number | string>();

    /**
     * @description The minimum height of the popup.
     */
    public readonly minHeight = input<number | string>();

    /**
     * @description The minimum width of the popup.
     */
    public readonly minWidth = input<number | string>();

    /**
     * @description The offset of the popup from the anchor.
     */
    public readonly offset = input<PopupOffset>();

    /**
     * @description Emits when the popup is opened.
     */
    public readonly open = output<PopupRef>();

    /**
     * @description The class or classes to apply to the popup.
     */
    public readonly popupClass = input<string | string[]>([]);

    /**
     * @description The connection point for the popup.
     */
    public readonly popupConnectionPoint = input<ConnectionPoint>("topcenter");

    /**
     * @description The class or classes to apply to the popup wrapper.
     */
    public readonly popupWrapperClass = input<string | string[]>([]);

    /**
     * @description The strategy for positioning the popup.
     * `global` means the popup will be positioned relative to the viewport,
     * `connected` means the popup will be positioned relative to the anchor element.
     */
    public readonly positionStrategy = input<"global" | "connected">("connected");

    /**
     * @description The positions to use for the popup.
     * The popup will try to position itself in the first position that fits.
     * This is only used when the `positionStrategy` is set to `connected`.
     */
    public readonly positions = input<Array<ConnectedPosition | ConnectionPositionPair>>();

    /**
     * @description Called when the popup is requested to close.
     * This can be used to prevent the popup from closing.
     */
    public readonly preventClose = input<Action<PopupCloseEvent, boolean>>();

    /**
     * @description The providers that will be injected into the popup.
     */
    public readonly providers = input<StaticProvider[]>([]);

    /**
     * @description The trigger event for opening the popup.
     */
    public readonly trigger = input("click");

    /**
     * @description The width of the popup.
     */
    public readonly width = input<number | string | undefined>(undefined);

    /**
     * @description Whether to push the popup into the screen when it is opened.
     */
    public readonly withPush = input<boolean>(true);

    /**
     * @description Whether to close the popup when the user scrolls within a scrollable container.
     */
    public readonly closeOnScroll = input(false);

    /**
     * @description Controls focus restoration when the popup closes.
     * - `true`: always restore focus to the anchor element.
     * - `false`: never restore focus (recommended for tooltips).
     * - `"auto"`: restore focus only if the anchor was focused when the popup opened.
     */
    public readonly restoreFocus = input<boolean | "auto">("auto");

    /**
     * @description Whether the popup should track scroll events and reposition itself.
     */
    public readonly withScrollTracking = input<boolean>(true);

    public constructor() {
        effect(() => this.setupEventListeners());
    }

    public closePopup(): void {
        this.popupRef?.close();
    }

    public ngAfterViewInit(): void {
        rxTimeout(this.#destroyRef, () => this.setupEventListeners());
    }

    public ngOnDestroy(): void {
        this.popupRef?.close();
        this.#eventListenerCleanup$.next();
        this.#eventListenerCleanup$.complete();
    }

    private getPopupWidth(): string | number | undefined {
        const width = this.width();
        if (width != null) {
            return width;
        }

        const anchor = this.anchor();
        if (anchor instanceof HTMLElement) {
            return anchor.getBoundingClientRect().width;
        }
        if (anchor instanceof ElementRef) {
            return anchor.nativeElement.getBoundingClientRect().width;
        }
        return undefined;
    }

    private setupEventListeners(): void {
        // Clean up previous event listeners
        this.#eventListenerCleanup$.next();

        const trigger = this.trigger();
        const anchor = this.anchor();

        if (!trigger || !anchor) {
            return;
        }

        let pointAnchor = false;
        let target: HTMLElement;

        if (anchor instanceof ElementRef) {
            target = anchor.nativeElement;
        } else if (anchor instanceof HTMLElement) {
            target = anchor;
        } else {
            target = this.#document.body;
            pointAnchor = true;
        }

        const width = this.getPopupWidth();

        fromEvent<PointerEvent>(target, trigger)
            .pipe(takeUntil(this.#eventListenerCleanup$), takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.preventDefault();
                if (this.#popupOpened) {
                    this.#popupOpened = false;
                    return;
                }
                if (this.popupRef !== null) {
                    this.popupRef.close();
                    return;
                }
                const popupSettings: PopupSettings = {
                    anchor,
                    anchorConnectionPoint: this.anchorConnectionPoint(),
                    animation: this.animation(),
                    backdropClass: this.backdropClass(),
                    closeOnBackdropClick: this.closeOnBackdropClick(),
                    closeOnEscape: this.closeOnEscape(),
                    closeOnMouseLeave: this.closeOnMouseLeave(),
                    closeOnOutsideClick: this.closeOnOutsideClick(),
                    closeOnScroll: this.closeOnScroll(),
                    content: this.contentTemplate(),
                    data: this.data(),
                    hasBackdrop: this.hasBackdrop(),
                    height: this.height(),
                    maxHeight: this.maxHeight(),
                    maxWidth: this.maxWidth(),
                    minHeight: this.minHeight(),
                    minWidth: this.minWidth(),
                    offset: this.offset(),
                    popupClass: this.popupClass(),
                    popupConnectionPoint: this.popupConnectionPoint(),
                    popupWrapperClass: this.popupWrapperClass(),
                    positionStrategy: this.positionStrategy(),
                    positions: this.positions(),
                    preventClose: this.preventClose(),
                    providers: this.providers(),
                    restoreFocus: this.restoreFocus(),
                    width,
                    withPush: this.withPush(),
                    withScrollTracking: this.withScrollTracking()
                };
                this.popupRef = this.#popupService.create(popupSettings);
                this.popupRef.closed.pipe(take(1)).subscribe(result => {
                    this.popupRef = null;
                    this.close.emit();
                    if (result instanceof PopupCloseEvent) {
                        if (!result.originalEvent) {
                            this.#popupOpened = false;
                        } else if (
                            result.originalEvent instanceof PointerEvent &&
                            result.originalEvent.type === trigger
                        ) {
                            this.#popupOpened =
                                target instanceof HTMLElement &&
                                target.contains(result.originalEvent.target as HTMLElement);
                        } else if (
                            result.originalEvent instanceof PointerEvent &&
                            pointAnchor &&
                            result.originalEvent.type !== trigger
                        ) {
                            this.#popupOpened = false;
                        }
                    }
                });
                if (pointAnchor) {
                    this.#popupOpened = true;
                }
                this.open.emit(this.popupRef);
            });
    }
}
