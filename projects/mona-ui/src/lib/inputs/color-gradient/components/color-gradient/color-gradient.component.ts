import { Clipboard } from "@angular/cdk/clipboard";
import { NgTemplateOutlet } from "@angular/common";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    NgZone,
    OnInit,
    output,
    Signal,
    signal,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Copy, LucideAngularModule } from "lucide-angular";
import { distinctUntilChanged, fromEvent, Subject, switchMap, takeUntil, tap } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ContextMenuComponent } from "../../../../menus/contextmenu/components/context-menu/context-menu.component";
import { MenuItemComponent } from "../../../../menus/menu-item/menu-item.component";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorGradientComponent),
            multi: true
        }
    ],
    imports: [
        FormsModule,
        NumericTextBoxComponent,
        NumericTextBoxPrefixTemplateDirective,
        ButtonDirective,
        TextBoxComponent,
        TextBoxPrefixTemplateDirective,
        TextBoxSuffixTemplateDirective,
        ContextMenuComponent,
        MenuItemComponent,
        SliderComponent,
        NgTemplateOutlet,
        LucideAngularModule
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class ColorGradientComponent implements OnInit, AfterViewInit, ControlValueAccessor, ColorGradientVariantInputs {
    readonly #clipboard = inject(Clipboard);
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    readonly #valueChange$ = new Subject<string | null>();
    readonly #zone: NgZone = inject(NgZone);
    #propagateChange: Action<string | null> = () => {};
    #propagateTouched: Action = () => {};
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
                change: (value: number) => this.onAlphaChange(value)
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
    protected readonly copyIcon = Copy;
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
        const { red, green, blue } = { red: rgb.r, green: rgb.g, blue: rgb.b };
        if (red == null || green == null || blue == null) {
            return "";
        }
        return `rgba(${red}, ${green}, ${blue}, ${this.alpha() / 255})`;
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
     */
    public readonly disabled = input(false);

    /**
     * @description Specifies the format of the color output.
     */
    public readonly format = input<ColorOutputFormat>("hex");

    /**
     * @description Specifies whether the color picker should display the alpha slider.
     * @default true
     */
    public readonly opacity = input<boolean>(true);

    /**
     * @description Specifies the rounded variant of the color picker.
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
     * @description Specifies whether the color picker should display the RGB input.
     * @default true
     */
    public readonly showRgbInput = input<boolean>(true);

    public ngAfterViewInit() {
        this.setSubscriptions();
    }

    public ngOnInit(): void {
        this.lastSelectedColor.set(this.hex());
    }

    public onAlphaChange(value: number): void {
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

    public onApply(): void {
        this.lastSelectedColor.set(this.hex());
        this.emitValue();
        this.apply.emit();
    }

    public onCancel(): void {
        this.hexInputValue.set(this.lastSelectedColor());
        this.cancel.emit();
    }

    public onClearClick(): void {
        this.clear();
        if (!this.showButtons()) {
            this.emitValue(null);
        }
    }

    public onCopyColorSelect(mode: "hex" | "rgb"): void {
        if (mode === "hex") {
            this.#clipboard.copy(this.hex());
        } else if (mode === "rgb") {
            const rgb = this.rgb();
            const alpha = Math.round((this.alpha() / 255) * 100) / 100;
            this.#clipboard.copy(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
        }
    }

    public onHexChange(value: string): void {
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

    public onHexInputBlur(): void {
        this.updateHexInputValue();
        this.#propagateTouched();
    }

    public onHexInputFocus(): void {
        this.hexFocused.set(true);
    }

    public onHsvChange(value: number, channel: HSVChannel): void {
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

    public onHsvHandleBlur(): void {
        this.#propagateTouched();
    }

    public onHsvHandleKeyDown(event: KeyboardEvent): void {
        if (this.disabled()) {
            return;
        }

        const step = event.shiftKey ? 10 : 1;
        const largeStep = 25;
        let handled = false;

        const currentLeft = this.hsvHandleLeft();
        const currentTop = this.hsvHandleTop();
        const containerRect = this.hsvRectangle().nativeElement.getBoundingClientRect();
        const handleRect = this.hsvHandle().nativeElement.getBoundingClientRect();
        const maxLeft = containerRect.width - handleRect.width / 2;
        const maxTop = containerRect.height - handleRect.height / 2;
        const minLeft = -handleRect.width / 2;
        const minTop = -handleRect.height / 2;

        let newLeft = currentLeft;
        let newTop = currentTop;

        switch (event.key) {
            case "ArrowLeft":
                newLeft = Math.max(minLeft, currentLeft - step);
                handled = true;
                break;
            case "ArrowRight":
                newLeft = Math.min(maxLeft, currentLeft + step);
                handled = true;
                break;
            case "ArrowUp":
                newTop = Math.max(minTop, currentTop - step);
                handled = true;
                break;
            case "ArrowDown":
                newTop = Math.min(maxTop, currentTop + step);
                handled = true;
                break;
            case "Home":
                newLeft = minLeft;
                newTop = minTop;
                handled = true;
                break;
            case "End":
                newLeft = maxLeft;
                newTop = maxTop;
                handled = true;
                break;
            case "PageUp":
                newTop = Math.max(minTop, currentTop - largeStep);
                handled = true;
                break;
            case "PageDown":
                newTop = Math.min(maxTop, currentTop + largeStep);
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
            this.hsvHandleLeft.set(newLeft);
            this.hsvHandleTop.set(newTop);
            this.updateHsvValues();
            this.updateHexInputValue();
        }
    }

    public onNumericInputBlur(): void {
        this.#propagateTouched();
    }

    public onResetColorClick(): void {
        this.onHexChange(this.lastSelectedColor());
    }

    public onRgbChange(value: number, channel: RGBChannel): void {
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

    public onSliderBlur(): void {
        this.#propagateTouched();
    }

    public onSwitchColorModeClick(): void {
        this.colorMode.set(this.colorMode() === "rgb" ? "hsv" : "rgb");
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(value: string): void {
        if (!this.hsvRectangle() || !this.hsvHandle()) {
            return;
        }
        if (value == null) {
            this.clear();
            return;
        }
        this.loadColorFromString(value);
        this.lastSelectedColor.set(this.hex());
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
            change: (value: number) => this.onHsvChange(value, "h")
        };
        const saturation: ColorInput = {
            key: "s",
            label: "S",
            value: this.hsv().s,
            min: 0,
            max: 100,
            change: (value: number) => this.onHsvChange(value, "s")
        };
        const value: ColorInput = {
            key: "v",
            label: "V",
            value: this.hsv().v,
            min: 0,
            max: 100,
            change: (value: number) => this.onHsvChange(value, "v")
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
            change: (value: number) => this.onRgbChange(value, "r")
        };
        const green: ColorInput = {
            key: "g",
            label: "G",
            value: this.rgb().g,
            min: 0,
            max: 255,
            change: (value: number) => this.onRgbChange(value, "g")
        };
        const blue: ColorInput = {
            key: "b",
            label: "B",
            value: this.rgb().b,
            min: 0,
            max: 255,
            change: (value: number) => this.onRgbChange(value, "b")
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

        const { red, green, blue } = { red: rgb.r, green: rgb.g, blue: rgb.b };
        if (red == null || green == null || blue == null || alpha == null) {
            this.#valueChange$.next(null);
            return;
        }

        if (format === "hex") {
            this.#valueChange$.next(rgba2hex(red, green, blue, alpha));
        } else if (format === "rgb") {
            this.#valueChange$.next(`rgba(${red}, ${green}, ${blue}, ${alpha / 255})`);
        } else if (format === "hsl") {
            const hsl = rgba2hsla(red, green, blue, alpha);
            this.#valueChange$.next(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha / 255})`);
        }
    }

    private getSaturationFromPosition(): number {
        const minVal = this.hsvHandle().nativeElement.offsetLeft + this.hsvHandle().nativeElement.offsetWidth / 2;
        const maxVal = this.hsvRectangle().nativeElement.offsetWidth;
        return Math.ceil((minVal / maxVal) * 100);
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

    private getValueFromPosition(): number {
        const minVal = this.hsvHandle().nativeElement.offsetTop + this.hsvHandle().nativeElement.offsetHeight / 2;
        const maxVal = this.hsvRectangle().nativeElement.offsetHeight;
        return Math.round(Math.abs(100 - (minVal / maxVal) * 100));
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
        this.hexInputValue.set(this.hex());
        window.setTimeout(() => {
            this.hsvHandleLeft.set(this.getPositionFromSaturation(hsva.s));
            this.hsvHandleTop.set(this.getPositionFromValue(hsva.v));
        });
    }

    private setHsvRectPointerEvents(): void {
        const mouseDown$ = fromEvent<MouseEvent>(this.hsvHandle().nativeElement, "mousedown").pipe(
            takeUntilDestroyed(this.#destroyRef)
        );
        const mouseMove$ = fromEvent<MouseEvent>(document, "mousemove").pipe(takeUntilDestroyed(this.#destroyRef));
        const mouseUp$ = fromEvent<MouseEvent>(document, "mouseup").pipe(takeUntilDestroyed(this.#destroyRef));
        mouseDown$.pipe(switchMap(() => mouseMove$.pipe(takeUntil(mouseUp$)))).subscribe((event: MouseEvent) => {
            this.#zone.run(() => {
                this.updateHsvRectPointerPosition(event);
                this.updateHsvValues();
                this.updateHexInputValue();
            });
        });
        fromEvent<MouseEvent>(this.hsvRectangle().nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: MouseEvent) => {
                this.updateHsvRectPointerPosition(event);
                window.setTimeout(() => {
                    this.updateHsvValues();
                    this.updateHexInputValue();
                });
            });
    }

    private setSubscriptions(): void {
        this.hueValue$.pipe(distinctUntilChanged(), takeUntilDestroyed(this.#destroyRef)).subscribe((value: number) => {
            this.hsv.update(c => ({ ...c, h: Math.round(value) }));
            this.updateHsvValues();
            this.updateHexInputValue();
        });
        this.setHsvRectPointerEvents();
        this.#valueChange$
            .pipe(takeUntilDestroyed(this.#destroyRef), distinctUntilChanged())
            .subscribe((value: string | null) => this.#propagateChange(value));
    }

    private updateHexInputValue(): void {
        const rgb = this.rgb();
        const hex = rgba2hex(rgb.r, rgb.g, rgb.b, this.alpha());
        this.hexInputValue.set(hex);
    }

    private updateHsvRectPointerPosition(event: MouseEvent): void {
        const containerRect = this.hsvRectangle().nativeElement.getBoundingClientRect();
        const pointerRect = this.hsvHandle().nativeElement.getBoundingClientRect();
        const left = event.clientX - containerRect.left - pointerRect.width / 2;
        const top = event.clientY - containerRect.top - pointerRect.height / 2;

        let newLeft;
        if (left < -pointerRect.width / 2) {
            newLeft = -pointerRect.width / 2;
        } else if (left > containerRect.width - pointerRect.width / 2) {
            newLeft = containerRect.width - pointerRect.width / 2;
        } else {
            newLeft = left;
        }

        let newTop;
        if (top < -pointerRect.height / 2) {
            newTop = -pointerRect.height / 2;
        } else if (top > containerRect.height - pointerRect.height / 2) {
            newTop = containerRect.height - pointerRect.height / 2;
        } else {
            newTop = top;
        }

        this.hsvHandleLeft.set(newLeft);
        this.hsvHandleTop.set(newTop);
    }

    private updateHsv(hsv: HSV): void {
        this.hsv.update(c => ({ ...c, h: hsv.h, s: hsv.s, v: hsv.v }));
    }

    private updateHsvValues(): void {
        const saturation = this.getSaturationFromPosition();
        const value = this.getValueFromPosition();
        const hue = this.hsv().h;
        if (hue === null) {
            this.hsv.update(c => ({ ...c, h: 0 }));
        }

        this.hsv.update(c => ({ ...c, s: saturation, v: value }));
        const rgb = hsva2rgba(this.hsv().h, saturation, value, this.alpha());
        if (this.rgb().r === rgb.r && this.rgb().g === rgb.g && this.rgb().b === rgb.b) {
            return;
        }
        this.rgb.update(c => ({ ...c, r: rgb.r, g: rgb.g, b: rgb.b }));
        if (!this.showButtons()) {
            this.emitValue();
        }
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
}
