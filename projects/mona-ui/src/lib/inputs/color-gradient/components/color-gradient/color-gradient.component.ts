import { Clipboard } from "@angular/cdk/clipboard";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    effect,
    inject,
    Injector,
    input,
    model,
    NgZone,
    output,
    Signal,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideCopy } from "@lucide/angular";
import { distinctUntilChanged, fromEvent, Subject, switchMap, takeUntil } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { DropdownButtonItemComponent } from "../../../../buttons/dropdown-button/components/dropdown-button-item/dropdown-button-item.component";
import { DropdownButtonComponent } from "../../../../buttons/dropdown-button/components/dropdown-button/dropdown-button.component";
import { ThemeService } from "../../../../theme/services/theme.service";
import { ColorMode, ColorOutputFormat } from "../../../models/ColorMode";
import { Channel, HSLA, HSV, HSVA, HSVChannel, RGB, RGBA, RGBChannel } from "../../../models/ColorSpaces";
import { NumericTextBoxComponent } from "../../../numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { NumericTextBoxPrefixTemplateDirective } from "../../../numeric-text-box/directives/numeric-text-box-prefix-template.directive";
import { SliderComponent } from "../../../slider/components/slider/slider.component";
import { TextBoxComponent } from "../../../text-box/components/text-box/text-box.component";
import { TextBoxPrefixTemplateDirective } from "../../../text-box/directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../../text-box/directives/text-box-suffix-template.directive";
import { isValidHex, isValidHsla, isValidRgb } from "../../../utils/colorRegexes";
import { hex2rgba } from "../../../utils/hex2rgba";
import { hsla2hsva } from "../../../utils/hsla2hsva";
import { hsva2rgba } from "../../../utils/hsva2rgba";
import { rgba2hex } from "../../../utils/rgba2hex";
import { rgba2hsla } from "../../../utils/rgba2hsla";
import { rgba2hsva } from "../../../utils/rgba2hsva";
import { string2Hsla } from "../../../utils/string2Hsla";
import { string2rgba } from "../../../utils/string2rgba";
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

@Component({
    selector: "mona-color-gradient",
    templateUrl: "./color-gradient.component.html",
    imports: [
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
        LucideCopy
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class ColorGradientComponent implements ColorGradientVariantInputs, FormValueControl<string | null | undefined> {
    readonly #clipboard = inject(Clipboard);
    readonly #destroyRef = inject(DestroyRef);
    readonly #injector = inject(Injector);
    readonly #themeService = inject(ThemeService);
    readonly #valueChange$ = new Subject<string | null>();
    readonly #viewReady = signal(false);
    readonly #zone = inject(NgZone);
    #internalValueUpdatePending = false;
    #lastInternalValue: string | null | undefined = undefined;
    protected readonly alpha = signal(255);
    protected readonly alphaInputColor = computed(() => {
        const rgb = this.rgb();
        return rgba2hex(rgb.r, rgb.g, rgb.b, 255);
    });
    protected readonly alphaSliderBackground = computed(() => {
        const color = this.alphaInputColor();
        return `linear-gradient(to right, transparent, ${color})`;
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        return colorGradientBaseThemeVariants(theme)();
    });
    protected readonly colorInputs = computed(() => {
        const mode = this.colorMode();
        const baseInputs = mode === "rgb" ? this.createRgbInputList() : this.createHsvInputList();
        if (this.opacity()) {
            baseInputs.push({
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
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return colorGradientPreviewThemeVariants(theme)({ rounded });
    });
    protected readonly colorPreviews = computed(() => [
        {
            type: "current",
            color: this.selectedColor(),
            title: "Current color"
        },
        {
            type: "last",
            color: this.lastSelectedColor(),
            title: "Previous color",
            onClick: () => this.onResetColorClick()
        }
    ]);
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
    protected readonly hsvHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("hsvPointer");
    protected readonly hsvHandleLeft = signal(0);
    protected readonly hsvHandleTop = signal(0);
    protected readonly hexInputValue = signal("");
    protected readonly hsv = signal<HSV>({ h: 360, s: 100, v: 100 });
    protected readonly hsvRectangle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("hsvRectangle");
    protected readonly hsvRectangleBackground = computed(() => {
        const hsv = this.hsv();
        const rgb = hsva2rgba(hsv.h, 100, 100, 255);
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    });
    protected readonly hsvRectangleClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        return colorGradientHsvRectangleThemeVariants(theme)({ rounded });
    });
    protected readonly hsvRectangleHandleClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return colorGradientHsvRectangleHandleThemeVariants(theme)({ rounded });
    });
    protected readonly hueValue$ = new Subject<number>();
    protected readonly lastSelectedColor = signal("");
    protected readonly rgb = signal<RGB>({ r: 255, g: 255, b: 255 });
    protected readonly selectedColor = computed(() => {
        const rgb = this.rgb();
        if (rgb.r == null || rgb.g == null || rgb.b == null) {
            return "";
        }
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha() / 255})`;
    });
    protected readonly sliderHandleClasses = computed(() => {
        const theme = this.#themeService.theme();
        return colorGradientSliderHandleThemeVariants(theme)();
    });
    protected readonly sliderHeight = 10;

    /**
     * @description Emits when the Apply button is clicked.
     * The `Apply` button is only displayed when `showButtons` is set to true.
     */
    public readonly apply = output<void>();

    /**
     * @description Emits when the Cancel button is clicked.
     * The `Cancel` button is only displayed when `showButtons` is set to true.
     */
    public readonly cancel = output<void>();

    /**
     * @description Sets the disabled state of the color gradient.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Specifies the format of the color output.
     * @default "hex"
     */
    public readonly format = input<ColorOutputFormat>("hex");

    /**
     * @description Specifies whether the color picker should display the alpha slider.
     * @default true
     */
    public readonly opacity = input<boolean>(true);

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
    public readonly showButtons = input<boolean>(true);

    /**
     * @description Specifies whether the color picker should display the hex input.
     * @default true
     */
    public readonly showHexInput = input<boolean>(true);

    /**
     * @description Specifies whether the color picker should display the channel inputs (RGB or HSV).
     * @default true
     */
    public readonly showColorInputs = input<boolean>(true);

    /**
     * @description Emitted when the color gradient is interacted with on blur or value adjustment.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

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
                this.setSubscriptions();
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

    protected onAlphaChange(value: number | null): void {
        if (value == null) {
            return;
        }
        const alpha = this.getValidChannelValue(value, "a");
        this.alpha.set(alpha);
        this.updateHexInputValue();
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onApply(): void {
        this.lastSelectedColor.set(this.hex());
        this.emitValue();
        this.apply.emit();
    }

    protected onCancel(): void {
        this.hexInputValue.set(this.lastSelectedColor());
        this.cancel.emit();
    }

    protected onClearClick(): void {
        this.clear();
        if (!this.showButtons()) {
            this.emitValue(null);
        }
    }

    protected onCopyColorSelect(mode: "hex" | "rgb"): void {
        if (mode === "hex") {
            this.#clipboard.copy(this.hex());
        } else if (mode === "rgb") {
            const rgb = this.rgb();
            const alpha = Math.round((this.alpha() / 255) * 100) / 100;
            this.#clipboard.copy(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
        }
    }

    protected onHexChange(value: string): void {
        this.hexInputValue.set(value);
        if (!isValidHex(value)) {
            return;
        }
        const rgb = hex2rgba(value);
        const hsv = rgba2hsva(rgb.r, rgb.g, rgb.b, rgb.a);
        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        this.alpha.set(rgb.a ?? 255);
        this.hsvHandleLeft.set(this.getPositionFromSaturation(hsv.s));
        this.hsvHandleTop.set(this.getPositionFromValue(hsv.v));
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onHexInputBlur(): void {
        this.hexFocused.set(false);
        this.updateHexInputValue();
        this.touch.emit();
    }

    protected onHexInputFocus(): void {
        this.hexFocused.set(true);
    }

    protected onHsvChange(value: number | null, channel: HSVChannel): void {
        if (value == null) {
            return;
        }

        value = this.getValidChannelValue(value, channel);
        this.hsv.update(c => ({ ...c, [channel]: value }));
        this.updateOtherNullChannels(channel);

        const hsv = this.hsv();
        const rgb = hsva2rgba(hsv.h, hsv.s, hsv.v, this.alpha());

        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        this.updateHexInputValue();
        this.hsvHandleLeft.set(this.getPositionFromSaturation(hsv.s));
        this.hsvHandleTop.set(this.getPositionFromValue(hsv.v));
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onHsvHandleBlur(): void {
        this.touch.emit();
    }

    protected onHsvHandleKeyDown(event: KeyboardEvent): void {
        if (this.disabled()) {
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
            this.hsvHandleLeft.set(this.getPositionFromSaturation(newSaturation));
            this.hsvHandleTop.set(this.getPositionFromValue(newValue));
            this.updateHexInputValue();
        }
    }

    protected onNumericInputBlur(): void {
        this.touch.emit();
    }

    protected onPreviousColorKeyDown(event: KeyboardEvent, handler?: () => void): void {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handler?.();
        }
    }

    protected onResetColorClick(): void {
        this.onHexChange(this.lastSelectedColor());
    }

    protected onRgbChange(value: number | null, channel: RGBChannel): void {
        if (value == null) {
            return;
        }

        value = this.getValidChannelValue(value, channel);
        this.rgb.update(c => ({ ...c, [channel]: value }));
        this.updateOtherNullChannels(channel);

        const rgb = this.rgb();
        const hsv = rgba2hsva(rgb.r, rgb.g, rgb.b, this.alpha());

        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
        this.updateHexInputValue();
        this.hsvHandleLeft.set(this.getPositionFromSaturation(hsv.s));
        this.hsvHandleTop.set(this.getPositionFromValue(hsv.v));
        if (!this.showButtons()) {
            this.emitValue();
        }
    }

    protected onSliderBlur(): void {
        this.touch.emit();
    }

    protected onSwitchColorModeClick(): void {
        this.colorMode.set(this.colorMode() === "rgb" ? "hsv" : "rgb");
    }

    private afterNextRender(callback: () => void): void {
        afterNextRender(callback, { injector: this.#injector });
    }

    private clear(): void {
        this.hexInputValue.set("");
        this.lastSelectedColor.set("");
        this.rgb.update(c => ({ ...c, r: null, g: null, b: null }));
        this.alpha.set(255);
        this.hsv.update(c => ({ ...c, h: null, s: null, v: null }));
    }

    private createHsvInputList(): ColorInput[] {
        const hue: ColorInput = {
            key: "h",
            label: "H",
            value: this.hsv().h,
            min: 0,
            max: 360,
            change: (value: number | null) => this.onHsvChange(value, "h")
        };
        const saturation: ColorInput = {
            key: "s",
            label: "S",
            value: this.hsv().s,
            min: 0,
            max: 100,
            change: (value: number | null) => this.onHsvChange(value, "s")
        };
        const value: ColorInput = {
            key: "v",
            label: "V",
            value: this.hsv().v,
            min: 0,
            max: 100,
            change: (value: number | null) => this.onHsvChange(value, "v")
        };
        return [hue, saturation, value];
    }

    private createRgbInputList(): ColorInput[] {
        const red: ColorInput = {
            key: "r",
            label: "R",
            value: this.rgb().r,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "r")
        };
        const green: ColorInput = {
            key: "g",
            label: "G",
            value: this.rgb().g,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "g")
        };
        const blue: ColorInput = {
            key: "b",
            label: "B",
            value: this.rgb().b,
            min: 0,
            max: 255,
            change: (value: number | null) => this.onRgbChange(value, "b")
        };
        return [red, green, blue];
    }

    private emitValue(value?: string | null): void {
        if (value !== undefined) {
            this.#valueChange$.next(value);
            return;
        }
        const format = this.format();
        const rgb = this.rgb();
        const alpha = this.alpha();

        if (rgb.r == null || rgb.g == null || rgb.b == null || alpha == null) {
            this.#valueChange$.next(null);
            return;
        }

        if (format === "hex") {
            this.#valueChange$.next(rgba2hex(rgb.r, rgb.g, rgb.b, alpha));
        } else if (format === "rgb") {
            this.#valueChange$.next(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 255})`);
        } else if (format === "hsl") {
            const hsl = rgba2hsla(rgb.r, rgb.g, rgb.b, alpha);
            this.#valueChange$.next(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha / 255})`);
        }
    }

    private getPositionFromSaturation(saturation: number | null): number {
        if (saturation == null) {
            return 0;
        }
        const maxVal = this.hsvRectangle().nativeElement.offsetWidth;
        const minVal = (saturation / 100) * maxVal;
        return minVal - this.hsvHandle().nativeElement.offsetWidth / 2;
    }

    private getPositionFromValue(value: number | null): number {
        if (value == null) {
            return 0;
        }
        const maxVal = this.hsvRectangle().nativeElement.offsetHeight;
        const minVal = ((100 - value) / 100) * maxVal;
        return minVal - this.hsvHandle().nativeElement.offsetHeight / 2;
    }

    private getSaturationFromPosition(left: number): number {
        const minVal = left + this.hsvHandle().nativeElement.offsetWidth / 2;
        const maxVal = this.hsvRectangle().nativeElement.offsetWidth;
        return this.getValidChannelValue(Math.ceil((minVal / maxVal) * 100), "s");
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

    private getValueFromPosition(top: number): number {
        const minVal = top + this.hsvHandle().nativeElement.offsetHeight / 2;
        const maxVal = this.hsvRectangle().nativeElement.offsetHeight;
        return this.getValidChannelValue(Math.round(100 - (minVal / maxVal) * 100), "v");
    }

    private loadColorFromString(color: string): void {
        if (color == null || !this.hsvRectangle() || !this.hsvHandle()) {
            return;
        }

        const hexValid = isValidHex(color);
        const hsvValid = isValidHsla(color);
        const rgbValid = isValidRgb(color);

        let rgba: RGBA;
        let hsla: HSLA | undefined;
        let hsva: HSVA | undefined;
        if (hexValid) {
            rgba = hex2rgba(color);
        } else if (rgbValid) {
            rgba = string2rgba(color);
        } else if (hsvValid) {
            hsla = string2Hsla(color);
            hsva = hsla2hsva(hsla.h, hsla.s, hsla.l, hsla.a);
            rgba = hsva2rgba(hsva.h, hsva.s, hsva.v, hsva.a);
            hsva = {
                h: Math.round(hsva.h as number),
                s: Math.round(hsva.s as number),
                v: Math.round(hsva.v as number),
                a: hsva.a
            };
        } else {
            rgba = { r: null, g: null, b: null, a: null };
        }

        if (!hsva) {
            hsva = rgba2hsva(rgba.r, rgba.g, rgba.b, rgba.a);
        }

        this.updateHsv(hsva);
        this.updateRgb(rgba);
        this.alpha.set(rgba.a ?? 255);
        this.updateHexInputValue();
        this.afterNextRender(() => {
            this.hsvHandleLeft.set(this.getPositionFromSaturation(hsva.s));
            this.hsvHandleTop.set(this.getPositionFromValue(hsva.v));
        });
    }

    private setHsvRectPointerEvents(): void {
        const pointerDown$ = fromEvent<PointerEvent>(this.hsvHandle().nativeElement, "pointerdown").pipe(
            takeUntilDestroyed(this.#destroyRef)
        );
        const pointerMove$ = fromEvent<PointerEvent>(document, "pointermove").pipe(
            takeUntilDestroyed(this.#destroyRef)
        );
        const pointerUp$ = fromEvent<PointerEvent>(document, "pointerup").pipe(takeUntilDestroyed(this.#destroyRef));
        pointerDown$
            .pipe(switchMap(() => pointerMove$.pipe(takeUntil(pointerUp$))))
            .subscribe((event: PointerEvent) => {
                this.#zone.run(() => {
                    const position = this.updateHsvRectPointerPosition(event);
                    this.updateHsvValues(
                        this.getSaturationFromPosition(position.left),
                        this.getValueFromPosition(position.top)
                    );
                    this.updateHexInputValue();
                });
            });
        fromEvent<PointerEvent>(this.hsvRectangle().nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: PointerEvent) => {
                const position = this.updateHsvRectPointerPosition(event);
                this.updateHsvValues(
                    this.getSaturationFromPosition(position.left),
                    this.getValueFromPosition(position.top)
                );
                this.updateHexInputValue();
            });
    }

    private setSubscriptions(): void {
        this.hueValue$.pipe(distinctUntilChanged(), takeUntilDestroyed(this.#destroyRef)).subscribe((value: number) => {
            this.hsv.update(c => ({ ...c, h: Math.round(value) }));
            this.updateRgbFromHsv();
            this.updateHexInputValue();
        });
        this.setHsvRectPointerEvents();
        this.#valueChange$
            .pipe(takeUntilDestroyed(this.#destroyRef), distinctUntilChanged())
            .subscribe((value: string | null) => {
                this.#internalValueUpdatePending = true;
                this.#lastInternalValue = value;
                this.value.set(value);
            });
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
        if (value === null) {
            this.clear();
            return;
        }
        this.loadColorFromString(value);
        this.lastSelectedColor.set(this.hex());
    }

    private updateHexInputValue(): void {
        const rgb = this.rgb();
        const hex = rgba2hex(rgb.r, rgb.g, rgb.b, this.alpha());
        this.hexInputValue.set(hex);
    }

    private updateHsv(hsv: HSV): void {
        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
    }

    private updateHsvRectPointerPosition(event: PointerEvent): HsvHandlePosition {
        const containerRect = this.hsvRectangle().nativeElement.getBoundingClientRect();
        const pointerRect = this.hsvHandle().nativeElement.getBoundingClientRect();
        const left = event.clientX - containerRect.left - pointerRect.width / 2;
        const top = event.clientY - containerRect.top - pointerRect.height / 2;

        const newLeft = Math.min(Math.max(left, -pointerRect.width / 2), containerRect.width - pointerRect.width / 2);
        const newTop = Math.min(Math.max(top, -pointerRect.height / 2), containerRect.height - pointerRect.height / 2);

        this.hsvHandleLeft.set(newLeft);
        this.hsvHandleTop.set(newTop);
        return { left: newLeft, top: newTop };
    }

    private updateHsvValues(saturation: number, value: number): void {
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

interface HsvHandlePosition {
    readonly left: number;
    readonly top: number;
}
