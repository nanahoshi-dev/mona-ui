import { Component, computed, ElementRef, inject, input, model, output, signal, Signal } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { ColorScheme, PaletteType } from "@mirei/mona-ui/common";
import { ThemeService } from "@mirei/mona-ui/theme";
import { count } from "@mirei/ts-collections";
import {
    colorPaletteBaseThemeVariants,
    colorPaletteItemThemeVariants,
    ColorPaletteVariantInput,
    ColorPaletteVariantProps
} from "../../styles/color-palette.styles";
import { flatColorScheme, materialColorScheme, websafeColorScheme } from "../../utils/colorSchemes";

@Component({
    selector: "mona-color-palette",
    templateUrl: "./color-palette.component.html",
    host: {
        "[class]": "baseClasses()",
        "[style.grid-template-columns]": "'repeat('+colorScheme().columns+', minmax('+tileSize()+'px, 1fr))'",
        "[style.grid-auto-rows]": "tileSize()+'px'",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly()",
        "[attr.data-required]": "required() || null",
        "[attr.role]": "'grid'",
        "[attr.aria-label]": "'Color palette'",
        "[attr.aria-disabled]": "disabled()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-readonly]": "readonly()",
        "[attr.aria-required]": "required()"
    }
})
export class ColorPaletteComponent implements ColorPaletteVariantInput, FormValueControl<string | null> {
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        return colorPaletteBaseThemeVariants(theme)();
    });
    protected readonly colorScheme: Signal<ColorScheme> = computed(() => {
        const palette = this.palette();
        const columns = this.columns();
        if (typeof palette === "string") {
            return this.getColorScheme(palette as PaletteType);
        } else {
            const paletteArray = Array.from(palette);
            if (paletteArray.length === 0) {
                return flatColorScheme;
            }
        }
        const maxColumns = Math.min(count(palette), columns);
        return {
            colors: [...palette],
            columns: maxColumns,
            name: "custom"
        };
    });
    protected readonly paletteItemClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return colorPaletteItemThemeVariants(theme)({ rounded });
    });
    protected readonly colorRows = computed(() => {
        const { colors, columns } = this.colorScheme();
        const rows: string[][] = [];
        for (let i = 0; i < colors.length; i += columns) {
            rows.push(colors.slice(i, i + columns));
        }
        return rows;
    });
    protected readonly focusedColorIndex = signal<number>(-1);
    protected readonly activeColorIndex = computed(() =>
        this.focusedColorIndex() === -1 ? 0 : this.focusedColorIndex()
    );
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.value())
    );

    /**
     * @description The number of columns in the color palette grid.
     * Only applicable when using a custom palette.
     * @default 10
     */
    public readonly columns = input(10);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Marks the color palette as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description The palette to display — one of the built-in `"flat"`, `"material"`, or `"websafe"` schemes, or a
     * custom iterable of color strings. An empty custom palette falls back to the flat scheme.
     * @default []
     */
    public readonly palette = input<PaletteType | Iterable<string>>([]);

    /**
     * @description Prevents value changes while preserving the component's visual state. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Border-radius preset applied to the color palette items.
     * @default "none"
     */
    public readonly rounded = input<ColorPaletteVariantProps["rounded"]>("none");

    /**
     * @description Sets whether the color palette is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description The size of each tile in the color palette grid.
     * @default 18
     */
    public readonly tileSize = input(18);

    /**
     * @description Emitted when the color palette is interacted with on blur or color selection.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the color palette. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Two-way bindable current color value.
     * @default null
     */
    public readonly value = model<string | null>(null);

    protected focusColorTile(index: number): void {
        setTimeout(() => {
            const colorTiles = this.#elementRef.nativeElement.querySelectorAll("[data-color-index]");
            const targetTile = colorTiles[index] as HTMLElement;
            if (targetTile) {
                targetTile.focus();
            }
        });
    }

    protected onColorBlur(): void {
        this.touch.emit();
    }

    protected onColorFocus(index: number): void {
        this.focusedColorIndex.set(index);
    }

    protected onColorSelect(color: string): void {
        if (this.disabled() || this.readonly()) {
            return;
        }

        const resultColor = this.value() === color ? null : color;
        this.value.set(resultColor);
        this.touch.emit();
    }

    protected onKeyDown(event: KeyboardEvent, colorIndex: number): void {
        if (this.disabled()) {
            return;
        }

        const colors = this.colorScheme().colors;
        const columns = this.colorScheme().columns;
        let newIndex = colorIndex;
        let handled = false;

        switch (event.key) {
            case "ArrowLeft":
                newIndex = Math.max(0, colorIndex - 1);
                handled = true;
                break;
            case "ArrowRight":
                newIndex = Math.min(colors.length - 1, colorIndex + 1);
                handled = true;
                break;
            case "ArrowUp":
                newIndex = Math.max(0, colorIndex - columns);
                handled = true;
                break;
            case "ArrowDown":
                newIndex = Math.min(colors.length - 1, colorIndex + columns);
                handled = true;
                break;
            case "Home":
                newIndex = 0;
                handled = true;
                break;
            case "End":
                newIndex = colors.length - 1;
                handled = true;
                break;
            case "Enter":
            case " ":
                if (!this.readonly()) {
                    this.onColorSelect(colors[colorIndex]);
                }
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
            this.focusedColorIndex.set(newIndex);
            this.focusColorTile(newIndex);
        }
    }

    private getColorScheme(paletteType: PaletteType): ColorScheme {
        switch (paletteType) {
            case "flat":
                return flatColorScheme;
            case "material":
                return materialColorScheme;
            case "websafe":
                return websafeColorScheme;
        }
    }
}
