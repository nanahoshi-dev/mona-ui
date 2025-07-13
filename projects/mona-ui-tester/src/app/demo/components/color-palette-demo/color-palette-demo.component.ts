import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ColorPaletteComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { customColorPalette } from "../../utils/customColorPalette";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-color-palette-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./color-palette-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteDemoComponent extends AbstractDemoComponent<ColorPaletteComponent> {
    readonly #injector = createFeatureInjector({
        customPalette: {
            code: ``,
            active: false,
            description: `A custom color palette that can be used to test the color palette component with a different set of colors.`,
            name: "Custom Palette"
        }
    });
    protected readonly config = signal<ComponentConfig<ColorPaletteComponent>>({
        code: `
            <mona-color-palette
                [columns]="columns()"
                [disabled]="disabled()"
                [palette]="customPaletteActive ? customPalette : palette()"
                [rounded]="rounded()"
                [tileSize]="tileSize()"></mona-color-palette>
        `,
        inputs: {
            columns: {
                type: "number",
                value: 10
            },
            disabled: {
                type: "boolean",
                value: false
            },
            palette: {
                type: "dropdown",
                value: ["flat", "material", "websafe"],
                defaultValue: "flat"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "none"
            },
            tileSize: {
                type: "number",
                value: 24
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ColorPaletteComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ColorPaletteWrapperComponent = ColorPaletteWrapperComponent;
}

@Component({
    imports: [ColorPaletteComponent],
    template: `
        @let customPaletteActive = features()["customPalette"] && features()["customPalette"].active;
        <mona-color-palette
            [columns]="columns()"
            [disabled]="disabled()"
            [palette]="customPaletteActive ? customPalette : palette()"
            [rounded]="rounded()"
            [tileSize]="tileSize()"></mona-color-palette>
    `
})
export class ColorPaletteWrapperComponent implements ComponentInputsAsSignal<ColorPaletteComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly customPalette = customColorPalette;
    public readonly columns = input<ReturnType<ColorPaletteComponent["columns"]>>(10);
    public readonly disabled = input<ReturnType<ColorPaletteComponent["disabled"]>>(false);
    public readonly palette = input<ReturnType<ColorPaletteComponent["palette"]>>("flat");
    public readonly rounded = input<ReturnType<ColorPaletteComponent["rounded"]>>("none");
    public readonly tileSize = input<ReturnType<ColorPaletteComponent["tileSize"]>>(24);
}
