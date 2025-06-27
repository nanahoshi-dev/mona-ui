import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { Heart, LucideAngularModule, Settings } from "lucide-angular";
import {
    DropDownButtonComponent,
    MenuItemComponent,
    MenuItemGroupComponent,
    MenuItemIconTemplateDirective,
    MenuItemTextTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createTemplateInjector, TemplateConfigHandler } from "../../utils/templateInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-drop-down-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./drop-down-button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropDownButtonDemoComponent extends AbstractDemoComponent<DropDownButtonComponent> {
    readonly #injector = createTemplateInjector({
        iconTemplate: {
            active: false,
            code: `
                <mona-drop-down-button>
                    <mona-menu-item text="Settings">
                        <ng-template monaMenuItemIconTemplate let-item>
                            <lucide-angular [name]="settingsIcon" size="14"></lucide-angular>
                        </ng-template>
                    </mona-menu-item>
                </mona-drop-down-button>
            `,
            description: `This template is used to customize the icon of menu items.`,
            name: "Icon Template"
        },
        textTemplate: {
            active: false,
            code: `
                <mona-drop-down-button>
                    <mona-menu-item text="Help">
                        <ng-template monaMenuItemTextTemplate let-item>
                            <span class="text-green-500">{{ item.text }}</span>
                        </ng-template>
                    </mona-menu-item>
                </mona-drop-down-button>
            `,
            description: `This template is used to customize the text of menu items.`,
            name: "Text Template"
        }
    });
    readonly #templateHandler = this.#injector.get(TemplateConfigHandler);
    protected readonly config = signal<ComponentConfig<DropDownButtonComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: [
                    "default",
                    "primary",
                    "success",
                    "error",
                    "warning",
                    "info",
                    "link",
                    "secondary",
                    "ghost",
                    "outline"
                ],
                defaultValue: "default"
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            }
        },
        outputs: {},
        templateHandler: this.#templateHandler
    });
    protected readonly metadata = this.getMetadata("SplitButtonComponent");
    protected readonly templateInjector = this.#injector;
    protected readonly DropDownButtonWrapperComponent = DropDownButtonWrapperComponent;
}

@Component({
    imports: [
        DropDownButtonComponent,
        MenuItemComponent,
        MenuItemGroupComponent,
        MenuItemIconTemplateDirective,
        LucideAngularModule,
        MenuItemTextTemplateDirective
    ],
    template: `
        @let templateData = templates();
        <mona-drop-down-button [disabled]="disabled()" [look]="look()" [rounded]="rounded()" [size]="size()">
            Drop Down
            <mona-menu-item-group title="Names">
                <mona-menu-item text="Mona"></mona-menu-item>
                <mona-menu-item text="Lisa"></mona-menu-item>
                <mona-menu-item text="Rosaria">
                    <mona-menu-item text="Setsuna"></mona-menu-item>
                    <mona-menu-item text="Fleur">
                        @if (templateData && templateData["iconTemplate"].active) {
                            <ng-template monaMenuItemIconTemplate let-item>
                                <lucide-angular [name]="heartIcon" size="14" class="text-red-500"></lucide-angular>
                            </ng-template>
                        }
                    </mona-menu-item>
                    <mona-menu-item text="Ayana"></mona-menu-item>
                </mona-menu-item>
            </mona-menu-item-group>
            <mona-menu-item [divider]="true"></mona-menu-item>
            <mona-menu-item text="Settings">
                @if (templateData && templateData["iconTemplate"].active) {
                    <ng-template monaMenuItemIconTemplate let-item>
                        <lucide-angular [name]="settingsIcon" size="14"></lucide-angular>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item text="Help">
                @if (templateData && templateData["textTemplate"].active) {
                    <ng-template monaMenuItemTextTemplate let-item>
                        <span class="text-green-500">{{ item.text }}</span>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item text="About"></mona-menu-item>
            <mona-menu-item [disabled]="true" text="Disabled"></mona-menu-item>
        </mona-drop-down-button>
    `
})
export class DropDownButtonWrapperComponent implements ComponentInputsAsSignal<DropDownButtonComponent> {
    protected readonly heartIcon = Heart;
    protected readonly settingsIcon = Settings;
    public readonly disabled = input(false);
    public readonly look = input<ReturnType<DropDownButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<DropDownButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<DropDownButtonComponent["size"]>>("medium");
    public readonly templates = inject(TemplateConfigHandler).data;
}
