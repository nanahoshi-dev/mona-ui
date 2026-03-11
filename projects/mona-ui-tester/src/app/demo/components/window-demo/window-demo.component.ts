import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule, User } from "lucide-angular";
import {
    ButtonDirective,
    DropdownListComponent,
    PopupCloseEvent,
    SwitchComponent,
    TextBoxComponent,
    WindowActionTemplateDirective,
    WindowComponent,
    WindowContentTemplateDirective,
    WindowFooterTemplateDirective,
    WindowTitleTemplateDirective
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
        actionTemplate: {
            code: ``,
            active: false,
            name: "Action Template",
            description: "Use a custom template for the window actions."
        },
        footerTemplate: {
            code: ``,
            active: false,
            name: "Footer Template",
            description: "Use a custom template for the window footer."
        },
        titleTemplate: {
            code: ``,
            active: false,
            name: "Title Template",
            description: "Use a custom template for the window title."
        }
    });
    protected readonly config = signal<ComponentConfig<WindowComponent>>({
        inputs: {
            closable: {
                type: "boolean",
                value: true
            },
            closeOnEscape: {
                type: "boolean",
                value: true
            },
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
            look: {
                type: "dropdown",
                value: ["default", "primary"],
                defaultValue: "default"
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
            maximizable: {
                type: "boolean",
                value: true
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
            minimizable: {
                type: "boolean",
                value: true
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
    imports: [
        WindowComponent,
        ButtonDirective,
        DropdownListComponent,
        TextBoxComponent,
        WindowFooterTemplateDirective,
        WindowTitleTemplateDirective,
        LucideAngularModule,
        SwitchComponent,
        FormsModule,
        WindowContentTemplateDirective,
        WindowActionTemplateDirective
    ],
    template: `
        @let featureData = features();
        <button monaButton look="primary" (click)="windowVisible.set(true)">Open</button>
        @if (windowVisible()) {
            <mona-window
                [closable]="closable()"
                [closeOnEscape]="closeOnEscape()"
                [draggable]="draggable()"
                [focusedElement]="focusedElement()"
                [height]="height()"
                [left]="left()"
                [look]="look()"
                [maxHeight]="maxHeight()"
                [maxWidth]="maxWidth()"
                [maximizable]="maximizable()"
                [minHeight]="minHeight()"
                [minWidth]="minWidth()"
                [minimizable]="minimizable()"
                [modal]="modal()"
                [resizable]="resizable()"
                [rounded]="rounded()"
                [title]="title()"
                [top]="top()"
                [width]="width()"
                (close)="onWindowClose($event)"
                #windowComponent>
                <ng-template monaWindowContentTemplate>
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
                            @if (advancedMode()) {
                                <div class="flex items-center w-full">
                                    <div class="flex items-center w-1/4 text-sm font-semibold">Age</div>
                                    <div class="flex items-center w-3/4">
                                        <mona-drop-down-list
                                            [data]="['18-24', '25-34', '35-44', '45-54', '55-64', '65+']"
                                            class="w-32"></mona-drop-down-list>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </ng-template>
                @if (featureData["actionTemplate"].active) {
                    <ng-template monaWindowActionTemplate>
                        <mona-switch
                            size="small"
                            [ngModel]="advancedMode()"
                            (ngModelChange)="advancedMode.set($event)"></mona-switch>
                    </ng-template>
                }
                @if (featureData["footerTemplate"].active) {
                    <ng-template monaWindowFooterTemplate>
                        <div class="border-t border-border bg-secondary flex items-center justify-end p-2 gap-1">
                            <button monaButton size="small" look="primary">Save</button>
                            <button monaButton size="small" (click)="windowVisible.set(false)">Cancel</button>
                        </div>
                    </ng-template>
                }
                @if (featureData["titleTemplate"].active) {
                    <ng-template monaWindowTitleTemplate>
                        <div class="flex items-center gap-2">
                            <lucide-icon [name]="userIcon" [size]="16"></lucide-icon>
                            <span class="font-semibold">User Details</span>
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
    protected readonly advancedMode = signal(false);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly userIcon = User;
    protected readonly windowVisible = signal(false);
    public readonly closable = input<ReturnType<WindowComponent["closable"]>>(true);
    public readonly closeOnEscape = input<ReturnType<WindowComponent["closeOnEscape"]>>(true);
    public readonly draggable = input<ReturnType<WindowComponent["draggable"]>>(true);
    public readonly focusedElement = input<ReturnType<WindowComponent["focusedElement"]>>();
    public readonly height = model<ReturnType<WindowComponent["height"]>>();
    public readonly left = model<ReturnType<WindowComponent["left"]>>();
    public readonly look = input<ReturnType<WindowComponent["look"]>>("default");
    public readonly maxHeight = input<ReturnType<WindowComponent["maxHeight"]>>();
    public readonly maxWidth = input<ReturnType<WindowComponent["maxWidth"]>>();
    public readonly maximizable = input<ReturnType<WindowComponent["maximizable"]>>(true);
    public readonly minHeight = input<ReturnType<WindowComponent["minHeight"]>>();
    public readonly minWidth = input<ReturnType<WindowComponent["minWidth"]>>();
    public readonly minimizable = input<ReturnType<WindowComponent["minimizable"]>>(true);
    public readonly modal = input<ReturnType<WindowComponent["modal"]>>(true);
    public readonly resizable = input<ReturnType<WindowComponent["resizable"]>>();
    public readonly rounded = input<ReturnType<WindowComponent["rounded"]>>();
    public readonly title = model<ReturnType<WindowComponent["title"]>>();
    public readonly top = model<ReturnType<WindowComponent["top"]>>();
    public readonly width = model<ReturnType<WindowComponent["width"]>>();

    protected onWindowClose(event: PopupCloseEvent): void {
        // if (event.via === PopupCloseSource.Escape) {
        //     event.preventDefault();
        //     return;
        // }
        this.windowVisible.set(false);
    }
}
