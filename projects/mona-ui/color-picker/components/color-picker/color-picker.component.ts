import { NgTemplateOutlet } from "@angular/common";
import {
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    model,
    OnInit,
    output,
    signal,
    Signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideCircleX, LucideDropletOff } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
import type { ColorOutputFormat, ColorPaletteItem, PaletteType } from "@nanahoshi/mona-ui/common";
import {
    colorKey,
    createElementControlId,
    injectEffectiveDisabled,
    injectLabelAssociation,
    themeOverlaySurfaceClasses
} from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { dropdownPopupAnimation, PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { fromEvent, take, takeUntil } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ColorPickerValueTemplateDirective } from "../../directives/color-picker-value-template.directive";
import { COLOR_PICKER_DEFAULT_MESSAGES } from "../../i18n/color-picker.default-messages";
import { ColorPickerView } from "../../models/ColorPickerView";
import {
    colorPickerBaseThemeVariants,
    colorPickerColorThemeVariants,
    ColorPickerVariantInput,
    ColorPickerVariantProps
} from "../../styles/color-picker.styles";

const TABBABLE_SELECTOR =
    "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]";

@Component({
    selector: "mona-color-picker",
    templateUrl: "./color-picker.component.html",
    imports: [
        LucideDropletOff,
        ButtonDirective,
        ColorPaletteComponent,
        ColorGradientComponent,
        NgTemplateOutlet,
        LucideCircleX,
        IndicatorIconComponent
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "effectiveDisabled() ? -1 : 0",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-open]": "expanded() || null",
        "[attr.data-readonly]": "readonly()",
        "[attr.data-required]": "required() || null",
        "[attr.role]": "'combobox'",
        "[attr.aria-controls]": "expanded() ? popupId : null",
        "[attr.aria-expanded]": "expanded() ? 'true' : 'false'",
        "[attr.aria-haspopup]": "'dialog'",
        "[attr.aria-label]": "labelledBy() ? null : ariaLabel() || messages().colorPicker",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.aria-disabled]": "effectiveDisabled()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-readonly]": "readonly()",
        "[attr.aria-required]": "required()"
    }
})
export class ColorPickerComponent implements OnInit, ColorPickerVariantInput, FormValueControl<string | null> {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    /** Read once, so a generator can be used as the palette. */
    readonly #paletteItems = computed<ReadonlyArray<string | ColorPaletteItem>>(() => {
        const palette = this.palette();
        return typeof palette === "string" ? [] : Array.from(palette);
    });
    readonly #popupRef = signal<PopupRef | null>(null);
    readonly #popupService: PopupService = inject(PopupService);
    #destroyed = false;
    protected readonly baseClasses = computed(() => {
        const expanded = this.expanded();
        const rounded = this.rounded();
        const size = this.size();
        return twMerge(colorPickerBaseThemeVariants({ expanded, rounded, size }));
    });
    protected readonly colorClasses = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        return colorPickerColorThemeVariants({ rounded, size });
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly gradientPopupClasses = `${themeOverlaySurfaceClasses} border border-border shadow-(--shadow-overlay) outline-none`;
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("colorPicker", COLOR_PICKER_DEFAULT_MESSAGES);
    protected readonly paletteOption = computed(() => {
        const palette = this.palette();
        return typeof palette === "string" ? palette : this.#paletteItems();
    });
    protected readonly palettePopupClasses = `flex flex-col p-0.5 max-w-[calc(100vw-1rem)] overflow-auto ${themeOverlaySurfaceClasses} border border-border shadow-(--shadow-overlay) outline-none`;
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate: Signal<TemplateRef<void>> = viewChild.required("popupTemplate");
    protected readonly valueTemplate = contentChild(ColorPickerValueTemplateDirective, { read: TemplateRef });
    /** What assistive technology reads as the current color: its name when the palette has one, or the value itself. */
    protected readonly valueText = computed(() => {
        const value = this.value();
        if (!value) {
            return this.messages().noColor;
        }
        const key = colorKey(value, this.#document);
        for (const item of this.#paletteItems()) {
            if (typeof item !== "string" && item.name && colorKey(item.color, this.#document) === key) {
                return item.name;
            }
        }
        return value;
    });

    /**
     * @description Accessible label for the color picker combobox.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Id of the element that names the color picker.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Whether to close the color picker when a color is selected.
     * Only applies when the view is set to "palette".
     * @default true
     */
    public readonly closeOnSelect = input(true, { transform: booleanAttribute });

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
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description The format of the value the gradient view writes. Only applies when the view is set to "gradient".
     * @default "hex"
     */
    public readonly format = input<ColorOutputFormat>("hex");

    /**
     * @description Marks the color picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Whether to display the opacity slider.
     * Only applies when the view is set to "gradient".
     * @default true
     */
    public readonly opacity = input(true, { transform: booleanAttribute });

    /**
     * @description The type of color palette to use.
     * This can be a predefined palette type like "flat", "material", or "websafe",
     * or a custom iterable of CSS color strings or `{ color, name }` items.
     * @default "flat"
     */
    public readonly palette = input<Iterable<string | ColorPaletteItem> | PaletteType>("flat");

    /**
     * @description Prevents value changes while preserving the component's visual state. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the color picker is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the color picker.
     * @default "medium"
     */
    public readonly rounded = input<ColorPickerVariantProps["rounded"]>("medium");

    /**
     * @description Whether the gradient view has Apply and Cancel buttons. Without them, each change writes the value
     * at once. Only applies when the view is set to "gradient".
     * @default true
     */
    public readonly showButtons = input(true, { transform: booleanAttribute });

    /**
     * @description Whether to show the clear button to reset the color.
     * This is only applicable when the view is set to "palette".
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the color picker's dimensions.
     * @default "medium"
     */
    public readonly size = input<ColorPickerVariantProps["size"]>("medium");

    /**
     * @description The size of each palette tile, in pixels. Only applies when the view is set to "palette". Below 24,
     * tiles miss the minimum target size of WCAG 2.5.8.
     * @default 24
     */
    public readonly tileSize = input(24);

    /**
     * @description Emitted when focus leaves the color picker, its popup closes or a color is selected.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the color picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Two-way bindable current color value.
     * @default null
     */
    public readonly value = model<string | null>(null);

    /**
     * @description The view mode of the color picker.
     * This can be either "palette" or "gradient".
     * @default "gradient"
     */
    public readonly view = input<ColorPickerView>("gradient");

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#destroyed = true;
            this.close();
        });
        effect(() => {
            if (this.effectiveDisabled() || this.readonly()) {
                untracked(() => this.close());
            }
        });
    }

    /**
     * @description Moves focus to the color picker.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        this.#hostElementRef.nativeElement.focus(options);
    }

    public ngOnInit(): void {
        this.setEventListeners();
        this.setKeyboardEventListeners();
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onClearClick(): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }

        this.value.set(null);
        this.touch.emit();
        if (this.#popupRef() && this.closeOnSelect()) {
            this.close();
        }
    }

    protected onColorGradientApply(): void {
        this.close();
    }

    protected onColorGradientCancel(): void {
        this.close();
    }

    protected onColorGradientValueChange(value: string | null | undefined): void {
        if (value === undefined) {
            return;
        }
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }

        this.value.set(value);
    }

    protected onColorPaletteValueChange(value: string | null): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }

        this.value.set(value);
    }

    protected onPaletteColorSelect(): void {
        if (this.closeOnSelect()) {
            this.close();
        }
    }

    protected open(): void {
        if (this.effectiveDisabled() || this.readonly()) {
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
            // Returns to the picker, unless the user moved focus elsewhere, such as by clicking another field.
            restoreFocus: true,
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
            if (!this.#destroyed) {
                this.touch.emit();
            }
        });
    }

    private close(): void {
        this.#popupRef()?.close();
    }

    /**
     * Opens on the selected swatch, or the first one, in the palette view, and on the saturation and value handle in the
     * gradient view.
     */
    private focusPopupContent(): void {
        const overlayElement = this.#popupRef()?.overlayRef.overlayElement;
        const selector = this.view() === "palette" ? '[data-color-index][tabindex="0"]' : '[role="slider"]';
        overlayElement?.querySelector<HTMLElement>(selector)?.focus();
    }

    private setEventListeners(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                if (this.effectiveDisabled() || this.readonly()) {
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
                if (this.effectiveDisabled() || this.readonly()) {
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
                    case "Tab":
                        if (this.#popupRef()) {
                            this.close();
                        }
                        break;
                }
            });

        // Focus moving into the popup isn't the end of the interaction: closing the popup marks the field as touched.
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                if (!this.#popupRef()) {
                    this.touch.emit();
                }
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
                if (event.key === "Tab" && this.tabLeavesPopup(event, overlayElement)) {
                    event.preventDefault();
                    this.close();
                }
            });
    }

    /**
     * The popup isn't modal, so Tab walks through its controls, and going past either end closes it. Focus then returns
     * to the picker, and the next Tab continues down the page.
     */
    private tabLeavesPopup(event: KeyboardEvent, overlayElement: HTMLElement): boolean {
        const tabbable = Array.from(overlayElement.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
            element => element.tabIndex >= 0
        );
        const index = tabbable.indexOf(this.#document.activeElement as HTMLElement);
        return event.shiftKey ? index <= 0 : index === tabbable.length - 1;
    }
}
