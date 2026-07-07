import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideHeart, LucideSettings, LucideUser, LucideUsers } from "@lucide/angular";
import {
    MenuItemClickEvent,
    SplitButtonCheckboxItemComponent,
    SplitButtonComponent,
    SplitButtonGroupComponent,
    SplitButtonItemComponent,
    SplitButtonMenuButtonTemplateDirective,
    SplitButtonMenuGroupTemplateDirective,
    SplitButtonMenuItemIconTemplateDirective,
    SplitButtonMenuItemShortcutTemplateDirective,
    SplitButtonMenuItemTextTemplateDirective,
    SplitButtonRadioGroupComponent,
    SplitButtonRadioItemComponent,
    SplitButtonSeparatorComponent,
    SplitButtonTextTemplateDirective
} from "mona-ui/split-button";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
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
                     <ng-template monaSplitButtonTextTemplate>
                        <span class="text-pink-600">Mona</span>
                    </ng-template>
                </mona-split-button>
            `,
            description: `This template is used to customize the text of the split button.`,
            name: "Text Template"
        },
        menuButtonTemplate: {
            active: false,
            code: `

            `,
            description: `This template is used to customize the button that opens the menu of the split button.`,
            name: "Menu Button Template"
        },
        menuItemIconTemplate: {
            active: false,
            code: `

            `,
            description: `This template is used to customize the icon of menu items.`,
            name: "Menu Item Icon Template"
        },
        menuItemShortcutTemplate: {
            active: false,
            code: `
                <mona-split-button>
                    <mona-split-button-item label="Invite Members">
                        <ng-template monaSplitButtonMenuItemShortcutTemplate let-item>
                            <span class="text-xs text-gray-500">Ctrl + Shift + I</span>
                        </ng-template>
                    </mona-split-button-item>
                </mona-split-button>
            `,
            description: `This template is used to customize the shortcut of menu items.`,
            name: "Menu Item Shortcut Template"
        },
        menuItemTextTemplate: {
            active: false,
            code: `
                <mona-split-button>
                    <mona-split-button-item label="Sign Out">
                        <ng-template monaSplitButtonMenuItemTextTemplate let-item>
                            <span class="text-red-500">{{ item.label }}</span>
                        </ng-template>
                    </mona-split-button-item>
                </mona-split-button>
            `,
            description: `This template is used to customize the text of menu items.`,
            name: "Menu Item Text Template"
        },
        topLevelGroupTemplate: {
            code: `
                <mona-split-button>
                    <ng-template monaSplitButtonMenuGroupTemplate let-group>
                        <span [style.color]="'' | randomColor">{{ group }}</span>
                    </ng-template>
                </mona-split-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all groups in the split button menu.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelIconTemplate: {
            code: `

            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all icons in the split button menu.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: `

            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all shortcuts in the split button menu.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: `
                <mona-split-button-button>
                    <ng-template monaSplitButtonMenuItemTextTemplate let-item>
                        @if (item.label === "Help") {
                            <span class="text-rose-700 underline">{{ item.label }}</span>
                        } @else {
                            <span [style.color]="'' | randomColor">{{ item.label }}</span>
                        }
                    </ng-template>
                </mona-split-button-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all text in the split button menu.`,
            name: "Top Level Text Template",
            active: false
        }
    });
    protected readonly SplitButtonWrapperComponent = SplitButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<SplitButtonComponent>>({
        code: `

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
                value: "Mona"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SplitButtonComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "SplitButtonCheckboxItemComponent",
        "SplitButtonGroupComponent",
        "SplitButtonItemComponent",
        "SplitButtonRadioGroupComponent",
        "SplitButtonRadioItemComponent",
        "SplitButtonSeparatorComponent"
    ]);
}

@Component({
    imports: [
        SplitButtonComponent,
        SplitButtonTextTemplateDirective,
        SplitButtonCheckboxItemComponent,
        SplitButtonGroupComponent,
        SplitButtonItemComponent,
        SplitButtonRadioGroupComponent,
        SplitButtonRadioItemComponent,
        SplitButtonSeparatorComponent,
        SplitButtonMenuGroupTemplateDirective,
        SplitButtonMenuItemIconTemplateDirective,
        SplitButtonMenuItemShortcutTemplateDirective,
        SplitButtonMenuItemTextTemplateDirective,
        SplitButtonMenuButtonTemplateDirective,
        RandomColorPipe,
        LucideUser,
        LucideSettings,
        LucideUsers,
        LucideHeart
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-split-button
            (buttonClick)="onButtonClick()"
            [disabled]="disabled()"
            [look]="look()"
            (menuItemClick)="onMenuItemClick($event)"
            [rounded]="rounded()"
            [size]="size()"
            [text]="text()">
            <mona-split-button-group [title]="'My Account'">
                <mona-split-button-item label="Profile">
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaSplitButtonMenuItemIconTemplate let-item>
                            <svg lucideUser [size]="14"></svg>
                        </ng-template>
                    }
                </mona-split-button-item>
                <mona-split-button-item label="Billing"></mona-split-button-item>
                <mona-split-button-item label="Settings">
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaSplitButtonMenuItemIconTemplate let-item>
                            <svg lucideSettings [size]="14"></svg>
                        </ng-template>
                    }
                </mona-split-button-item>
            </mona-split-button-group>
            <mona-split-button-separator></mona-split-button-separator>
            <mona-split-button-group [title]="'Team'">
                <mona-split-button-item label="Team Settings"></mona-split-button-item>
                <mona-split-button-item label="Manage Team">
                    <mona-split-button-item label="Set Permissions"></mona-split-button-item>
                    <mona-split-button-item label="Remove Members"></mona-split-button-item>
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaSplitButtonMenuItemIconTemplate let-item>
                            <svg lucideUsers [size]="14"></svg>
                        </ng-template>
                    }
                </mona-split-button-item>
                <mona-split-button-item label="Invite Members">
                    @if (featureData["menuItemShortcutTemplate"].active) {
                        <ng-template monaSplitButtonMenuItemShortcutTemplate let-item>
                            <span class="text-xs text-gray-500">Ctrl + Shift + I</span>
                        </ng-template>
                    }
                </mona-split-button-item>
            </mona-split-button-group>
            <mona-split-button-separator></mona-split-button-separator>
            <mona-split-button-checkbox-item
                label="Enable Notifications"
                [checked]="true"></mona-split-button-checkbox-item>
            <mona-split-button-checkbox-item
                label="Make Profile Public"
                [checked]="false"></mona-split-button-checkbox-item>
            <mona-split-button-checkbox-item
                label="Allow Marketing Emails"
                [checked]="true"
                [disabled]="true"></mona-split-button-checkbox-item>
            <mona-split-button-separator></mona-split-button-separator>
            <mona-split-button-radio-group
                [title]="'Choose an option'"
                [value]="selectedOption()"
                (valueChange)="onSelectedOptionChange($event)">
                <mona-split-button-radio-item label="Option 1" value="o1"></mona-split-button-radio-item>
                <mona-split-button-radio-item label="Option 2" value="o2"></mona-split-button-radio-item>
                <mona-split-button-radio-item label="Option 3" value="o3"></mona-split-button-radio-item>
            </mona-split-button-radio-group>
            <mona-split-button-separator></mona-split-button-separator>
            <mona-split-button-item label="Help"></mona-split-button-item>
            <mona-split-button-item label="Sign Out">
                @if (featureData["menuItemTextTemplate"].active) {
                    <ng-template monaSplitButtonMenuItemTextTemplate let-item>
                        <span class="text-red-500">{{ item.label }}</span>
                    </ng-template>
                }
            </mona-split-button-item>

            @if (featureData["textTemplate"].active) {
                <ng-template monaSplitButtonTextTemplate>
                    <span class="text-pink-600">Mona</span>
                </ng-template>
            }

            @if (featureData["menuButtonTemplate"].active) {
                <ng-template monaSplitButtonMenuButtonTemplate let-item>
                    <svg lucideSettings [size]="10"></svg>
                </ng-template>
            }

            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaSplitButtonMenuGroupTemplate let-group>
                    <span [style.color]="'' | randomColor">{{ group }}</span>
                </ng-template>
            }

            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaSplitButtonMenuItemIconTemplate let-item>
                    <svg lucideHeart [size]="14" [color]="'' | randomColor"></svg>
                </ng-template>
            }

            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaSplitButtonMenuItemShortcutTemplate let-item>
                    @if (item.label === "Manage Team") {
                        <span class="text-xs text-gray-500">Ctrl + F7</span>
                    } @else if (item.label === "Sign Out") {
                        <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaSplitButtonMenuItemTextTemplate let-item>
                    @if (item.label === "Help") {
                        <span class="text-rose-700 underline">{{ item.label }}</span>
                    } @else {
                        <span [style.color]="'' | randomColor">{{ item.label }}</span>
                    }
                </ng-template>
            }
        </mona-split-button>
    `
})
export class SplitButtonWrapperComponent implements ComponentInputsAsSignal<SplitButtonComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly selectedOption = signal<string>("o1");
    public readonly disabled = input(false);
    public readonly look = input<ReturnType<SplitButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<SplitButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<SplitButtonComponent["size"]>>("medium");
    public readonly text = input("Mona");

    protected onButtonClick(): void {
        console.log("Main button clicked");
    }

    protected onMenuItemClick(event: MenuItemClickEvent): void {
        console.log("Menu item clicked:", event);
    }

    protected onSelectedOptionChange(value: string): void {
        this.selectedOption.set(value);
    }
}
