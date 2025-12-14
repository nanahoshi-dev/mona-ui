import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, input, signal } from "@angular/core";
import { ButtonDirective, PopupComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-popup-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./popup-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupDemoComponent extends AbstractDemoComponent<PopupComponent> {
    readonly #document = inject(DOCUMENT);
    readonly #offsetList = [
        { horizontal: 0, vertical: 0 },
        { horizontal: 0, vertical: 4 },
        { horizontal: 0, vertical: -4 },
        { horizontal: 120, vertical: -20 },
        { horizontal: -120, vertical: -20 }
    ];
    protected readonly config = signal<ComponentConfig<PopupComponent>>({
        code: ``,
        inputs: {
            anchor: {
                type: "object",
                value: this.#document.body
            },
            anchorConnectionPoint: {
                type: "dropdown",
                value: [
                    "topleft",
                    "topcenter",
                    "topright",
                    "centerleft",
                    "center",
                    "centerright",
                    "bottomleft",
                    "bottomcenter",
                    "bottomright"
                ],
                defaultValue: "bottomcenter"
            },
            animation: {
                type: "boolean",
                value: true
            },
            backdropClass: {
                type: "string",
                value: ""
            },
            closeOnBackdropClick: {
                type: "boolean",
                value: false
            },
            closeOnEscape: {
                type: "boolean",
                value: true
            },
            closeOnOutsideClick: {
                type: "boolean",
                value: true
            },
            closeOnMouseLeave: {
                type: "boolean",
                value: false
            },
            data: {
                type: "object",
                value: {}
            },
            hasBackdrop: {
                type: "boolean",
                value: false
            },
            height: {
                type: "string",
                value: "auto"
            },
            maxHeight: {
                type: "string",
                value: "100%"
            },
            maxWidth: {
                type: "string",
                value: "100%"
            },
            minHeight: {
                type: "string",
                value: "auto"
            },
            minWidth: {
                type: "string",
                value: "auto"
            },
            offset: {
                type: "dropdown",
                value: this.#offsetList,
                defaultValue: this.#offsetList[0]
            },
            popupClass: {
                type: "string",
                value: ""
            },
            popupConnectionPoint: {
                type: "dropdown",
                value: [
                    "topleft",
                    "topcenter",
                    "topright",
                    "centerleft",
                    "center",
                    "centerright",
                    "bottomleft",
                    "bottomcenter",
                    "bottomright"
                ],
                defaultValue: "topcenter"
            },
            popupWrapperClass: {
                type: "string",
                value: ""
            },
            positionStrategy: {
                type: "dropdown",
                value: ["global", "connected"],
                defaultValue: "connected"
            },
            positions: {
                type: "object",
                value: []
            },
            preventClose: {
                type: "function",
                value: (event: any) => {
                    return false;
                }
            },
            providers: {
                type: "object",
                value: []
            },
            trigger: {
                type: "dropdown",
                value: ["click", "contextmenu", "pointerover"],
                defaultValue: "click"
            },
            width: {
                type: "string",
                value: "auto"
            },
            withPush: {
                type: "boolean",
                value: false
            },
            withScrollTracking: {
                type: "boolean",
                value: true
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("PopupComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly PopupWrapperComponent = PopupWrapperComponent;
}

@Component({
    imports: [ButtonDirective, PopupComponent],
    template: `
        <button monaButton #popupAnchor>Popup</button>
        <mona-popup
            [anchor]="popupAnchor"
            [anchorConnectionPoint]="anchorConnectionPoint()"
            [animation]="animation()"
            [backdropClass]="backdropClass()"
            [closeOnBackdropClick]="closeOnBackdropClick()"
            [closeOnEscape]="closeOnEscape()"
            [closeOnMouseLeave]="closeOnMouseLeave()"
            [closeOnOutsideClick]="closeOnOutsideClick()"
            [data]="data()"
            [hasBackdrop]="hasBackdrop()"
            [height]="height()"
            [maxHeight]="maxHeight()"
            [maxWidth]="maxWidth()"
            [minHeight]="minHeight()"
            [minWidth]="minWidth()"
            [offset]="offset()"
            [popupClass]="popupClass()"
            [popupConnectionPoint]="popupConnectionPoint()"
            [popupWrapperClass]="popupWrapperClass()"
            [positionStrategy]="positionStrategy()"
            [positions]="positions()"
            [preventClose]="preventClose()"
            [providers]="providers()"
            [trigger]="trigger()"
            [width]="width()"
            [withPush]="withPush()"
            [withScrollTracking]="withScrollTracking()">
            <div
                class="flex flex-col items-center justify-center w-full h-full bg-background border border-border shadow-md">
                <h3 class="text-lg font-semibold">Popup Content</h3>
                <p class="mt-2 text-sm text-gray-600">This is a popup example.</p>
            </div>
        </mona-popup>
    `
})
export class PopupWrapperComponent implements ComponentInputsAsSignal<PopupComponent> {
    readonly #document = inject(DOCUMENT);
    public readonly anchor = input<ReturnType<PopupComponent["anchor"]>>(this.#document.body);
    public readonly anchorConnectionPoint = input<ReturnType<PopupComponent["anchorConnectionPoint"]>>("bottomcenter");
    public readonly animation = input<ReturnType<PopupComponent["animation"]>>(true);
    public readonly backdropClass = input<ReturnType<PopupComponent["backdropClass"]>>("");
    public readonly closeOnBackdropClick = input<ReturnType<PopupComponent["closeOnBackdropClick"]>>(false);
    public readonly closeOnEscape = input<ReturnType<PopupComponent["closeOnEscape"]>>(true);
    public readonly closeOnMouseLeave = input<ReturnType<PopupComponent["closeOnMouseLeave"]>>(false);
    public readonly closeOnOutsideClick = input<ReturnType<PopupComponent["closeOnOutsideClick"]>>(true);
    public readonly data = input<ReturnType<PopupComponent["data"]>>({});
    public readonly hasBackdrop = input<ReturnType<PopupComponent["hasBackdrop"]>>(false);
    public readonly height = input<ReturnType<PopupComponent["height"]>>("auto");
    public readonly maxHeight = input<ReturnType<PopupComponent["maxHeight"]>>("100%");
    public readonly maxWidth = input<ReturnType<PopupComponent["maxWidth"]>>("100%");
    public readonly minHeight = input<ReturnType<PopupComponent["minHeight"]>>("auto");
    public readonly minWidth = input<ReturnType<PopupComponent["minWidth"]>>("auto");
    public readonly offset = input<ReturnType<PopupComponent["offset"]>>({ horizontal: 0, vertical: 0 });
    public readonly popupClass = input<ReturnType<PopupComponent["popupClass"]>>("");
    public readonly popupConnectionPoint = input<ReturnType<PopupComponent["popupConnectionPoint"]>>("topcenter");
    public readonly popupWrapperClass = input<ReturnType<PopupComponent["popupWrapperClass"]>>("");
    public readonly positionStrategy = input<ReturnType<PopupComponent["positionStrategy"]>>("connected");
    public readonly positions = input<ReturnType<PopupComponent["positions"]>>([]);
    public readonly preventClose = input<ReturnType<PopupComponent["preventClose"]>>((event: any) => {
        return false;
    });
    public readonly providers = input<ReturnType<PopupComponent["providers"]>>([]);
    public readonly trigger = input<ReturnType<PopupComponent["trigger"]>>("click");
    public readonly width = input<ReturnType<PopupComponent["width"]>>("auto");
    public readonly withPush = input<ReturnType<PopupComponent["withPush"]>>(false);
    public readonly withScrollTracking = input<ReturnType<PopupComponent["withScrollTracking"]>>(true);
}
