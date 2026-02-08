import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import {
    ButtonDirective,
    DropdownListComponent,
    TextBoxComponent,
    WindowComponent,
    WindowFooterTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-window-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./window-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowDemoComponent extends AbstractDemoComponent<WindowComponent> {
    readonly #injector = createFeatureInjector({
        footerTemplate: {
            code: ``,
            active: false,
            name: "Footer Template",
            description: "Use a custom template for the window footer."
        }
    });
    protected readonly config = signal<ComponentConfig<WindowComponent>>({
        inputs: {
            draggable: {
                type: "boolean",
                value: true
            },
            focusedElement: {
                type: "string",
                value: ""
            },
            height: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            left: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            maxHeight: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            maxWidth: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            minHeight: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            minWidth: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            modal: {
                type: "boolean",
                value: true
            },
            resizable: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            title: {
                type: "string",
                value: "Window Title"
            },
            top: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            },
            width: {
                type: "number",
                value: undefined,
                nullable: true,
                min: 0
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("WindowComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly WindowWrapperComponent = WindowWrapperComponent;
}

@Component({
    imports: [WindowComponent, ButtonDirective, DropdownListComponent, TextBoxComponent, WindowFooterTemplateDirective],
    template: `
        @let featureData = features();
        <button monaButton look="primary" (click)="windowVisible.set(true)">Open</button>
        @if (windowVisible()) {
            <mona-window
                [draggable]="draggable()"
                [focusedElement]="focusedElement()"
                [height]="height()"
                [left]="left()"
                [maxHeight]="maxHeight()"
                [maxWidth]="maxWidth()"
                [minHeight]="minHeight()"
                [minWidth]="minWidth()"
                [modal]="modal()"
                [resizable]="resizable()"
                [rounded]="rounded()"
                [title]="title()"
                [top]="top()"
                [width]="width()"
                (close)="windowVisible.set(false)">
                <div class="w-lg h-full flex flex-col">
                    <div class="flex flex-col flex-1 items-start p-2 gap-2 w-full">
                        <div class="flex items-center w-full">
                            <div class="flex items-center w-1/4 text-sm font-semibold">Name</div>
                            <div class="flex items-center w-3/4">
                                <mona-text-box></mona-text-box>
                            </div>
                        </div>
                        <div class="flex items-center w-full">
                            <div class="flex items-center w-1/4 text-sm font-semibold">E-mail</div>
                            <div class="flex items-center w-3/4">
                                <mona-text-box type="email"></mona-text-box>
                            </div>
                        </div>
                        <div class="flex items-center w-full">
                            <div class="flex items-center w-1/4 text-sm font-semibold">Gender</div>
                            <div class="flex items-center w-3/4">
                                <mona-drop-down-list [data]="['Male', 'Female']" class="w-32"></mona-drop-down-list>
                            </div>
                        </div>
                    </div>
                </div>
                @if (featureData["footerTemplate"].active) {
                    <ng-template monaWindowFooterTemplate>
                        <div class="border-t border-border bg-secondary flex items-center justify-end p-2 gap-1">
                            <button monaButton size="small" look="primary">Save</button>
                            <button monaButton size="small" (click)="windowVisible.set(false)">Cancel</button>
                        </div>
                    </ng-template>
                }
            </mona-window>
        }
    `,
    host: {
        class: "flex-row! gap-0!"
    }
})
class WindowWrapperComponent implements ComponentInputsAsSignal<WindowComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly windowVisible = signal(false);
    public readonly draggable = input<ReturnType<WindowComponent["draggable"]>>(true);
    public readonly focusedElement = input<ReturnType<WindowComponent["focusedElement"]>>();
    public readonly height = model<ReturnType<WindowComponent["height"]>>();
    public readonly left = model<ReturnType<WindowComponent["left"]>>();
    public readonly maxHeight = input<ReturnType<WindowComponent["maxHeight"]>>();
    public readonly maxWidth = input<ReturnType<WindowComponent["maxWidth"]>>();
    public readonly minHeight = input<ReturnType<WindowComponent["minHeight"]>>();
    public readonly minWidth = input<ReturnType<WindowComponent["minWidth"]>>();
    public readonly modal = input<ReturnType<WindowComponent["modal"]>>(true);
    public readonly resizable = input<ReturnType<WindowComponent["resizable"]>>();
    public readonly rounded = input<ReturnType<WindowComponent["rounded"]>>();
    public readonly title = model<ReturnType<WindowComponent["title"]>>();
    public readonly top = model<ReturnType<WindowComponent["top"]>>();
    public readonly width = model<ReturnType<WindowComponent["width"]>>();
}
