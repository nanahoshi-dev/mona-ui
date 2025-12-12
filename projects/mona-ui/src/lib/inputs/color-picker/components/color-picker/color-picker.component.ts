import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    OnInit,
    Signal,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faChevronDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import { fromEvent, take, takeUntil } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import {
    dropdownPopupHideAnimation,
    dropdownPopupShowAnimation
} from "../../../../dropdowns/animations/dropdown.animation";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { ColorGradientComponent } from "../../../color-gradient/components/color-gradient/color-gradient.component";
import { ColorPaletteComponent } from "../../../color-palette/components/color-palette/color-palette.component";
import { PaletteType } from "../../../models/PaletteType";
import { ColorPickerValueTemplateDirective } from "../../directives/color-picker-value-template.directive";
import { ColorPickerView } from "../../models/ColorPickerView";
import {
    colorPickerBaseThemeVariants,
    colorPickerColorThemeVariants,
    ColorPickerVariantInput,
    ColorPickerVariantProps
} from "../../styles/color-picker.styles";

@Component({
    selector: "mona-color-picker",
    templateUrl: "./color-picker.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorPickerComponent),
            multi: true
        }
    ],
    imports: [
        FontAwesomeModule,
        ButtonDirective,
        ColorPaletteComponent,
        FormsModule,
        ColorGradientComponent,
        NgTemplateOutlet
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-open]": "!!popupRef",
        "[attr.role]": "'combobox'",
        "[attr.aria-expanded]": "!!popupRef",
        "[attr.aria-haspopup]": "'dialog'",
        "[attr.aria-label]": "'Color picker'",
        "[attr.aria-disabled]": "disabled()"
    }
})
export class ColorPickerComponent implements OnInit, ControlValueAccessor, ColorPickerVariantInput {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #popupService: PopupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);

    #propagateChange: Action<string | null> | null = null;
    #propagateTouched: Action = () => {};

    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return colorPickerBaseThemeVariants(theme)({ rounded, size });
    });
    protected readonly color = signal<string | null>(null);
    protected readonly colorClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return colorPickerColorThemeVariants(theme)({ rounded, size });
    });
    protected readonly noColorIcon = faTimes;
    protected readonly dropdownIcon = faChevronDown;
    protected readonly popupTemplate: Signal<TemplateRef<any>> = viewChild.required("popupTemplate");
    protected readonly valueTemplate = contentChild(ColorPickerValueTemplateDirective, { read: TemplateRef });
    protected popupRef: PopupRef | null = null;

    /**
     * @description Whether to close the color picker when a color is selected.
     * Only applies when the view is set to "palette".
     * @default true
     */
    public readonly closeOnSelect = input(true);

    /**
     * @description The number of columns to display in the color palette.
     * Only applies when the view is set to "palette" and the palette is a custom array of colors.
     */
    public readonly columns = input(10);

    /**
     * @description Sets the disabled state of the color picker.
     */
    public readonly disabled = input(false);

    /**
     * @description Whether to display the opacity slider.
     * Only applies when the view is set to "gradient".
     */
    public readonly opacity = input(true);

    /**
     * @description The type of color palette to use.
     * This can be a predefined palette type like "flat", "material", or "websafe",
     * or a custom iterable of colors.
     */
    public readonly palette = input<Iterable<string> | PaletteType>("flat");

    /**
     * @description Sets the border radius of the color picker.
     */
    public readonly rounded = input<ColorPickerVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button to reset the color.
     * This is only applicable when the view is set to "palette".
     */
    public readonly showClearButton = input(false);

    /**
     * @description The size of the color picker.
     */
    public readonly size = input<ColorPickerVariantProps["size"]>("medium");

    /**
     * @description The view mode of the color picker.
     * This can be either "palette" or "gradient".
     */
    public readonly view = input<ColorPickerView>("gradient");

    public ngOnInit(): void {
        this.setEventListeners();
        this.setKeyboardEventListeners();
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(obj: string | null): void {
        this.color.set(obj);
    }

    protected onClearClick(): void {
        this.color.set(null);
        this.#propagateChange?.(null);
        this.#propagateTouched();
        if (this.popupRef && this.closeOnSelect()) {
            this.close();
        }
    }

    public onColorGradientApply(): void {
        this.popupRef?.close();
    }

    public onColorGradientCancel(): void {
        this.popupRef?.close();
    }

    protected onColorGradientValueChange(value: string | null): void {
        this.color.set(value);
        this.#propagateChange?.(value);
    }

    protected onColorPaletteValueChange(value: string | null): void {
        this.color.set(value);
        this.#propagateChange?.(value);
        if (this.closeOnSelect()) {
            this.popupRef?.close();
        }
    }

    protected onPaletteContainerKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case "ArrowDown":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowLeft":
            case "Enter":
            case " ":
            case "Home":
            case "End":
                // Focus on the first color tile when the user starts navigating
                event.preventDefault();
                event.stopPropagation();
                this.focusFirstColorTile();
                break;
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                this.close();
                break;
            case "Tab":
                // Close popup when tabbing out
                this.close();
                break;
        }
    }

    protected open(): void {
        this.popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            anchorConnectionPoint: "bottomleft",
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            closeOnOutsideClick: true,
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: -1, vertical: 2 },
            popupConnectionPoint: "topleft",
            withPush: false
        });

        setTimeout(() => {
            this.focusPopupContent();
            this.setupPopupKeyboardHandling();
        }, 100);

        this.popupRef.closed.pipe(take(1)).subscribe(() => {
            this.popupRef = null;
            this.#hostElementRef.nativeElement.focus();
        });
    }

    private close(): void {
        if (this.popupRef) {
            this.popupRef.close();
        }
    }

    private focusFirstColorTile(): void {
        if (!this.popupRef) {
            return;
        }

        const overlayElement = this.popupRef.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        const firstColorTile = overlayElement.querySelector('[data-color-index="0"]') as HTMLElement;
        if (firstColorTile) {
            firstColorTile.focus();
        }
    }

    private focusPopupContent(): void {
        if (!this.popupRef) {
            return;
        }

        const overlayElement = this.popupRef.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        if (this.view() === "palette") {
            // Focus the palette container, not individual colors
            const paletteContainer = overlayElement.querySelector(".flex.flex-col") as HTMLElement;
            if (paletteContainer) {
                paletteContainer.focus();
            }
        } else if (this.view() === "gradient") {
            // Focus the HSV handle in the gradient picker
            const hsvHandle = overlayElement.querySelector('[role="slider"]') as HTMLElement;
            if (hsvHandle) {
                hsvHandle.focus();
            }
        }
    }

    private setEventListeners(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                if (this.disabled()) {
                    return;
                }
                if (this.popupRef) {
                    this.close();
                    return;
                }
                this.open();
            });
    }

    private setKeyboardEventListeners(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: KeyboardEvent) => {
                if (this.disabled()) {
                    return;
                }

                switch (event.key) {
                    case "Enter":
                    case " ":
                    case "ArrowDown":
                    case "ArrowUp":
                        event.preventDefault();
                        event.stopPropagation();
                        if (!this.popupRef) {
                            this.open();
                        }
                        break;
                    case "Escape":
                        event.preventDefault();
                        event.stopPropagation();
                        if (this.popupRef) {
                            this.close();
                        }
                        break;
                    case "Tab":
                        if (this.popupRef) {
                            this.close();
                        }
                        break;
                }
            });

        // Handle blur events for touched callback
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#propagateTouched();
            });
    }

    private setupPopupKeyboardHandling(): void {
        if (!this.popupRef) {
            return;
        }

        const overlayElement = this.popupRef.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        fromEvent<KeyboardEvent>(overlayElement, "keydown")
            .pipe(takeUntil(this.popupRef.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const keyEvent = event as KeyboardEvent;
                if (keyEvent.key === "Tab") {
                    this.close();
                } else if (keyEvent.key === "Escape") {
                    keyEvent.preventDefault();
                    keyEvent.stopPropagation();
                    this.close();
                }
            });
    }
}
