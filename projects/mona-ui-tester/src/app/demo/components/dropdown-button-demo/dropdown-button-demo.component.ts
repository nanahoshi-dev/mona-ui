import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { Heart, LucideAngularModule, Menu, Settings } from "lucide-angular";
import {
    DropdownButtonComponent,
    DropdownButtonGroupComponent,
    DropdownButtonMenuGroupTemplateDirective,
    DropdownButtonMenuItemIconTemplateDirective,
    DropdownButtonItemComponent,
    DropdownButtonSeparatorComponent,
    DropdownButtonMenuItemShortcutTemplateDirective,
    DropdownButtonMenuItemTextTemplateDirective,
    DropdownButtonCheckboxItemComponent,
    DropdownButtonTextTemplateDirective,
    DropdownButtonRadioGroupComponent,
    DropdownButtonRadioItemComponent
} from "mona-ui";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-dropdown-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./dropdown-button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownButtonDemoComponent extends AbstractDemoComponent<DropdownButtonComponent> {
    readonly #injector = createFeatureInjector({
        groupTemplate: {
            active: false,
            code: `
                <mona-dropdown-button-group title="Project">
                    <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                        <span class="font-bold text-indigo-700">{{ group }}</span>
                    </ng-template>
                </mona-dropdown-button-group>
            `,
            description: `
                This template is used to customize the group header of menu items.
                If it is defined, it will override the top-level group template.
            `,
            name: "Group Template"
        },
        menuItemIconTemplate: {
            active: false,
            code: `
                <mona-dropdown-button-item label="Settings">
                    <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                        <lucide-angular [name]="settingsIcon" size="14"></lucide-angular>
                    </ng-template>
                </mona-dropdown-button-item>
            `,
            description: `
                This template is used to customize the icon of the menu item.
                If it is defined, it will override the top-level icon template.
            `,
            name: "Menu Item Icon Template"
        },
        menuItemShortcutTemplate: {
            active: false,
            code: `
                <mona-dropdown-button-item label="About">
                    <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                        <span class="text-gray-500">Ctrl + Shift + O</span>
                    </ng-template>
                </mona-dropdown-button-item>
            `,
            description: `
                This template is used to customize the shortcut of the menu item.
                If it is defined, it will override the top-level shortcut template.
            `,
            name: "Menu Item Shortcut Template"
        },
        menuItemTextTemplate: {
            active: false,
            code: `
                <mona-dropdown-button-item label="Help">
                    <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                        <span class="text-green-500">{{ item.label }}</span>
                    </ng-template>
                </mona-dropdown-button-item>
            `,
            description: `
                This template is used to customize the text of the menu item.
                If it is defined, it will override the top-level text template.
            `,
            name: "Menu Item Text Template"
        },
        textTemplate: {
            code: `
                <mona-dropdown-button>
                    <ng-template monaDropdownButtonTextTemplate let-text>
                        <span class="text-pink-800 font-bold">{{ text }}</span>
                    </ng-template>
                </mona-dropdown-button>
            `,
            description: `This template is used to customize the text of the dropdown button.`,
            name: "Text Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: `
                <mona-dropdown-button>
                    <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                        <span [style.color]="'' | randomColor">{{ group }}</span>
                    </ng-template>
                </mona-dropdown-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all groups in the dropdown button menu.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelIconTemplate: {
            code: `
                <mona-dropdown-button>
                     <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                        <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                    </ng-template>
                </mona-dropdown-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all icons in the dropdown button menu.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: `
                <mona-dropdown-button>
                    <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                        @if (item.label === "Interns") {
                            <span class="text-xs text-gray-500">Ctrl + F7</span>
                        } @else if (item.label === "Exit") {
                            <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
                        }
                    </ng-template>
                </mona-dropdown-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all shortcuts in the dropdown button menu.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: `
                <mona-dropdown-button>
                    <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                        @if (item.label === "Help") {
                            <span class="text-rose-700 underline">{{ item.label }}</span>
                        } @else {
                            <span [style.color]="'' | randomColor">{{ item.label }}</span>
                        }
                    </ng-template>
                </mona-dropdown-button>
            `,
            description: `This template is defined at the top level and can be used to customize the appearance of all text in the dropdown button menu.`,
            name: "Top Level Text Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<DropdownButtonComponent>>({
        code: `
            <mona-dropdown-button
                [disabled]="disabled()"
                [iconOnly]="iconOnly()"
                [look]="look()"
                [rounded]="rounded()"
                [size]="size()"
                [text]="text()">
                <mona-dropdown-button-group title="Project">
                    <mona-dropdown-button-item label="Issues"></mona-dropdown-button-item>
                    <mona-dropdown-button-item label="Roadmap" [disabled]="true"></mona-dropdown-button-item>
                    <mona-dropdown-button-item label="Members">
                        <mona-dropdown-button-item label="Managers"></mona-dropdown-button-item>
                        <mona-dropdown-button-item label="Developers"></mona-dropdown-button-item>
                        <mona-dropdown-button-item label="Interns"></mona-dropdown-button-item>
                    </mona-dropdown-button-item>
                    <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                        <span class="font-bold text-indigo-700">{{ group }}</span>
                    </ng-template>
                </mona-dropdown-button-group>
                <mona-dropdown-button-separator></mona-dropdown-button-separator>
                <mona-dropdown-button-checkbox-item label="Enable Notifications"></mona-dropdown-button-checkbox-item>
                <mona-dropdown-button-checkbox-item label="Dark Mode" [checked]="true"></mona-dropdown-button-checkbox-item>
                <mona-dropdown-button-separator></mona-dropdown-button-separator>
                <mona-dropdown-button-radio-group title="Priority" value="medium">
                    <mona-dropdown-button-radio-item label="Low" value="low"></mona-dropdown-button-radio-item>
                    <mona-dropdown-button-radio-item label="Medium" value="medium"></mona-dropdown-button-radio-item>
                    <mona-dropdown-button-radio-item label="High" value="high"></mona-dropdown-button-radio-item>
                </mona-dropdown-button-radio-group>
                <mona-dropdown-button-separator></mona-dropdown-button-separator>
                <mona-dropdown-button-item label="Settings">
                    <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                        <lucide-angular [name]="settingsIcon" size="14"></lucide-angular>
                    </ng-template>
                </mona-dropdown-button-item>
                <mona-dropdown-button-item label="Help">
                    <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                        <span class="text-green-500">{{ item.label }}</span>
                    </ng-template>
                </mona-dropdown-button-item>
                <mona-dropdown-button-item label="About">
                    <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                        <span class="text-gray-500">Ctrl + Shift + O</span>
                    </ng-template>
                </mona-dropdown-button-item>

                <ng-template monaDropdownButtonTextTemplate let-text>
                    <span class="text-pink-800 font-bold">{{ text }}</span>
                </ng-template>
                <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                    <span [style.color]="'' | randomColor">{{ group }}</span>
                </ng-template>
                <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                    <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                </ng-template>
                <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                    @if (item.label === "Interns") {
                        <span class="text-xs text-gray-500">Ctrl + F7</span>
                    } @else if (item.label === "Exit") {
                        <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
                    }
                </ng-template>
                <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                    @if (item.label === "Help") {
                        <span class="text-rose-700 underline">{{ item.label }}</span>
                    } @else {
                        <span [style.color]="'' | randomColor">{{ item.label }}</span>
                    }
                </ng-template>
            </mona-dropdown-button>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            iconOnly: {
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
            },
            text: {
                type: "string",
                value: "Dropdown Button"
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DropdownButtonComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "DropdownButtonCheckboxItemComponent",
        "DropdownButtonItemComponent",
        "DropdownButtonGroupComponent",
        "DropdownButtonRadioGroupComponent",
        "DropdownButtonRadioItemComponent",
        "DropdownButtonSeparatorComponent"
    ]);
    protected readonly DropdownButtonWrapperComponent = DropdownButtonWrapperComponent;
}

@Component({
    imports: [
        DropdownButtonComponent,
        DropdownButtonGroupComponent,
        DropdownButtonCheckboxItemComponent,
        DropdownButtonItemComponent,
        DropdownButtonRadioGroupComponent,
        DropdownButtonRadioItemComponent,
        DropdownButtonSeparatorComponent,
        DropdownButtonMenuGroupTemplateDirective,
        DropdownButtonMenuItemIconTemplateDirective,
        DropdownButtonMenuItemShortcutTemplateDirective,
        DropdownButtonMenuItemTextTemplateDirective,
        DropdownButtonTextTemplateDirective,
        LucideAngularModule,
        RandomColorPipe
    ],
    template: `
        @let featureData = features();
        <mona-dropdown-button
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [text]="!iconOnly() ? text() : ''">
            <mona-dropdown-button-group title="Project">
                <mona-dropdown-button-item label="Issues"></mona-dropdown-button-item>
                <mona-dropdown-button-item label="Roadmap" [disabled]="true"></mona-dropdown-button-item>
                <mona-dropdown-button-item label="Members">
                    <mona-dropdown-button-item label="Managers"></mona-dropdown-button-item>
                    <mona-dropdown-button-item label="Developers"></mona-dropdown-button-item>
                    <mona-dropdown-button-item label="Interns"></mona-dropdown-button-item>
                </mona-dropdown-button-item>
                @if (featureData["groupTemplate"].active) {
                    <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                        <span class="font-bold text-indigo-700">{{ group }}</span>
                    </ng-template>
                }
            </mona-dropdown-button-group>
            <mona-dropdown-button-separator></mona-dropdown-button-separator>
            <mona-dropdown-button-checkbox-item label="Enable Notifications"></mona-dropdown-button-checkbox-item>
            <mona-dropdown-button-checkbox-item label="Dark Mode" [checked]="true"></mona-dropdown-button-checkbox-item>
            <mona-dropdown-button-separator></mona-dropdown-button-separator>
            <mona-dropdown-button-radio-group title="Priority" value="medium">
                <mona-dropdown-button-radio-item label="Low" value="low"></mona-dropdown-button-radio-item>
                <mona-dropdown-button-radio-item label="Medium" value="medium"></mona-dropdown-button-radio-item>
                <mona-dropdown-button-radio-item label="High" value="high"></mona-dropdown-button-radio-item>
            </mona-dropdown-button-radio-group>
            <mona-dropdown-button-separator></mona-dropdown-button-separator>
            <mona-dropdown-button-item label="Settings">
                @if (featureData["menuItemIconTemplate"].active) {
                    <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                        <lucide-angular [name]="settingsIcon" size="14"></lucide-angular>
                    </ng-template>
                }
            </mona-dropdown-button-item>
            <mona-dropdown-button-item label="Help">
                @if (featureData["menuItemTextTemplate"].active) {
                    <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                        <span class="text-green-500">{{ item.label }}</span>
                    </ng-template>
                }
            </mona-dropdown-button-item>
            <mona-dropdown-button-item label="About">
                @if (featureData["menuItemShortcutTemplate"].active) {
                    <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                        <span class="text-gray-500">Ctrl + Shift + O</span>
                    </ng-template>
                }
            </mona-dropdown-button-item>

            @if (featureData["textTemplate"].active) {
                <ng-template monaDropdownButtonTextTemplate let-text>
                    @if (iconOnly()) {
                        <lucide-angular [name]="menuIcon" size="14"></lucide-angular>
                    } @else {
                        <span class="text-pink-800 font-bold">{{ text }}</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaDropdownButtonMenuGroupTemplate let-group>
                    <span [style.color]="'' | randomColor">{{ group }}</span>
                </ng-template>
            }

            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaDropdownButtonMenuItemIconTemplate let-item>
                    <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                </ng-template>
            }

            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
                    @if (item.label === "Interns") {
                        <span class="text-xs text-gray-500">Ctrl + F7</span>
                    } @else if (item.label === "Exit") {
                        <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
                    @if (item.label === "Help") {
                        <span class="text-rose-700 underline">{{ item.label }}</span>
                    } @else {
                        <span [style.color]="'' | randomColor">{{ item.label }}</span>
                    }
                </ng-template>
            }
        </mona-dropdown-button>
    `
})
export class DropdownButtonWrapperComponent implements ComponentInputsAsSignal<DropdownButtonComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly heartIcon = Heart;
    protected readonly menuIcon = Menu;
    protected readonly settingsIcon = Settings;
    public readonly disabled = input(false);
    public readonly iconOnly = input(false);
    public readonly look = input<ReturnType<DropdownButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<DropdownButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<DropdownButtonComponent["size"]>>("medium");
    public readonly text = input("Dropdown Button");
}
