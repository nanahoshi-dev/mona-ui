import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Clipboard } from "@angular/cdk/clipboard";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    model,
    output,
    Signal,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronsUpDown, LucideCopy, LucideDropletOff } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    Channel,
    formatAlpha,
    hex2rgba,
    HSV,
    hsva2rgba,
    HSVChannel,
    injectEffectiveDisabled,
    injectLabelAssociation,
    isValidHex,
    parseColor,
    RGB,
    RGBA,
    rgba2hex,
    rgba2hsla,
    rgba2hsva,
    RGBChannel
} from "@nanahoshi/mona-ui/internal";
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonTextTemplateDirective
} from "@nanahoshi/mona-ui/dropdown-button";
import { NumericTextBoxComponent, NumericTextBoxPrefixTemplateDirective } from "@nanahoshi/mona-ui/numeric-text-box";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { type ColorMode, type ColorOutputFormat } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { filter, fromEvent, merge, switchMap, takeUntil, tap } from "rxjs";
import { COLOR_GRADIENT_DEFAULT_MESSAGES } from "../../i18n/color-gradient.default-messages";
import { ColorInput } from "../../models/ColorInput";
import {
    colorGradientBaseThemeVariants,
    colorGradientHsvRectangleHandleThemeVariants,
    colorGradientHsvRectangleThemeVariants,
    colorGradientPreviewThemeVariants,
    colorGradientSliderHandleThemeVariants,
    ColorGradientVariantInputs,
    ColorGradientVariantProps
} from "../../styles/color-gradient.styles";

const DEFAULT_HSV: HSV = { h: 0, s: 0, v: 100 };
const DEFAULT_RGB: RGB = { r: 255, g: 255, b: 255 };

@Component({
    selector: "mona-color-gradient",
    templateUrl: "./color-gradient.component.html",
    imports: [
        LucideDropletOff,
        LucideChevronsUpDown,
        NumericTextBoxComponent,
        NumericTextBoxPrefixTemplateDirective,
        ButtonDirective,
        TextBoxComponent,
        TextBoxPrefixTemplateDirective,
        TextBoxSuffixTemplateDirective,
        SliderComponent,
        NgTemplateOutlet,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        DropdownButtonTextTemplateDirective,
        LucideCopy
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-readonly]": "readonly() || null",
        "(focusout)": "onFocusOut($event)",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.role]": "'group'",
        "[attr.aria-label]": "labelledBy() ? null : ariaLabel() || messages().colorGradient",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null"
    }
})
export class ColorGradientComponent implements ColorGradientVariantInputs, FormValueControl<string | null | undefined> {
    readonly #announcer = inject(LiveAnnouncer);
    readonly #clipboard = inject(Clipboard);
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    readonly #viewReady = signal(false);
    /** Whether the color on screen differs from the value because of something the user did. */
    #edited = false;
    #internalValueUpdatePending = false;
    #lastInternalValue: string | null | undefined = undefined;
    protected readonly alpha = signal(255);
    protected readonly alphaInputColor = computed(() => {
        // With no color there is still a track to show.
        const rgb = this.rgb();
        return rgba2hex(rgb.r ?? 0, rgb.g ?? 0, rgb.b ?? 0, 255);
    });
    protected readonly alphaSliderBackground = computed(() => {
        const color = this.alphaInputColor();
        return `linear-gradient(to right, transparent, ${color})`;
    });
    protected readonly alphaValueText = computed(() => {
        const { alphaText } = this.messages();
        return (alpha: number) => alphaText(Math.round((alpha / 255) * 100));
    });
    protected readonly baseClasses = computed(() => {
        return colorGradientBaseThemeVariants();
    });
    protected readonly colorInputs = computed(() => {
        const mode = this.colorMode();
        const baseInputs = mode === "rgb" ? this.createRgbInputList() : this.createHsvInputList();
        if (this.opacity()) {
            baseInputs.push({
                ariaLabel: this.messages().alpha,
                key: "a",
                label: "A",
                value: this.alpha(),
                min: 0,
                max: 255,
                change: (value: number | null) => this.onAlphaChange(value)
            });
        }
        return baseInputs;
    });
    protected readonly colorMode = signal<ColorMode>("rgb");
    protected readonly colorPreviewClasses = computed(() => {
        const rounded = this.rounded();
        return colorGradientPreviewThemeVariants({ rounded });
    });
    protected readonly colorPreviews = computed(() => [
        {
            type: "current",
            color: this.selectedColor(),
            title: this.messages().currentColor
        },
        {
            type: "last",
            color: this.lastSelectedColor(),
            title: this.messages().previousColor,
            onClick: () => this.onResetColorClick()
        }
    ]);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly hex = computed(() => {
        const rgb = this.rgb();
        const alpha = this.alpha();
        const focused = this.hexFocused();
        if (!focused) {
            return rgba2hex(rgb.r, rgb.g, rgb.b, alpha);
        }
        return this.hexInputValue();
    });
    protected readonly hexFocused = signal(false);
    protected readonly hexInputValue = signal("");
    protected readonly hsv = signal<HSV>({ ...DEFAULT_HSV });
    protected readonly hsvHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("hsvPointer");
    protected readonly hsvRectangle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("hsvRectangle");
    protected readonly hsvRectangleBackground = computed(() => {
        const rgb = hsva2rgba(this.hsv().h ?? 0, 100, 100, 255);
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    });
    protected readonly hsvRectangleClasses = computed(() => {
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        return colorGradientHsvRectangleThemeVariants({ rounded });
    });
    protected readonly hsvRectangleHandleClasses = computed(() => {
        const rounded = this.rounded();
        return colorGradientHsvRectangleHandleThemeVariants({ rounded });
    });
    protected readonly interactionDisabled = computed(() => this.effectiveDisabled() || this.readonly());
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly lastSelectedColor = signal("");
    protected readonly messages = this.#i18n.componentMessages("colorGradient", COLOR_GRADIENT_DEFAULT_MESSAGES);
    protected readonly rgb = signal<RGB>({ ...DEFAULT_RGB });
    protected readonly roundedHue = computed(() => Math.round(this.hsv().h ?? 0));
    protected readonly roundedSaturation = computed(() => Math.round(this.hsv().s ?? 0));
    protected readonly roundedValue = computed(() => Math.round(this.hsv().v ?? 0));
    protected readonly selectedColor = computed(() => {
        const rgb = this.rgb();
        if (rgb.r == null || rgb.g == null || rgb.b == null) {
            return "";
        }
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha() / 255})`;
    });
    protected readonly sliderHandleClasses = computed(() => {
        return colorGradientSliderHandleThemeVariants();
    });
    protected readonly sliderHeight = 10;

    /**
     * @description Emits when the Apply button is clicked.
     * The `Apply` button is only displayed when `showButtons` is set to true.
     */
    public readonly apply = output<void>();

    /**
     * @description Accessible name of the group of controls.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that names the group of controls.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emits when the Cancel button is clicked, after the controls go back to the current value.
     * The `Cancel` button is only displayed when `showButtons` is set to true.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- renaming the output would break existing (cancel) bindings
    public readonly cancel = output<void>();

    /**
     * @description Sets the disabled state of the color gradient.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Specifies the format of the color output.
     * @default "hex"
     */
    public readonly format = input<ColorOutputFormat>("hex");

    /**
     * @description Marks the color gradient as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Specifies whether the color picker should display the alpha slider.
     * @default true
     */
    public readonly opacity = input(true, { transform: booleanAttribute });

    /**
     * @description Prevents value changes while the control stays focusable and readable. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the color gradient as required for form validation.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Specifies the rounded variant of the color picker.
     * @default "medium"
     */
    public readonly rounded = input<ColorGradientVariantProps["rounded"]>("medium");

    /**
     * @description Specifies whether the color picker should display the buttons.
     * When set to true, the color picker will display the "Apply" and "Cancel" buttons.
     * When set to false, the color picker will not display the buttons and will emit the color value on change.
     * @default true
     */
    public readonly showButtons = input(true, { transform: booleanAttribute });

    /**
     * @description Specifies whether the color picker should display the channel inputs (RGB or HSV).
     * @default true
     */
    public readonly showColorInputs = input(true, { transform: booleanAttribute });

    /**
     * @description Specifies whether the color picker should display the hex input.
     * @default true
     */
    public readonly showHexInput = input(true, { transform: booleanAttribute });

    /**
     * @description Emitted when the color gradient is interacted with on blur or value adjustment.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the color gradient as touched. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Two-way bindable current color value.
     * When undefined, the component keeps its default internal color state (white, #ffffffff).
     * @default undefined
     */
    public readonly value = model<string | null | undefined>(undefined);

    public constructor() {
        afterNextRender({
            read: () => {
                this.lastSelectedColor.set(this.hex());
                this.setHsvRectPointerEvents();
                this.#viewReady.set(true);
            }
        });
        effect(() => {
            if (!this.#viewReady()) {
                return;
            }
            const value = this.value();
            untracked(() => this.syncValue(value));
        });
    }

    /**
     * @description Moves focus to the saturation and value handle.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        this.hsvHandle().nativeElement.focus(options);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onAlphaChange(value: number | null): void {
        if (value == null) {
            return;
        }
        this.#edited = true;
        const alpha = this.getValidChannelValue(value, "a");
        this.alpha.set(alpha);
        this.updateHexInputValue();
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onApply(): void {
        if (this.interactionDisabled()) {
            return;
        }
        // Applying what was never edited keeps the value as written, whatever its format, even one this can't read.
        if (this.#edited || this.value() === undefined) {
            this.lastSelectedColor.set(this.hex());
            this.emitValue();
        }
        this.#edited = false;
        this.apply.emit();
    }

    protected onCancel(): void {
        this.loadValue(this.value());
        this.cancel.emit();
    }

    protected onClearClick(): void {
        if (this.interactionDisabled()) {
            return;
        }
        this.#edited = true;
        this.clear();
        if (!this.showButtons()) {
            this.commitValue(null);
        }
    }

    protected onCopyColorSelect(mode: "hex" | "rgb"): void {
        const rgb = this.rgb();
        const text =
            mode === "hex"
                ? rgba2hex(rgb.r, rgb.g, rgb.b, this.alpha())
                : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${formatAlpha(this.alpha())})`;
        const copied = this.#clipboard.copy(text);
        void this.#announcer.announce(copied ? this.messages().colorCopied : this.messages().copyFailed);
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    protected onHexChange(value: string): void {
        this.hexInputValue.set(value);
        if (!isValidHex(value)) {
            return;
        }
        this.#edited = true;
        const rgb = hex2rgba(value);
        const hsv = rgba2hsva(rgb.r, rgb.g, rgb.b, rgb.a);
        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        this.alpha.set(rgb.a ?? 255);
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onHexInputBlur(): void {
        this.hexFocused.set(false);
        this.updateHexInputValue();
    }

    protected onHexInputFocus(): void {
        this.updateHexInputValue();
        this.hexFocused.set(true);
    }

    protected onHsvChange(value: number | null, channel: HSVChannel): void {
        if (value == null) {
            return;
        }

        this.#edited = true;
        value = this.getValidChannelValue(value, channel);
        this.hsv.update(c => ({ ...c, [channel]: value }));
        this.updateOtherNullChannels(channel);

        const hsv = this.hsv();
        const rgb = hsva2rgba(hsv.h, hsv.s, hsv.v, this.alpha());

        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        this.updateHexInputValue();
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onHsvHandleKeyDown(event: KeyboardEvent): void {
        if (this.interactionDisabled()) {
            return;
        }

        const step = event.shiftKey ? 10 : 1;
        const largeStep = 25;
        let handled = false;
        const currentHsv = this.hsv();
        const currentSaturation = currentHsv.s ?? 0;
        const currentValue = currentHsv.v ?? 0;

        let newSaturation = currentSaturation;
        let newValue = currentValue;

        switch (event.key) {
            case "ArrowLeft":
                newSaturation = this.getValidChannelValue(currentSaturation - step, "s");
                handled = true;
                break;
            case "ArrowRight":
                newSaturation = this.getValidChannelValue(currentSaturation + step, "s");
                handled = true;
                break;
            case "ArrowUp":
                newValue = this.getValidChannelValue(currentValue + step, "v");
                handled = true;
                break;
            case "ArrowDown":
                newValue = this.getValidChannelValue(currentValue - step, "v");
                handled = true;
                break;
            case "Home":
                newSaturation = 0;
                newValue = 100;
                handled = true;
                break;
            case "End":
                newSaturation = 100;
                newValue = 0;
                handled = true;
                break;
            case "PageUp":
                newValue = this.getValidChannelValue(currentValue + largeStep, "v");
                handled = true;
                break;
            case "PageDown":
                newValue = this.getValidChannelValue(currentValue - largeStep, "v");
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
            this.updateHsvValues(newSaturation, newValue);
            this.updateHexInputValue();
        }
    }

    protected onHueChange(value: number): void {
        this.#edited = true;
        this.hsv.update(c => ({ ...c, h: Math.round(value) }));
        this.updateOtherNullChannels("h");
        this.updateRgbFromHsv();
        this.updateHexInputValue();
    }

    protected onPreviousColorKeyDown(event: KeyboardEvent, handler?: () => void): void {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handler?.();
        }
    }

    protected onResetColorClick(): void {
        if (this.interactionDisabled()) {
            return;
        }
        this.onHexChange(this.lastSelectedColor());
    }

    protected onRgbChange(value: number | null, channel: RGBChannel): void {
        if (value == null) {
            return;
        }

        this.#edited = true;
        value = this.getValidChannelValue(value, channel);
        this.rgb.update(c => ({ ...c, [channel]: value }));
        this.updateOtherNullChannels(channel);

        const rgb = this.rgb();
        const hsv = rgba2hsva(rgb.r, rgb.g, rgb.b, this.alpha());

        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
        this.updateHexInputValue();
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onSwitchColorModeClick(): void {
        this.colorMode.set(this.colorMode() === "rgb" ? "hsv" : "rgb");
    }

    private clear(): void {
        this.hexInputValue.set("");
        this.rgb.update(c => ({ ...c, r: null, g: null, b: null }));
        this.alpha.set(255);
        this.hsv.update(c => ({ ...c, h: null, s: null, v: null }));
    }

    private commitValue(value: string | null): void {
        if (value === this.value()) {
            return;
        }
        this.#internalValueUpdatePending = true;
        this.#lastInternalValue = value;
        this.value.set(value);
    }

    private createHsvInputList(): ColorInput[] {
        const messages = this.messages();
        const hue: ColorInput = {
            ariaLabel: messages.hue,
            key: "h",
            label: "H",
            value: this.roundedHue(),
            min: 0,
            max: 360,
            change: (value: number | null) => this.onHsvChange(value, "h")
        };
        const saturation: ColorInput = {
            ariaLabel: messages.saturation,
            key: "s",
            label: "S",
            value: this.roundedSaturation(),
            min: 0,
            max: 100,
            change: (value: number | null) => this.onHsvChange(value, "s")
        };
        const value: ColorInput = {
            ariaLabel: messages.value,
            key: "v",
            label: "V",
            value: this.roundedValue(),
            min: 0,
            max: 100,
            change: (value: number | null) => this.onHsvChange(value, "v")
        };
        return [hue, saturation, value];
    }

    private createRgbInputList(): ColorInput[] {
        const messages = this.messages();
        const red: ColorInput = {
            ariaLabel: messages.red,
            key: "r",
            label: "R",
            value: this.rgb().r,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "r")
        };
        const green: ColorInput = {
            ariaLabel: messages.green,
            key: "g",
            label: "G",
            value: this.rgb().g,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "g")
        };
        const blue: ColorInput = {
            ariaLabel: messages.blue,
            key: "b",
            label: "B",
            value: this.rgb().b,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "b")
        };
        return [red, green, blue];
    }

    private emitValue(): void {
        const rgb = this.rgb();
        const alpha = this.alpha();

        if (rgb.r == null || rgb.g == null || rgb.b == null || alpha == null) {
            this.commitValue(null);
            return;
        }

        const format = this.format();
        if (format === "hex") {
            this.commitValue(rgba2hex(rgb.r, rgb.g, rgb.b, alpha));
        } else if (format === "rgb") {
            this.commitValue(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${formatAlpha(alpha)})`);
        } else if (format === "hsl") {
            const hsl = rgba2hsla(rgb.r, rgb.g, rgb.b, alpha);
            this.commitValue(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${formatAlpha(alpha)})`);
        }
    }

    private getValidChannelValue(value: number, channel: Channel): number {
        if (channel === "r" || channel === "g" || channel === "b" || channel === "a") {
            return Math.min(255, Math.max(0, value));
        }
        if (channel === "h") {
            return Math.min(360, Math.max(0, value));
        }
        if (channel === "s" || channel === "v") {
            return Math.min(100, Math.max(0, value));
        }
        return value;
    }

    private loadColorFromString(color: string): void {
        const rgba = parseColor(color, this.#document);
        if (!rgba && color.trim() && isDevMode()) {
            console.warn(
                `[Mona Color Gradient] Can't read the color "${color}", so the controls show no color. The value stays ` +
                    "as it is until a user changes it.",
                this.#hostElementRef.nativeElement
            );
        }

        if (!rgba) {
            this.clear();
            return;
        }

        const hsv = rgba2hsva(rgba.r, rgba.g, rgba.b, rgba.a);
        this.hsv.set({ h: hsv.h, s: hsv.s, v: hsv.v });
        this.updateRgb(rgba);
        this.alpha.set(rgba.a ?? 255);
        this.updateHexInputValue();
    }

    /**
     * Shows a value in the controls, dropping any edit that wasn't applied.
     */
    private loadValue(value: string | null | undefined): void {
        this.#edited = false;
        if (value === undefined) {
            this.hsv.set({ ...DEFAULT_HSV });
            this.rgb.set({ ...DEFAULT_RGB });
            this.alpha.set(255);
            this.updateHexInputValue();
        } else if (value === null) {
            this.clear();
        } else {
            this.loadColorFromString(value);
        }
        this.lastSelectedColor.set(this.hex());
    }

    private moveHandleToPointer(event: PointerEvent): void {
        const { height, left, top, width } = this.hsvRectangle().nativeElement.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
            return;
        }
        this.updateHsvValues(((event.clientX - left) / width) * 100, 100 - ((event.clientY - top) / height) * 100);
        this.updateHexInputValue();
    }

    /**
     * Pressing anywhere in the area starts a drag. Capturing the pointer keeps the moves coming when it leaves the area,
     * and the press itself mustn't take focus away from the handle.
     */
    private setHsvRectPointerEvents(): void {
        const area = this.hsvRectangle().nativeElement;
        const isPrimaryPress = (event: MouseEvent): boolean =>
            event.button === 0 && !event.ctrlKey && !this.interactionDisabled();

        fromEvent<MouseEvent>(area, "mousedown")
            .pipe(filter(isPrimaryPress), takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => event.preventDefault());

        fromEvent<PointerEvent>(area, "pointerdown")
            .pipe(
                filter(event => isPrimaryPress(event) && event.isPrimary),
                tap(event => {
                    area.setPointerCapture?.(event.pointerId);
                    this.hsvHandle().nativeElement.focus({ preventScroll: true });
                    this.moveHandleToPointer(event);
                }),
                switchMap(({ pointerId }) => {
                    const isSamePointer = (event: PointerEvent): boolean => event.pointerId === pointerId;
                    const end$ = merge(
                        fromEvent<PointerEvent>(area, "pointerup"),
                        fromEvent<PointerEvent>(area, "pointercancel"),
                        fromEvent<PointerEvent>(area, "lostpointercapture")
                    ).pipe(filter(isSamePointer));
                    return fromEvent<PointerEvent>(area, "pointermove").pipe(filter(isSamePointer), takeUntil(end$));
                }),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => this.moveHandleToPointer(event));
    }

    private syncValue(value: string | null | undefined): void {
        if (value === undefined) {
            return;
        }
        if (this.#internalValueUpdatePending && value === this.#lastInternalValue) {
            this.#internalValueUpdatePending = false;
            this.#lastInternalValue = undefined;
            return;
        }
        this.#internalValueUpdatePending = false;
        this.#lastInternalValue = undefined;
        this.loadValue(value);
    }

    private updateHexInputValue(): void {
        const rgb = this.rgb();
        const hex = rgba2hex(rgb.r, rgb.g, rgb.b, this.alpha());
        this.hexInputValue.set(hex);
    }

    private updateHsvValues(saturation: number, value: number): void {
        this.#edited = true;
        this.hsv.update(c => ({
            ...c,
            h: c.h ?? 0,
            s: this.getValidChannelValue(saturation, "s"),
            v: this.getValidChannelValue(value, "v")
        }));
        this.updateRgbFromHsv();
    }

    private updateOtherNullChannels(channel: keyof RGBA | keyof HSV): void {
        if (channel === "r" || channel === "g" || channel === "b") {
            this.rgb.update(c => ({ ...c, r: c.r ?? 0, g: c.g ?? 0, b: c.b ?? 0 }));
        } else if (channel === "h" || channel === "s" || channel === "v") {
            this.hsv.update(c => ({ ...c, h: c.h ?? 0, s: c.s ?? 0, v: c.v ?? 0 }));
        } else if (channel === "a") {
            this.alpha.set(this.alpha() ?? 255);
        }
    }

    private updateRgb(rgba: RGB): void {
        this.rgb.update(c => ({ ...c, r: rgba.r, g: rgba.g, b: rgba.b }));
    }

    private updateRgbFromHsv(): void {
        const hsv = this.hsv();
        const hue = hsv.h ?? 0;
        const saturation = hsv.s ?? 0;
        const value = hsv.v ?? 0;
        const rgb = hsva2rgba(hue, saturation, value, this.alpha());
        if (this.rgb().r === rgb.r && this.rgb().g === rgb.g && this.rgb().b === rgb.b) {
            return;
        }
        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        if (!this.showButtons()) {
            this.emitValue();
        }
    }
}
