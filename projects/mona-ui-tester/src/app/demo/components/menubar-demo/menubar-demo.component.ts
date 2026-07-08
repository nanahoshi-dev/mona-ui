import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideFile, LucideFolderOpen, LucideHeart, LucideInfo, LucideSave, LucideView } from "@lucide/angular";
import {
    MenubarComponent,
    MenuCheckboxItemComponent,
    MenuComponent,
    MenuGroupComponent,
    MenuGroupTemplateDirective,
    MenuIconTemplateDirective,
    MenuItemClickEvent,
    MenuItemComponent,
    MenuItemIconTemplateDirective,
    MenuItemShortcutTemplateDirective,
    MenuItemTextTemplateDirective,
    MenuRadioGroupComponent,
    MenuRadioItemComponent,
    MenuSeparatorComponent,
    MenuTextTemplateDirective
} from "@mirei/mona-ui/menubar";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-menubar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./menubar-demo.component.html"
})
export class MenubarDemoComponent extends AbstractDemoComponent<MenubarComponent> {
    readonly #injector = createFeatureInjector({
        disableMenu: {
            code: `
                <mona-menubar>
                    <mona-menu [text]="'Edit'" [disabled]="true">
                        <!-- Menu items here -->
                    </mona-menu>
                </mona-menubar>
            `,
            description: `Disable the Edit menu on the menubar.`,
            name: "Disable Menu",
            active: false
        },
        groupTemplate: {
            code: `
                <mona-menu-group [title]="'Text Operations'">
                    <ng-template monaMenuGroupTemplate let-group>
                        <span class="text-blue-600 font-semibold">{{ group }}</span>
                    </ng-template>
                </mona-menu-group>
            `,
            description: `
                This template is used to customize the title of menu item groups.
                It will override the top level group template if both are used.
            `,
            name: "Group Template",
            active: false
        },
        menuIconTemplate: {
            code: `

            `,
            description: `
                This template is used to customize the icon of the menu on the menubar.
                It will override the top level icon template if both are used.
            `,
            name: "Menu Icon Template",
            active: false
        },
        menuTextTemplate: {
            code: `
                <mona-menu [text]="'View'">
                    <ng-template monaMenuTextTemplate>
                        <span class="text-pink-600 font-semibold">View</span>
                    </ng-template>
                </mona-menu>
            `,
            description: `
                This template is used to customize the text of the menu on the menubar.
                It will override the top level text template if both are used.
            `,
            name: "Menu Text Template",
            active: false
        },
        menuItemIconTemplate: {
            code: `

            `,
            description: `
                This template is used to customize the icon of the menu item.
                It will override the top level icon template if both are used.
            `,
            name: "Menu Item Icon Template",
            active: false
        },
        menuItemShortcutTemplate: {
            code: `
                <mona-menu-item label="Save">
                    <ng-template monaMenuItemShortcutTemplate let-item>
                        <span class="text-amber-500">Ctrl+S</span>
                    </ng-template>
                </mona-menu-item>
            `,
            description: `
                This template is used to customize the shortcut of the menu item.
                It will override the top level shortcut template if both are used.
            `,
            name: "Menu Item Shortcut Template",
            active: false
        },
        menuItemTextTemplate: {
            code: `
                <mona-menu-item label="Export">
                    <ng-template monaMenuItemTextTemplate let-item>
                        <span class="text-blue-600 font-semibold">{{ item.label }}</span>
                    </ng-template>
                </mona-menu-item>
            `,
            description: `
                This template is used to customize the text of the menu item.
                It will override the top level text template if both are used.
            `,
            name: "Menu Item Text Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuGroupTemplate let-group>
                        <span class="text-emerald-700 font-semibold">{{ group }}</span>
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the title of all menu item groups.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelMenuItemIconTemplate: {
            code: `

            `,
            description: `This template is used to customize the icons of all menu items.`,
            name: "Top Level Menu Item Icon Template",
            active: false
        },
        topLevelMenuItemShortcutTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuItemShortcutTemplate let-item>
                        @if (item.label === "New") {
                            <span class="text-gray-500">Ctrl+N</span>
                        } @else if (item.label === "Open") {
                            <span class="text-gray-500">Ctrl+O</span>
                        } @else if (item.label === "Save") {
                            <span class="text-gray-500">Ctrl+S</span>
                        } @else if (item.label === "Save As") {
                            <span class="text-gray-500">Ctrl+Shift+S</span>
                        } @else if (item.label === "Close") {
                            <span class="text-gray-500">Ctrl+W</span>
                        }
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the shortcuts of all menu items.`,
            name: "Top Level Menu Item Shortcut Template",
            active: false
        },
        topLevelMenuItemTextTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuItemTextTemplate let-item>
                        @if (item.label === "Save As") {
                            <span class="text-blue-600 font-semibold">{{ item.label }}</span>
                        } @else {
                            <span>{{ item.label }}</span>
                        }
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the text of all menu items.`,
            name: "Top Level Menu Item Text Template",
            active: false
        },
        topLevelMenuIconTemplate: {
            code: `

            `,
            description: `This template is used to customize the icon of all menus on the menubar.`,
            name: "Top Level Menu Icon Template",
            active: false
        },
        topLevelMenuTextTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuTextTemplate let-menu let-items="items">
                        <span [style.color]="'' | randomColor">{{ menu }} ({{ items.length }})</span>
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the text of all menus on the menubar.`,
            name: "Top Level Menu Text Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<MenubarComponent>>({
        code: `

        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("MenubarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "MenuCheckboxItemComponent",
        "MenuComponent",
        "MenuGroupComponent",
        "MenuItemComponent",
        "MenuRadioGroupComponent",
        "MenuRadioItemComponent"
    ]);
    protected readonly MenubarWrapperComponent = MenubarWrapperComponent;
}

@Component({
    imports: [
        MenubarComponent,
        MenuComponent,
        MenuCheckboxItemComponent,
        MenuItemComponent,
        MenuItemIconTemplateDirective,
        MenuItemShortcutTemplateDirective,
        MenuItemTextTemplateDirective,
        MenuGroupComponent,
        MenuGroupTemplateDirective,
        MenuRadioGroupComponent,
        MenuRadioItemComponent,
        MenuSeparatorComponent,
        MenuIconTemplateDirective,
        MenuTextTemplateDirective,
        RandomColorPipe,
        LucideSave,
        LucideView,
        LucideInfo,
        LucideHeart,
        LucideFolderOpen,
        LucideFile
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-menubar
            [disabled]="disabled()"
            [rounded]="rounded()"
            [size]="size()"
            (menuItemClick)="onMenuItemClick($event)">
            <mona-menu [text]="'File'">
                <mona-menu-item label="New">
                    <mona-menu-item label="Project"></mona-menu-item>
                    <mona-menu-item label="File"></mona-menu-item>
                    <mona-menu-item label="From Template">
                        <mona-menu-item label="Web Project"></mona-menu-item>
                        <mona-menu-item label="Mobile Project"></mona-menu-item>
                    </mona-menu-item>
                </mona-menu-item>
                <mona-menu-item label="Open"></mona-menu-item>
                <mona-menu-item label="Save">
                    @if (featureData["menuItemShortcutTemplate"].active) {
                        <ng-template monaMenuItemShortcutTemplate let-item>
                            <span class="text-amber-500">Ctrl+S</span>
                        </ng-template>
                    }
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaMenuItemIconTemplate let-item>
                            <svg lucideSave [size]="12"></svg>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item label="Save As"></mona-menu-item>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-group [title]="'Export Options'">
                    <mona-menu-item label="Export">
                        @if (featureData["menuItemTextTemplate"].active) {
                            <ng-template monaMenuItemTextTemplate let-item>
                                <span class="text-blue-600 font-semibold">{{ item.label }}</span>
                            </ng-template>
                        }
                    </mona-menu-item>
                    <mona-menu-item label="Export As">
                        <mona-menu-item label="PDF"></mona-menu-item>
                        <mona-menu-item label="Image">
                            <mona-menu-item label="PNG"></mona-menu-item>
                            <mona-menu-item label="JPEG"></mona-menu-item>
                            <mona-menu-item label="SVG"></mona-menu-item>
                        </mona-menu-item>
                    </mona-menu-item>
                </mona-menu-group>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-item label="Close"></mona-menu-item>
            </mona-menu>
            <mona-menu [text]="'Edit'" [disabled]="featureData['disableMenu'].active ?? false">
                <mona-menu-item label="Undo"></mona-menu-item>
                <mona-menu-item label="Redo"></mona-menu-item>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-group [title]="'Text Operations'">
                    <mona-menu-item label="Cut"></mona-menu-item>
                    <mona-menu-item label="Copy"></mona-menu-item>
                    <mona-menu-item label="Paste"></mona-menu-item>
                    <mona-menu-separator></mona-menu-separator>
                    <mona-menu-item label="Find and Replace">
                        <mona-menu-item label="Find"></mona-menu-item>
                        <mona-menu-item label="Replace"></mona-menu-item>
                    </mona-menu-item>
                    @if (featureData["groupTemplate"].active) {
                        <ng-template monaMenuGroupTemplate let-group>
                            <span class="text-blue-600 font-semibold">{{ group }}</span>
                        </ng-template>
                    }
                </mona-menu-group>
            </mona-menu>
            <mona-menu [text]="'View'">
                <mona-menu-item label="Zoom">
                    <mona-menu-item label="Zoom In"></mona-menu-item>
                    <mona-menu-item label="Zoom Out"></mona-menu-item>
                    <mona-menu-separator></mona-menu-separator>
                    <mona-menu-item label="Reset Zoom"></mona-menu-item>
                </mona-menu-item>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-checkbox-item label="Show Grid" [(checked)]="showGrid"></mona-menu-checkbox-item>
                <mona-menu-checkbox-item label="Snap to Grid" [(checked)]="snapToGrid"></mona-menu-checkbox-item>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-item label="Fullscreen"></mona-menu-item>
                @if (featureData["menuTextTemplate"].active) {
                    <ng-template monaMenuTextTemplate>
                        <span class="text-pink-600 font-semibold">View</span>
                    </ng-template>
                }
                @if (featureData["menuIconTemplate"].active) {
                    <ng-template monaMenuIconTemplate>
                        <svg lucideView [size]="14" class="mr-0.5"></svg>
                    </ng-template>
                }
            </mona-menu>
            <mona-menu [text]="'Appearance'">
                <mona-menu-item label="Theme">
                    <mona-menu-radio-group [(value)]="selectedTheme">
                        <mona-menu-radio-item label="Light" value="light"></mona-menu-radio-item>
                        <mona-menu-radio-item label="Dark" value="dark"></mona-menu-radio-item>
                        <mona-menu-radio-item label="System" value="system"></mona-menu-radio-item>
                    </mona-menu-radio-group>
                </mona-menu-item>
                <mona-menu-item label="Font Size">
                    <mona-menu-radio-group [(value)]="selectedFontSize">
                        <mona-menu-radio-item label="Small" value="sm"></mona-menu-radio-item>
                        <mona-menu-radio-item label="Medium" value="md"></mona-menu-radio-item>
                        <mona-menu-radio-item label="Large" value="lg"></mona-menu-radio-item>
                    </mona-menu-radio-group>
                </mona-menu-item>
            </mona-menu>
            <mona-menu [text]="'Help'">
                <mona-menu-item label="Documentation"></mona-menu-item>
                <mona-menu-item label="About">
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaMenuItemIconTemplate let-item>
                            <svg lucideInfo [size]="12"></svg>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item label="Support">
                    <mona-menu-item label="Community Forum"></mona-menu-item>
                    <mona-menu-item label="Submit a Ticket"></mona-menu-item>
                </mona-menu-item>
                <mona-menu-separator></mona-menu-separator>
                <mona-menu-item label="Donate">
                    @if (featureData["menuItemIconTemplate"].active) {
                        <ng-template monaMenuItemIconTemplate let-item>
                            <svg lucideHeart [size]="12" class="text-pink-600"></svg>
                        </ng-template>
                    }
                </mona-menu-item>
            </mona-menu>

            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaMenuGroupTemplate let-group>
                    <span class="text-emerald-700 font-semibold">{{ group }}</span>
                </ng-template>
            }

            @if (featureData["topLevelMenuItemIconTemplate"].active) {
                <ng-template monaMenuItemIconTemplate let-item>
                    @if (item.label === "Open") {
                        <svg lucideFolderOpen [size]="12"></svg>
                    }
                </ng-template>
            }

            @if (featureData["topLevelMenuItemShortcutTemplate"].active) {
                <ng-template monaMenuItemShortcutTemplate let-item>
                    @if (item.label === "New") {
                        <span class="text-gray-500">Ctrl+N</span>
                    } @else if (item.label === "Open") {
                        <span class="text-gray-500">Ctrl+O</span>
                    } @else if (item.label === "Save") {
                        <span class="text-gray-500">Ctrl+S</span>
                    } @else if (item.label === "Save As") {
                        <span class="text-gray-500">Ctrl+Shift+S</span>
                    } @else if (item.label === "Close") {
                        <span class="text-gray-500">Ctrl+W</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelMenuItemTextTemplate"].active) {
                <ng-template monaMenuItemTextTemplate let-item>
                    @if (item.label === "Save As") {
                        <span class="text-blue-600 font-semibold">{{ item.label }}</span>
                    } @else {
                        <span>{{ item.label }}</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelMenuIconTemplate"].active) {
                <ng-template monaMenuIconTemplate let-menu let-items="items">
                    @if (menu === "File") {
                        <svg lucideFile [size]="14" class="mr-0.5"></svg>
                    }
                </ng-template>
            }

            @if (featureData["topLevelMenuTextTemplate"].active) {
                <ng-template monaMenuTextTemplate let-menu let-items="items">
                    <span [style.color]="'' | randomColor">{{ menu }} ({{ items.length }})</span>
                </ng-template>
            }
        </mona-menubar>
    `
})
class MenubarWrapperComponent implements ComponentInputsAsSignal<MenubarComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly showGrid = signal(true);
    protected readonly snapToGrid = signal(false);
    protected readonly selectedFontSize = signal("md");
    protected readonly selectedTheme = signal("system");
    public readonly disabled = input(false);
    public readonly size = input<ReturnType<MenubarComponent["size"]>>("medium");
    public readonly rounded = input<ReturnType<MenubarComponent["rounded"]>>("medium");

    protected onMenuItemClick(event: MenuItemClickEvent): void {
        // event.preventDefault();
        console.log("Menu item clicked:", event);
    }
}
