import { NgComponentOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    model,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideUser } from "@lucide/angular";
import { SwitchComponent } from "mona-ui/switch";
import { TextBoxComponent } from "mona-ui/text-box";
import { ButtonDirective } from "mona-ui/button";
import { DropdownListComponent } from "mona-ui/drop-down-list";
import {
    PopupCloseEvent,
    WindowActionTemplateDirective,
    WindowComponent,
    WindowContentTemplateDirective,
    WindowFooterTemplateDirective,
    WindowRef,
    WindowService,
    WindowTitleTemplateDirective
} from "mona-ui/window";
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
        SwitchComponent,
        FormsModule,
        WindowContentTemplateDirective,
        WindowActionTemplateDirective,
        LucideUser
    ],
    template: `
        @let featureData = features();
        <button monaButton look="primary" (click)="windowVisible.set(true)">Open</button>
        <button monaButton (click)="openWindow()">Open via Window Service</button>
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
                    <div class="w-full h-full flex flex-col">
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
                                    <mona-dropdown-list [data]="['Male', 'Female']" class="w-32"></mona-dropdown-list>
                                </div>
                            </div>
                            @if (advancedMode()) {
                                <div class="flex items-center w-full">
                                    <div class="flex items-center w-1/4 text-sm font-semibold">Age</div>
                                    <div class="flex items-center w-3/4">
                                        <mona-dropdown-list
                                            [data]="['18-24', '25-34', '35-44', '45-54', '55-64', '65+']"
                                            class="w-32"></mona-dropdown-list>
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
                            <svg lucideUser [size]="16"></svg>
                            <span class="font-semibold">User Details</span>
                        </div>
                    </ng-template>
                }
            </mona-window>
        }

        <ng-template #dynamicWindowContentTemplate>
            <div class="flex flex-col gap-2 items-center p-4">
                <p>Dynamic content goes here</p>
                <button monaButton look="error" (click)="dynamicWindowRef?.close()">Close Window</button>
            </div>
        </ng-template>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {}
})
class WindowWrapperComponent implements ComponentInputsAsSignal<WindowComponent> {
    readonly #windowService = inject(WindowService);
    private readonly dynamicWindowContent = viewChild<TemplateRef<unknown>>("dynamicWindowContentTemplate");
    protected readonly advancedMode = signal(false);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly windowVisible = signal(false);
    protected dynamicWindowRef: WindowRef | null = null;
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

    protected openWindow(): void {
        this.dynamicWindowRef = this.#windowService.open({
            closable: this.closable(),
            closeOnEscape: this.closeOnEscape(),
            content: this.dynamicWindowContent(),
            focusedElement: this.focusedElement(),
            height: this.height(),
            left: this.left(),
            maxHeight: this.maxHeight(),
            maxWidth: this.maxWidth(),
            minHeight: this.minHeight(),
            minWidth: this.minWidth(),
            modal: this.modal(),
            rounded: this.rounded(),
            title: `${this.title()} - Dynamic`,
            top: this.top(),
            width: this.width()
        });
        // this.dynamicWindowRef.c.pipe(take(1)).subscribe(result => {
        //     console.log("Dialog result:", result);
        //     this.dynamicWindowRef?.close();
        // });
    }
}
