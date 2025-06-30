import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideAngularModule, Copy } from "lucide-angular";
import {
    MenuItemComponent,
    MenuItemGroupComponent,
    MenuItemIconTemplateDirective,
    MenuItemTextTemplateDirective,
    SplitButtonComponent,
    SplitButtonTextTemplateDirective
} from "mona-ui";
import { MenuItemClickEvent } from "mona-ui/menus/models/ContextMenuInjectorData";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-split-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./split-button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitButtonDemoComponent extends AbstractDemoComponent<SplitButtonComponent> {
    readonly #injector = createFeatureInjector({
        textTemplate: {
            active: false,
            code: `
                <mona-split-button>
                    <mona-menu-item text="Option A"></mona-menu-item>
                    <mona-menu-item text="Option B"></mona-menu-item>
                    <mona-menu-item text="Option C"></mona-menu-item>
                    <ng-template monaSplitButtonTextTemplate let-text>
                        <span class="text-blue-500">{{ text }}</span>
                    </ng-template>
                </mona-split-button>
            `,
            description: `This template is used to customize the text of the split button.`,
            name: "Text Template"
        },
        menuItemIconTemplate: {
            active: false,
            code: `
                <mona-split-button>
                    <mona-menu-item text="Settings">
                        <ng-template monaMenuItemIconTemplate let-item>
                            <span class="icon-settings"></span>
                        </ng-template>
                    </mona-menu-item>
                </mona-split-button>
            `,
            description: `This template is used to customize the icon of menu items.`,
            name: "Menu Item Icon Template"
        },
        menuItemTextTemplate: {
            active: false,
            code: `
                <mona-split-button>
                        <mona-menu-item text="Help">
                            <ng-template monaMenuItemTextTemplate let-item>
                                <span class="text-green-500">{{ item.text }}</span>
                            </ng-template>
                        </mona-menu-item>
                </mona-split-button>
            `,
            description: `This template is used to customize the text of menu items.`,
            name: "Menu Item Text Template"
        }
    });
    protected readonly SplitButtonWrapperComponent = SplitButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<SplitButtonComponent>>({
        code: `
            <mona-split-button
                [disabled]="disabled()"
                [look]="look()"
                [rounded]="rounded()"
                [size]="size()"
                [text]="text()">
                <mona-menu-item text="Option A"></mona-menu-item>
                <mona-menu-item text="Option B"></mona-menu-item>
                <mona-menu-item text="Option C">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="Copy" [size]="14"></lucide-angular>
                    </ng-template>
                </mona-menu-item>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item-group title="Group 1">
                    <mona-menu-item text="Option D"></mona-menu-item>
                    <mona-menu-item text="Option E">
                        <mona-menu-item text="Option E1"></mona-menu-item>
                        <mona-menu-item text="Option E2"></mona-menu-item>
                        <mona-menu-item text="Option E3"></mona-menu-item>
                    </mona-menu-item>
                    <mona-menu-item text="Option F"></mona-menu-item>
                </mona-menu-item-group>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item-group title="Group 2">
                    <mona-menu-item text="Option G"></mona-menu-item>
                    <mona-menu-item text="Option H" [data]="{ key: 'OptionKey' }">
                        <ng-template monaMenuItemTextTemplate let-item>
                            <span class="text-red-500">{{ item.data.key }}</span>
                        </ng-template>
                    </mona-menu-item>
                    <mona-menu-item text="Option I"></mona-menu-item>
                </mona-menu-item-group>
                <ng-template monaSplitButtonTextTemplate>
                    <span class="text-blue-500">{{ text() }}</span>
                </ng-template>
            </mona-split-button>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: ["default", "error", "outline", "secondary", "success", "warning", "info", "ghost", "primary"],
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
            },
            text: {
                type: "string",
                value: "Split Button"
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SplitButtonComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "MenuItemComponent",
        "MenuItemGroupComponent"
    ]);
}

@Component({
    imports: [
        SplitButtonComponent,
        MenuItemComponent,
        MenuItemGroupComponent,
        SplitButtonTextTemplateDirective,
        MenuItemTextTemplateDirective,
        MenuItemIconTemplateDirective,
        LucideAngularModule
    ],
    template: `
        @let featureData = features();
        <mona-split-button
            [disabled]="disabled()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [text]="text()">
            <mona-menu-item text="Option A"></mona-menu-item>
            <mona-menu-item text="Option B"></mona-menu-item>
            <mona-menu-item text="Option C">
                @if (featureData && featureData["menuItemIconTemplate"].active) {
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="copyIcon" [size]="14"></lucide-angular>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item [divider]="true"></mona-menu-item>
            <mona-menu-item-group title="Group 1">
                <mona-menu-item text="Option D"></mona-menu-item>
                <mona-menu-item text="Option E">
                    <mona-menu-item text="Option E1"></mona-menu-item>
                    <mona-menu-item text="Option E2"></mona-menu-item>
                    <mona-menu-item text="Option E3"></mona-menu-item>
                </mona-menu-item>
                <mona-menu-item text="Option F"></mona-menu-item>
            </mona-menu-item-group>
            <mona-menu-item [divider]="true"></mona-menu-item>
            <mona-menu-item-group title="Group 2">
                <mona-menu-item text="Option G"></mona-menu-item>
                <mona-menu-item text="Option H" (menuClick)="onMenuItemClick($event)" [data]="{ key: 'OptionKey' }">
                    @if (featureData && featureData["menuItemTextTemplate"].active) {
                        <ng-template monaMenuItemTextTemplate let-item>
                            <span class="text-red-500">{{ item.data.key }}</span>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item text="Option I"></mona-menu-item>
            </mona-menu-item-group>
            @if (featureData && featureData["textTemplate"].active) {
                <ng-template monaSplitButtonTextTemplate>
                    <span class="text-blue-500">{{ text() }}</span>
                </ng-template>
            }
        </mona-split-button>
    `
})
export class SplitButtonWrapperComponent implements ComponentInputsAsSignal<SplitButtonComponent> {
    protected readonly copyIcon = Copy;
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input(false);
    public readonly look = input<ReturnType<SplitButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<SplitButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<SplitButtonComponent["size"]>>("medium");
    public readonly text = input("Split Button");

    public onMenuItemClick(event: MenuItemClickEvent<any, any>): void {
        console.log("Menu item clicked:", event);
    }
}
