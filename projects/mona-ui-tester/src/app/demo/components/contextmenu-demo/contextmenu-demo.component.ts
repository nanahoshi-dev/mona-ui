import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from "@angular/core";
import { LucideAngularModule, ArrowLeft, ArrowRight, RefreshCcw, Heart } from "lucide-angular";
import {
    ButtonDirective,
    ContextMenuComponent,
    MenuGroupTemplateDirective,
    MenuItemClickEvent,
    MenuItemComponent,
    MenuItemGroupComponent,
    MenuItemIconTemplateDirective,
    MenuItemShortcutTemplateDirective,
    MenuItemTextTemplateDirective
} from "mona-ui";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-contextmenu-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./contextmenu-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuDemoComponent extends AbstractDemoComponent<ContextMenuComponent> {
    readonly #injector = createFeatureInjector({
        groupTemplate: {
            code: `
                <mona-menu-item-group [title]="'Extra'">
                    <ng-template monaMenuGroupTemplate let-title let-menuItems="items">
                        <span class="text-blue-500">{{ title }}</span>
                    </ng-template>
                </mona-menu-item-group>
            `,
            description: `
                This template is used to customize the title of menu item groups.
                It will override the top level group template if both are used.
            `,
            name: "Group Template",
            active: false
        },
        iconTemplate: {
            code: `
                <mona-menu-item [text]="'Reload'">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="reloadIcon" [size]="14"></lucide-angular>
                    </ng-template>
                </mona-menu-item>
            `,
            description: `
                This template is used to customize the icon of the menu item.
                It will override the top level icon template if both are used.
            `,
            name: "Icon Template",
            active: false
        },
        shortcutTemplate: {
            code: `
                <mona-menu-item [text]="'History'">
                    <ng-template monaMenuItemShortcutTemplate>
                        <div class="flex items-center gap-1">
                            <kbd>Ctrl</kbd> + <kbd>H</kbd>
                        </div>
                    </ng-template>
                </mona-menu-item>
            `,
            description: `
                This template is used to customize the shortcut of the menu item.
                It will override the top level shortcut template if both are used.
            `,
            name: "Shortcut Template",
            active: false
        },
        textTemplate: {
            code: `
                <mona-menu-item [text]="'Downloads'">
                    <ng-template monaMenuItemTextTemplate>
                        <span class="text-amber-600">Downloaded Items</span>
                    </ng-template>
                </mona-menu-item>
            `,
            description: `
                This template is used to customize the text of the menu item.
                It will override the top level text template if both are used.
            `,
            name: "Text Template",
            active: false
        },
        topLevelIconTemplate: {
            code: `
                <mona-contextmenu>
                    <ng-template monaMenuItemIconTemplate let-menuItem>
                        <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                    </ng-template>
                </mona-contextmenu>
            `,
            description: `This template is used to customize the icons of all menu items.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: `
                <mona-contextmenu>
                    <ng-template monaMenuGroupTemplate let-title let-menuItems="items">
                        <div class="text-green-500 p-2">{{ title }} ({{ menuItems.length }}) item(s)</div>
                    </ng-template>
                </mona-contextmenu>
            `,
            description: `This template is used to customize the title of all menu item groups.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: `
                <mona-contextmenu>
                    <ng-template monaMenuItemShortcutTemplate let-menuItem>
                        @if (menuItem.text === "Help") {
                            <div class="flex items center gap-1">
                                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>
                            </div>
                        }
                    </ng-template>
                </mona-contextmenu>
            `,
            description: `This template is used to customize the shortcuts of all menu items.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: `
                <mona-contextmenu>
                    <ng-template monaMenuItemTextTemplate let-menuItem>
                        <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                    </ng-template>
                </mona-contextmenu>
            `,
            description: `This template is used to customize the text of tall menu items.`,
            name: "Top Level Text Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<ContextMenuComponent>>({
        code: `
            <mona-contextmenu
                (menuClick)="onMenuClick($event, 'mona-contextmenu')"
                [anchor]="menuAnchorElement()"
                [anchorConnectionPoint]="anchorConnectionPoint()"
                [context]="context()"
                [minWidth]="minWidth()"
                [offset]="offset()"
                [popupClass]="popupClass()"
                [popupConnectionPoint]="popupConnectionPoint()"
                [precise]="precise()"
                [target]="menuTarget"
                [trigger]="trigger()"
                [width]="width()">
                <mona-menu-item [text]="'Back'">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="backIcon" [size]="14"></lucide-angular>
                    </ng-template>
                </mona-menu-item>
                <mona-menu-item [text]="'Forward'" [disabled]="true">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="forwardIcon" [size]="14"></lucide-angular>
                    </ng-template>
                </mona-menu-item>
                <mona-menu-item [text]="'Reload'">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="reloadIcon" [size]="14"></lucide-angular>
                    </ng-template>
                </mona-menu-item>
                <mona-menu-item [text]="'More'">
                    <mona-menu-item-group [title]="'Settings'">
                        <mona-menu-item
                            [text]="'General'"
                            (menuClick)="onMenuClick($event, 'mona-menu-item')"></mona-menu-item>
                        <mona-menu-item [text]="'Appearance'">
                            <mona-menu-item-group title="Appearance">
                                <mona-menu-item text="Theme"></mona-menu-item>
                                <mona-menu-item text="Colors"></mona-menu-item>
                            </mona-menu-item-group>
                            <mona-menu-item [divider]="true"></mona-menu-item>
                            <mona-menu-item-group title="Visibility">
                                <mona-menu-item text="Visible"></mona-menu-item>
                                <mona-menu-item text="Hidden"></mona-menu-item>
                            </mona-menu-item-group>
                        </mona-menu-item>
                        <mona-menu-item [text]="'Privacy'"></mona-menu-item>
                        <mona-menu-item [text]="'Security'"></mona-menu-item>
                    </mona-menu-item-group>
                </mona-menu-item>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item-group title="Group 2">
                    <mona-menu-item [text]="'Bookmarks'"></mona-menu-item>
                    <mona-menu-item [text]="'Downloads'">
                        <ng-template monaMenuItemTextTemplate>
                            <span class="text-amber-600">Downloaded Items</span>
                        </ng-template>
                    </mona-menu-item>
                    <mona-menu-item [text]="'History'">
                        <ng-template monaMenuItemShortcutTemplate>
                            <div class="flex items-center gap-1"><kbd>Ctrl</kbd> + <kbd>H</kbd></div>
                        </ng-template>
                    </mona-menu-item>
                    <mona-menu-item [text]="'Extensions'"></mona-menu-item>
                </mona-menu-item-group>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item-group [title]="'Extra'">
                    <mona-menu-item [text]="'Help'"></mona-menu-item>
                    <mona-menu-item [text]="'About'"></mona-menu-item>
                    <ng-template monaMenuGroupTemplate let-title>
                        <span class="text-blue-500">{{ title }}</span>
                    </ng-template>
                </mona-menu-item-group>

                <ng-template monaMenuItemIconTemplate let-menuItem>
                    <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                </ng-template>
                <ng-template monaMenuGroupTemplate let-title let-items="items">
                    <div class="text-green-500 p-2">{{ title }} ({{ items.length }} item(s))</div>
                </ng-template>
                <ng-template monaMenuItemShortcutTemplate let-menuItem>
                    @if (menuItem.text === "Help") {
                        <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd></div>
                    }
                </ng-template>
                <ng-template monaMenuItemTextTemplate let-menuItem>
                    <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                </ng-template>
            </mona-contextmenu>
        `,
        inputs: {
            anchor: {
                type: "object"
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
                defaultValue: "center"
            },
            context: { type: "object", value: { prop: "Context menu context" } },
            menuItems: {
                type: "object"
            },
            minWidth: {
                type: "string",
                value: ""
            },
            offset: {
                type: "dropdown",
                value: [
                    { horizontal: 0, vertical: 0 },
                    { horizontal: 0, vertical: 4 },
                    { horizontal: 0, vertical: -4 },
                    { horizontal: 120, vertical: -20 },
                    { horizontal: -120, vertical: -20 }
                ],
                defaultValue: { horizontal: 0, vertical: 0 }
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
                defaultValue: "center"
            },
            precise: {
                type: "boolean",
                value: true
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
            },
            target: {
                type: "object"
            },
            trigger: {
                type: "dropdown",
                value: ["contextmenu", "click"],
                defaultValue: "contextmenu"
            },
            width: {
                type: "string",
                value: ""
            }
        },
        outputs: {
            close: { type: "event" },
            menuClick: { type: "event" },
            navigate: { type: "event" },
            open: { type: "event" }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ContextMenuComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "MenuItemComponent",
        "MenuItemGroupComponent"
    ]);
    protected readonly ContextMenuWrapperComponent = ContextMenuWrapperComponent;
}

@Component({
    imports: [
        ButtonDirective,
        ContextMenuComponent,
        MenuItemComponent,
        MenuItemGroupComponent,
        MenuItemIconTemplateDirective,
        LucideAngularModule,
        MenuItemTextTemplateDirective,
        RandomColorPipe,
        MenuItemShortcutTemplateDirective,
        MenuGroupTemplateDirective
    ],
    template: `
        @let featureData = features();
        <button monaButton class="mr-4" #menuTarget>Context Menu Target</button>
        @if (!precise()) {
            <button monaButton #menuAnchor>Context Menu Anchor</button>
        }
        <mona-contextmenu
            (menuClick)="onMenuClick($event, 'mona-contextmenu')"
            [anchor]="menuAnchorElement()"
            [anchorConnectionPoint]="anchorConnectionPoint()"
            [context]="context()"
            [minWidth]="minWidth()"
            [offset]="offset()"
            [popupClass]="popupClass()"
            [popupConnectionPoint]="popupConnectionPoint()"
            [precise]="precise()"
            [rounded]="rounded()"
            [size]="size()"
            [target]="menuTarget"
            [trigger]="trigger()"
            [width]="width()">
            <mona-menu-item [text]="'Back'">
                @if (featureData && featureData["iconTemplate"].active) {
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="backIcon" [size]="14"></lucide-angular>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item [text]="'Forward'" [disabled]="true">
                @if (featureData && featureData["iconTemplate"].active) {
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="forwardIcon" [size]="14"></lucide-angular>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item [text]="'Reload'">
                @if (featureData && featureData["iconTemplate"].active) {
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="reloadIcon" [size]="14"></lucide-angular>
                    </ng-template>
                }
            </mona-menu-item>
            <mona-menu-item [text]="'More'">
                <mona-menu-item-group [title]="'Settings'">
                    <mona-menu-item
                        [text]="'General'"
                        (menuClick)="onMenuClick($event, 'mona-menu-item')"></mona-menu-item>
                    <mona-menu-item [text]="'Appearance'">
                        <mona-menu-item-group title="Appearance">
                            <mona-menu-item text="Theme"></mona-menu-item>
                            <mona-menu-item text="Colors"></mona-menu-item>
                        </mona-menu-item-group>
                        <mona-menu-item [divider]="true"></mona-menu-item>
                        <mona-menu-item-group title="Visibility">
                            <mona-menu-item text="Visible"></mona-menu-item>
                            <mona-menu-item text="Hidden"></mona-menu-item>
                        </mona-menu-item-group>
                    </mona-menu-item>
                    <mona-menu-item [text]="'Privacy'"></mona-menu-item>
                    <mona-menu-item [text]="'Security'"></mona-menu-item>
                </mona-menu-item-group>
            </mona-menu-item>
            <mona-menu-item [divider]="true"></mona-menu-item>
            <mona-menu-item-group title="Group 2">
                <mona-menu-item [text]="'Bookmarks'"></mona-menu-item>
                <mona-menu-item [text]="'Downloads'">
                    @if (featureData["textTemplate"].active) {
                        <ng-template monaMenuItemTextTemplate>
                            <span class="text-amber-600">Downloaded Items</span>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item [text]="'History'">
                    @if (featureData["shortcutTemplate"].active) {
                        <ng-template monaMenuItemShortcutTemplate>
                            <div class="flex items-center gap-1"><kbd>Ctrl</kbd> + <kbd>H</kbd></div>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item [text]="'Extensions'"></mona-menu-item>
            </mona-menu-item-group>
            <mona-menu-item [divider]="true"></mona-menu-item>
            <mona-menu-item-group [title]="'Extra'">
                <mona-menu-item [text]="'Help'"></mona-menu-item>
                <mona-menu-item [text]="'About'"></mona-menu-item>
                @if (featureData["groupTemplate"].active) {
                    <ng-template monaMenuGroupTemplate let-title>
                        <span class="text-blue-500">{{ title }}</span>
                    </ng-template>
                }
            </mona-menu-item-group>

            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaMenuItemIconTemplate let-menuItem>
                    <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                </ng-template>
            }
            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaMenuGroupTemplate let-title let-items="items">
                    <div class="text-green-500 p-2">{{ title }} ({{ items.length }} item(s))</div>
                </ng-template>
            }
            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaMenuItemShortcutTemplate let-menuItem>
                    @if (menuItem.text === "Help") {
                        <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd></div>
                    }
                </ng-template>
            }
            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaMenuItemTextTemplate let-menuItem>
                    <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                </ng-template>
            }
        </mona-contextmenu>
    `
})
class ContextMenuWrapperComponent implements ComponentInputsAsSignal<ContextMenuComponent> {
    protected readonly backIcon = ArrowLeft;
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly forwardIcon = ArrowRight;
    protected readonly heartIcon = Heart;
    protected readonly menuAnchorElement = viewChild<ElementRef>("menuAnchor");
    protected readonly reloadIcon = RefreshCcw;
    public readonly anchor = input<ReturnType<ContextMenuComponent["anchor"]>>(document.body);
    public readonly anchorConnectionPoint = input<ReturnType<ContextMenuComponent["anchorConnectionPoint"]>>(null);
    public readonly context = input<ReturnType<ContextMenuComponent["context"]>>({ x: 0, y: -1 });
    public readonly menuItems = input<ReturnType<ContextMenuComponent["menuItems"]>>([]);
    public readonly minWidth = input(undefined, {
        transform: (value: string | number | undefined) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });
    public readonly offset = input<ReturnType<ContextMenuComponent["offset"]>>({ horizontal: 0, vertical: 0 });
    public readonly popupClass = input([], {
        transform: (value: string | string[]) => {
            if (Array.isArray(value)) {
                return value;
            }
            return [value];
        }
    });
    public readonly trigger = input<ReturnType<ContextMenuComponent["trigger"]>>("contextmenu");
    public readonly popupConnectionPoint = input<ReturnType<ContextMenuComponent["popupConnectionPoint"]>>(null);
    public readonly precise = input<ReturnType<ContextMenuComponent["precise"]>>(true);
    public readonly rounded = input<ReturnType<ContextMenuComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ContextMenuComponent["size"]>>("medium");
    public readonly target = input.required<ReturnType<ContextMenuComponent["target"]>>();
    public readonly width = input(undefined, {
        transform: (value: number | string | undefined) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    protected onMenuClick(event: MenuItemClickEvent, source: string): void {
        console.log("Menu item clicked: ", source, event);
    }
}
