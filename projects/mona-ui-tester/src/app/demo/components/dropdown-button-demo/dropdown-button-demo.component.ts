import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { LucideHeart, LucideMenu, LucideSettings } from "@lucide/angular";
import {
    DropdownButtonCheckboxItemComponent,
    DropdownButtonComponent,
    DropdownButtonGroupComponent,
    DropdownButtonItemComponent,
    DropdownButtonRadioGroupComponent,
    DropdownButtonRadioItemComponent,
    DropdownButtonSeparatorComponent,
    DropdownButtonMenuGroupTemplateDirective,
    DropdownButtonMenuItemIconTemplateDirective,
    DropdownButtonMenuItemShortcutTemplateDirective,
    DropdownButtonMenuItemTextTemplateDirective,
    DropdownButtonTextTemplateDirective
} from "@nanahoshi/mona-ui/dropdown-button";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const GROUP_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuGroupTemplate let-group>
    <span class="font-bold text-indigo-700">{{ group }}</span>
</ng-template>`;

const MENU_ITEM_ICON_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemIconTemplate let-item>
    <svg lucideSettings size="14"></svg>
</ng-template>`;

const MENU_ITEM_SHORTCUT_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
    <span class="text-gray-500">Ctrl + Shift + O</span>
</ng-template>`;

const MENU_ITEM_TEXT_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemTextTemplate let-item>
    <span class="text-green-500">{{ item.label }}</span>
</ng-template>`;

const TEXT_TEMPLATE_CODE = `<ng-template monaDropdownButtonTextTemplate let-text>
    @if (iconOnly()) {
        <svg lucideMenu size="14"></svg>
    } @else {
        <span class="text-pink-800 font-bold">{{ text }}</span>
    }
</ng-template>`;

const TOP_LEVEL_GROUP_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuGroupTemplate let-group>
    <span [style.color]="'' | randomColor">{{ group }}</span>
</ng-template>`;

const TOP_LEVEL_ICON_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemIconTemplate let-item>
    <svg lucideHeart [size]="14" [color]="'' | randomColor"></svg>
</ng-template>`;

const TOP_LEVEL_SHORTCUT_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemShortcutTemplate let-item>
    @if (item.label === "Interns") {
        <span class="text-xs text-gray-500">Ctrl + F7</span>
    } @else if (item.label === "Exit") {
        <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
    }
</ng-template>`;

const TOP_LEVEL_TEXT_TEMPLATE_CODE = `<ng-template monaDropdownButtonMenuItemTextTemplate let-item>
    @if (item.label === "Help") {
        <span class="text-rose-700 underline">{{ item.label }}</span>
    } @else {
        <span [style.color]="'' | randomColor">{{ item.label }}</span>
    }
</ng-template>`;

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
            code: GROUP_TEMPLATE_CODE,
            description: `
                This template is used to customize the group header of menu items.
                If it is defined, it will override the top-level group template.
            `,
            name: "Group Template"
        },
        menuItemIconTemplate: {
            active: false,
            code: MENU_ITEM_ICON_TEMPLATE_CODE,
            description: `
                This template is used to customize the icon of the menu item.
                If it is defined, it will override the top-level icon template.
            `,
            name: "Menu Item Icon Template"
        },
        menuItemShortcutTemplate: {
            active: false,
            code: MENU_ITEM_SHORTCUT_TEMPLATE_CODE,
            description: `
                This template is used to customize the shortcut of the menu item.
                If it is defined, it will override the top-level shortcut template.
            `,
            name: "Menu Item Shortcut Template"
        },
        menuItemTextTemplate: {
            active: false,
            code: MENU_ITEM_TEXT_TEMPLATE_CODE,
            description: `
                This template is used to customize the text of the menu item.
                If it is defined, it will override the top-level text template.
            `,
            name: "Menu Item Text Template"
        },
        textTemplate: {
            code: TEXT_TEMPLATE_CODE,
            description: `This template is used to customize the text of the dropdown button.`,
            name: "Text Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: TOP_LEVEL_GROUP_TEMPLATE_CODE,
            description: `This template is defined at the top level and can be used to customize the appearance of all groups in the dropdown button menu.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelIconTemplate: {
            code: TOP_LEVEL_ICON_TEMPLATE_CODE,
            description: `This template is defined at the top level and can be used to customize the appearance of all icons in the dropdown button menu.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: TOP_LEVEL_SHORTCUT_TEMPLATE_CODE,
            description: `This template is defined at the top level and can be used to customize the appearance of all shortcuts in the dropdown button menu.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: TOP_LEVEL_TEXT_TEMPLATE_CODE,
            description: `This template is defined at the top level and can be used to customize the appearance of all text in the dropdown button menu.`,
            name: "Top Level Text Template",
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<DropdownButtonComponent>>(() => ({
        inputs: deriveInputConfig<DropdownButtonComponent>(this.metadata(), {
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
            // The demo curates a non-empty starting text instead of the library's "" default.
            text: {
                type: "string",
                value: "Dropdown Button"
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DropdownButtonComponent");
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
        RandomColorPipe,
        LucideSettings,
        LucideMenu,
        LucideHeart
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-dropdown-button
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledby()"
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [loading]="loading()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [text]="!iconOnly() ? text() : ''"
            [class]="userClass()">
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
                        <svg lucideSettings size="14"></svg>
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
                        <svg lucideMenu size="14"></svg>
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
                    <svg lucideHeart [size]="14" [color]="'' | randomColor"></svg>
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
    public readonly ariaLabel = input("");
    public readonly ariaLabelledby = input("");
    public readonly disabled = input<ReturnType<DropdownButtonComponent["disabled"]>>(false);
    public readonly iconOnly = input<ReturnType<DropdownButtonComponent["iconOnly"]>>(false);
    public readonly loading = input<ReturnType<DropdownButtonComponent["loading"]>>(false);
    public readonly look = input<ReturnType<DropdownButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<DropdownButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<DropdownButtonComponent["size"]>>("medium");
    public readonly text = input("Dropdown Button");
    public readonly userClass = input("");
}
