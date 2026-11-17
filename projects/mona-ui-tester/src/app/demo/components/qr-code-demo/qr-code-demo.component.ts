import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { QrCodeComponent, type QrCodeOverlay } from "@nanahoshi/mona-ui/qr-code";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const LOGO = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4338ca"/>` +
        `<path d="M32 10 37.6 26.4 54 32 37.6 37.6 32 54 26.4 37.6 10 32 26.4 26.4Z" fill="#fff"/></svg>`
)}`;

const OVERLAYS: readonly { readonly text: string; readonly value: QrCodeOverlay | null }[] = [
    { text: "None", value: null },
    { text: "Image", value: { size: 0.22, src: LOGO, type: "image" } },
    { text: "Swiss cross", value: { type: "swiss" } }
];

@Component({
    selector: "app-qr-code-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./qr-code-demo.component.html"
})
export class QrCodeDemoComponent extends AbstractDemoComponent<QrCodeComponent> {
    protected readonly config = computed<ComponentConfig<QrCodeComponent>>(() => ({
        inputs: deriveInputConfig<QrCodeComponent>(this.metadata(), {
            background: {
                type: "color",
                value: "#ffffff"
            },
            color: {
                type: "color",
                value: "#000000"
            },
            overlay: {
                type: "customDropdown",
                value: OVERLAYS,
                textField: "text",
                valueField: "value",
                defaultValue: null,
                placeholder: "None",
                note: "An overlay needs a higher error correction level, such as H, to stay readable."
            },
            quietZone: {
                type: "number",
                min: 0,
                max: 10,
                value: 4
            },
            size: {
                type: "number",
                min: 64,
                max: 480,
                value: 200
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            },
            // The demo curates a value instead of the library's empty default, which draws nothing.
            value: {
                type: "string",
                value: "https://nanahoshi.dev/mona-ui"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("QrCodeComponent");
    protected readonly wrapperComponent = QrCodeWrapperComponent;
}

@Component({
    imports: [QrCodeComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <mona-qr-code
            [aria-label]="ariaLabel()"
            [background]="background()"
            [color]="color()"
            [encoding]="encoding()"
            [errorCorrection]="errorCorrection()"
            [overlay]="overlay()"
            [quietZone]="quietZone()"
            [size]="size()"
            [value]="value()"
            [class]="userClass()" />
    `
})
class QrCodeWrapperComponent implements ComponentInputsAsSignal<QrCodeComponent> {
    public readonly ariaLabel = input("");
    public readonly background = input("#ffffff");
    public readonly color = input("#000000");
    public readonly encoding = input<ReturnType<QrCodeComponent["encoding"]>>("utf-8");
    public readonly errorCorrection = input<ReturnType<QrCodeComponent["errorCorrection"]>>("M");
    public readonly overlay = input<QrCodeOverlay | null>(null);
    public readonly quietZone = input(4);
    public readonly size = input<number | string>(200);
    public readonly userClass = input("");
    public readonly value = input<string | number>("https://nanahoshi.dev/mona-ui");
}
