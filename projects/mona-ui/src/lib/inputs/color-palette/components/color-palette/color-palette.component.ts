import { Component, computed, forwardRef, inject, input, signal, Signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { count } from "@mirei/ts-collections";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { ColorScheme } from "../../../models/ColorScheme";
import { PaletteType } from "../../../models/PaletteType";
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
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorPaletteComponent),
            multi: true
        }
    ],
    host: {
        "[class]": "baseClasses()",
        "[style.grid-template-columns]": "'repeat('+colorScheme().columns+', minmax('+tileSize()+'px, 1fr))'",
        "[style.grid-auto-rows]": "tileSize()+'px'",
        "[attr.data-disabled]": "disabled()",
        "[attr.role]": "'grid'",
        "[attr.aria-label]": "'Color palette'"
    }
})
export class ColorPaletteComponent implements ControlValueAccessor, ColorPaletteVariantInput {
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<string | null> | null = null;
    #propagateTouched: Action = () => {};
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
    protected readonly selectedColor = signal<string | null>(null);
    protected readonly focusedColorIndex = signal<number>(-1);

    /**
     * @description The number of columns in the color palette grid.
     * Only applicable when using a custom palette.
     */
    public readonly columns = input(10);

    /**
     * @description Sets the disabled state of the color palette.
     */
    public readonly disabled = input(false);

    /**
     * @description The type of color palette to use.
     * This can be either "flat", "material", or "websafe",
     * or a custom iterable of colors.
     * If the provided palette is empty, it defaults to the flat color scheme.
     */
    public readonly palette = input<PaletteType | Iterable<string>>([]);

    /**
     * @description Sets the border radius of the color palette items.
     */
    public readonly rounded = input<ColorPaletteVariantProps["rounded"]>("none");

    /**
     * @description The size of each tile in the color palette grid.
     */
    public readonly tileSize = input(18);

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(obj: string | null): void {
        const color = this.colorScheme().colors.find(c => c === obj) ?? null;
        this.selectedColor.set(color);
    }

    protected focusColorTile(index: number): void {
        setTimeout(() => {
            const colorTiles = document.querySelectorAll("[data-color-index]");
            colorTiles.forEach((tile, i) => {
                tile.setAttribute("tabindex", i === index ? "0" : "-1");
            });

            const targetTile = colorTiles[index] as HTMLElement;
            if (targetTile) {
                targetTile.focus();
            }
        });
    }

    protected onColorBlur(): void {
        this.#propagateTouched();
    }

    protected onColorFocus(index: number): void {
        this.focusedColorIndex.set(index);
    }

    protected onColorSelect(color: string): void {
        const resultColor = this.selectedColor() === color ? null : color;
        this.selectedColor.set(resultColor);
        this.#propagateChange?.(resultColor);
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
                this.onColorSelect(colors[colorIndex]);
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
