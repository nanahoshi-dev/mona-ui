import {
    booleanAttribute,
    Component,
    computed,
    DOCUMENT,
    ElementRef,
    inject,
    input,
    model,
    output,
    signal
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import type { ColorPaletteItem, PaletteType } from "@nanahoshi/mona-ui/common";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { colorKey, injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";
import type { ColorScheme } from "@nanahoshi/mona-ui/internal";
import { COLOR_PALETTE_DEFAULT_MESSAGES } from "../../i18n/color-palette.default-messages";
import {
    colorPaletteBaseThemeVariants,
    colorPaletteItemThemeVariants,
    ColorPaletteVariantInput,
    ColorPaletteVariantProps
} from "../../styles/color-palette.styles";
import { flatColorScheme, materialColorScheme, websafeColorScheme } from "../../utils/colorSchemes";

interface PaletteTile {
    readonly color: string;
    readonly name: string | null;
}

interface PaletteGrid {
    readonly columns: number;
    readonly tiles: readonly PaletteTile[];
}

@Component({
    selector: "mona-color-palette",
    templateUrl: "./color-palette.component.html",
    host: {
        "[class]": "baseClasses()",
        "[style.grid-template-columns]": "'repeat('+grid().columns+', minmax('+tileSize()+'px, 1fr))'",
        "[style.grid-auto-rows]": "tileSize()+'px'",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly()",
        "(focusout)": "onFocusOut($event)",
        "[attr.data-required]": "required() || null",
        "[attr.role]": "'grid'",
        "[attr.aria-label]": "labelledBy() ? null : ariaLabel() || messages().colorPalette",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.aria-disabled]": "effectiveDisabled()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-readonly]": "readonly()",
        "[attr.aria-required]": "required()"
    }
})
export class ColorPaletteComponent implements ColorPaletteVariantInput, FormValueControl<string | null> {
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    protected readonly activeColorIndex = computed(() => {
        const focused = this.focusedColorIndex();
        if (focused !== -1) {
            return Math.min(focused, this.grid().tiles.length - 1);
        }
        return Math.max(this.selectedIndex(), 0);
    });
    protected readonly baseClasses = computed(() => {
        return colorPaletteBaseThemeVariants();
    });
    protected readonly colorRows = computed(() => {
        const { columns, tiles } = this.grid();
        const rows: PaletteTile[][] = [];
        for (let i = 0; i < tiles.length; i += columns) {
            rows.push(tiles.slice(i, i + columns));
        }
        return rows;
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly focusedColorIndex = signal<number>(-1);
    protected readonly grid = computed<PaletteGrid>(() => {
        const palette = this.palette();
        if (typeof palette === "string") {
            return this.gridFromScheme(this.getColorScheme(palette as PaletteType));
        }
        // Read once, so a generator can be used as the palette.
        const items = Array.from(palette);
        if (items.length === 0) {
            return this.gridFromScheme(flatColorScheme);
        }
        return {
            columns: Math.min(items.length, Math.max(1, Math.floor(this.columns()) || 1)),
            tiles: items.map(item =>
                typeof item === "string" ? { color: item, name: null } : { color: item.color, name: item.name || null }
            )
        };
    });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("colorPalette", COLOR_PALETTE_DEFAULT_MESSAGES);
    protected readonly paletteItemClasses = computed(() => {
        const rounded = this.rounded();
        return colorPaletteItemThemeVariants({ rounded });
    });
    /**
     * The first tile showing the value. Two spellings of a color count as the same color, so a value that went through
     * a server or the color gradient keeps its selection, and a repeated color marks one tile only.
     */
    protected readonly selectedIndex = computed(() => {
        const value = this.value();
        if (!value) {
            return -1;
        }
        const key = colorKey(value, this.#document);
        return this.tileKeys().indexOf(key);
    });
    protected readonly tileKeys = computed(() => this.grid().tiles.map(tile => colorKey(tile.color, this.#document)));

    /**
     * @description Accessible label for the color palette grid.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Id of the element that names the color palette grid.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Whether activating the selected tile clears the value. A required palette never clears.
     * @default true
     */
    public readonly clearable = input(true, { transform: booleanAttribute });

    /**
     * @description Emitted with the tile's color each time a tile is activated, also when it's already selected, which
     * doesn't change `value`.
     */
    public readonly colorSelect = output<string>();

    /**
     * @description The number of columns in the color palette grid. Only applicable when using a custom palette. A
     * value below 1 shows one column.
     * @default 10
     */
    public readonly columns = input(10);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the color palette as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description The palette to display — one of the built-in `"flat"`, `"material"`, or `"websafe"` schemes, or a
     * custom iterable of colors. A custom color is a CSS color string, or a `{ color, name }` item when it has a name
     * of its own. An empty custom palette falls back to the flat scheme.
     * @default []
     */
    public readonly palette = input<PaletteType | Iterable<string | ColorPaletteItem>>([]);

    /**
     * @description Prevents value changes while preserving the component's visual state. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the color palette is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the color palette items.
     * @default "none"
     */
    public readonly rounded = input<ColorPaletteVariantProps["rounded"]>("none");

    /**
     * @description The size of each tile in the color palette grid, in pixels. Below 24, tiles miss the minimum target
     * size of WCAG 2.5.8.
     * @default 24
     */
    public readonly tileSize = input(24);

    /**
     * @description Emitted when focus leaves the color palette or a color is selected.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the color palette. When bound to a signal form field via `[formField]`,
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
     * @description Moves focus to the palette's active tile.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const element: HTMLElement = this.#elementRef.nativeElement;
        element.querySelector<HTMLElement>('[data-color-index][tabindex="0"]')?.focus(options);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onColorFocus(index: number): void {
        this.focusedColorIndex.set(index);
    }

    protected onColorSelect(index: number): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }

        const { color } = this.grid().tiles[index];
        if (index !== this.selectedIndex()) {
            this.value.set(color);
        } else if (this.clearable() && !this.required()) {
            this.value.set(null);
        }
        this.colorSelect.emit(color);
        this.touch.emit();
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        const element: HTMLElement = this.#elementRef.nativeElement;
        if (nextTarget instanceof Node && element.contains(nextTarget)) {
            return;
        }
        // Coming back to the grid starts from the selected color, which may have changed in the meantime.
        this.focusedColorIndex.set(-1);
        this.touch.emit();
    }

    protected onKeyDown(event: KeyboardEvent, colorIndex: number): void {
        if (this.effectiveDisabled()) {
            return;
        }

        const { columns, tiles } = this.grid();
        const lastIndex = tiles.length - 1;
        const rowStart = colorIndex - (colorIndex % columns);
        const isRtl = this.isRtl();
        const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";
        const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
        let newIndex = colorIndex;
        let handled = false;

        switch (event.key) {
            case prevKey:
                newIndex = Math.max(0, colorIndex - 1);
                handled = true;
                break;
            case nextKey:
                newIndex = Math.min(lastIndex, colorIndex + 1);
                handled = true;
                break;
            case "ArrowUp":
                newIndex = colorIndex - columns >= 0 ? colorIndex - columns : colorIndex;
                handled = true;
                break;
            case "ArrowDown":
                newIndex = colorIndex + columns <= lastIndex ? colorIndex + columns : colorIndex;
                handled = true;
                break;
            case "Home":
                newIndex = event.ctrlKey ? 0 : rowStart;
                handled = true;
                break;
            case "End":
                newIndex = event.ctrlKey ? lastIndex : Math.min(lastIndex, rowStart + columns - 1);
                handled = true;
                break;
            case "Enter":
            case " ":
                if (!event.repeat) {
                    this.onColorSelect(colorIndex);
                }
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
            if (newIndex !== colorIndex) {
                this.focusColorTile(newIndex);
            }
        }
    }

    private focusColorTile(index: number): void {
        this.focusedColorIndex.set(index);
        const tiles: NodeListOf<HTMLElement> = this.#elementRef.nativeElement.querySelectorAll("[data-color-index]");
        tiles[index]?.focus();
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

    private gridFromScheme({ colors, columns }: ColorScheme): PaletteGrid {
        return { columns, tiles: colors.map(color => ({ color, name: null })) };
    }
}
