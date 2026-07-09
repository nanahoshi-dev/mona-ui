import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    OnInit,
    output,
    signal,
    Signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faChevronDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import { fromEvent, take, takeUntil } from "rxjs";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { dropdownPopupAnimation } from "@nanahoshi/mona-ui/popup";
import { PopupRef } from "@nanahoshi/mona-ui/popup";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
import { PaletteType } from "@nanahoshi/mona-ui/common";
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
    imports: [FontAwesomeModule, ButtonDirective, ColorPaletteComponent, ColorGradientComponent, NgTemplateOutlet],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-open]": "expanded() || null",
        "[attr.data-readonly]": "readonly()",
        "[attr.data-required]": "required() || null",
        "[attr.role]": "'combobox'",
        "[attr.aria-controls]": "popupId",
        "[attr.aria-expanded]": "expanded() || null",
        "[attr.aria-haspopup]": "'dialog'",
        "[attr.aria-label]": "'Color picker'",
        "[attr.aria-disabled]": "disabled()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-readonly]": "readonly()",
        "[attr.aria-required]": "required()"
    }
})
export class ColorPickerComponent implements OnInit, ColorPickerVariantInput, FormValueControl<string | null> {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #popupService: PopupService = inject(PopupService);
    readonly #popupRef = signal<PopupRef | null>(null);

    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const expanded = this.expanded();
        const rounded = this.rounded();
        const size = this.size();
        return colorPickerBaseThemeVariants(theme)({ expanded, rounded, size });
    });
    protected readonly colorClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return colorPickerColorThemeVariants(theme)({ rounded, size });
    });
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.value())
    );
    protected readonly noColorIcon = faTimes;
    protected readonly dropdownIcon = faChevronDown;
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate: Signal<TemplateRef<any>> = viewChild.required("popupTemplate");
    protected readonly valueTemplate = contentChild(ColorPickerValueTemplateDirective, { read: TemplateRef });

    /**
     * @description Whether to close the color picker when a color is selected.
     * Only applies when the view is set to "palette".
     * @default true
     */
    public readonly closeOnSelect = input(true);

    /**
     * @description The number of columns to display in the color palette.
     * Only applies when the view is set to "palette" and the palette is a custom array of colors.
     * @default 10
     */
    public readonly columns = input(10);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Marks the color picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Whether to display the opacity slider.
     * Only applies when the view is set to "gradient".
     * @default true
     */
    public readonly opacity = input(true);

    /**
     * @description The type of color palette to use.
     * This can be a predefined palette type like "flat", "material", or "websafe",
     * or a custom iterable of colors.
     * @default "flat"
     */
    public readonly palette = input<Iterable<string> | PaletteType>("flat");

    /**
     * @description Prevents value changes while preserving the component's visual state. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Border-radius preset applied to the color picker.
     * @default "medium"
     */
    public readonly rounded = input<ColorPickerVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button to reset the color.
     * This is only applicable when the view is set to "palette".
     * @default false
     */
    public readonly showClearButton = input(false);

    /**
     * @description Size preset controlling the color picker's dimensions.
     * @default "medium"
     */
    public readonly size = input<ColorPickerVariantProps["size"]>("medium");

    /**
     * @description The view mode of the color picker.
     * This can be either "palette" or "gradient".
     * @default "gradient"
     */
    public readonly view = input<ColorPickerView>("gradient");

    /**
     * @description Sets whether the color picker is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Emitted when the color picker is interacted with on blur or color selection.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the color picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Two-way bindable current color value.
     * @default null
     */
    public readonly value = model<string | null>(null);

    public ngOnInit(): void {
        this.setEventListeners();
        this.setKeyboardEventListeners();
    }

    protected onClearClick(): void {
        if (this.disabled() || this.readonly()) {
            return;
        }

        this.value.set(null);
        this.touch.emit();
        if (this.#popupRef() && this.closeOnSelect()) {
            this.close();
        }
    }

    public onColorGradientApply(): void {
        this.#popupRef()?.close();
    }

    public onColorGradientCancel(): void {
        this.#popupRef()?.close();
    }

    protected onColorGradientValueChange(value: string | null | undefined): void {
        if (value === undefined) {
            return;
        }
        if (this.disabled() || this.readonly()) {
            return;
        }

        this.value.set(value);
    }

    protected onColorGradientTouch(): void {
        this.touch.emit();
    }

    protected onColorPaletteValueChange(value: string | null): void {
        if (this.disabled() || this.readonly()) {
            return;
        }

        this.value.set(value);
        if (this.closeOnSelect()) {
            this.#popupRef()?.close();
        }
    }

    protected onColorPaletteTouch(): void {
        this.touch.emit();
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
        if (this.disabled() || this.readonly()) {
            return;
        }

        const popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            anchorConnectionPoint: "bottomleft",
            animation: dropdownPopupAnimation,
            closeOnOutsideClick: true,
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: -1, vertical: 2 },
            popupConnectionPoint: "topleft",
            withPush: false
        });

        popupRef.opened.pipe(take(1), takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            // Deferred so this runs after the browser's default focus-on-click behavior for the
            // (focusable) host element, otherwise that default action steals focus back from the popup.
            setTimeout(() => {
                this.focusPopupContent();
                this.setupPopupKeyboardHandling();
            });
        });

        this.#popupRef.set(popupRef);
        popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef.set(null);
            this.#hostElementRef.nativeElement.focus();
        });
    }

    private close(): void {
        if (this.#popupRef()) {
            this.#popupRef()?.close();
        }
    }

    private focusFirstColorTile(): void {
        if (!this.#popupRef()) {
            return;
        }

        const overlayElement = this.#popupRef()?.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        const firstColorTile = overlayElement.querySelector('[data-color-index="0"]') as HTMLElement;
        if (firstColorTile) {
            firstColorTile.focus();
        }
    }

    private focusPopupContent(): void {
        if (!this.#popupRef()) {
            return;
        }

        const overlayElement = this.#popupRef()?.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        if (this.view() === "palette") {
            // Focus the palette container, not individual colors
            const paletteContainer = overlayElement.querySelector("[data-palette-container]") as HTMLElement;
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
                if (this.disabled() || this.readonly()) {
                    return;
                }
                if (this.#popupRef()) {
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
                if (this.disabled() || this.readonly()) {
                    return;
                }

                switch (event.key) {
                    case "Enter":
                    case " ":
                    case "ArrowDown":
                    case "ArrowUp":
                        event.preventDefault();
                        event.stopPropagation();
                        if (!this.#popupRef()) {
                            this.open();
                        }
                        break;
                    case "Escape":
                        event.preventDefault();
                        event.stopPropagation();
                        if (this.#popupRef()) {
                            this.close();
                        }
                        break;
                    case "Tab":
                        if (this.#popupRef()) {
                            this.close();
                        }
                        break;
                }
            });

        // Handle blur events for touched callback
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.touch.emit();
            });
    }

    private setupPopupKeyboardHandling(): void {
        const popupRef = this.#popupRef();

        if (!popupRef) {
            return;
        }

        const overlayElement = popupRef.overlayRef.overlayElement;
        if (!overlayElement) {
            return;
        }

        fromEvent<KeyboardEvent>(overlayElement, "keydown")
            .pipe(takeUntil(popupRef.closed), takeUntilDestroyed(this.#destroyRef))
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
