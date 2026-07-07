import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from "@angular/core";
import {
    LucideArrowBigLeft,
    LucideArrowBigRight,
    LucideArrowLeft,
    LucideArrowRight,
    LucideHeart,
    LucideRotateCw,
    LucideSettings
} from "@lucide/angular";
import {
    type MenuItem,
    PopupMenuCheckboxItemComponent,
    PopupMenuComponent,
    PopupMenuGroupComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuItemComponent,
    PopupMenuRadioGroupComponent,
    PopupMenuRadioItemComponent,
    PopupMenuSeparatorComponent,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective
} from "mona-ui/popup-menu";
import { MenuItemClickEvent } from "mona-ui/menubar";
import { ButtonDirective } from "mona-ui/button";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-popup-menu-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./popup-menu-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupMenuDemoComponent extends AbstractDemoComponent<PopupMenuComponent> {
    readonly #injector = createFeatureInjector({
        checkableItems: {
            code: ``,
            description: `This feature enables checkable items in the popup menu, allowing users to select or deselect options.`,
            name: "Checkable Items",
            active: false
        },
        groupTemplate: {
            code: ``,
            description: `This template is used to customize the group title in the popup menu.`,
            name: "Group Template",
            active: false
        },
        iconTemplate: {
            code: ``,
            description: `This template is used to customize the icon displayed in the popup menu items.`,
            name: "Icon Template",
            active: false
        },
        radioGroup: {
            code: ``,
            description: `This feature enables radio groups in the popup menu, allowing users to select one option from a set.`,
            name: "Radio Group",
            active: false
        },
        shortcutTemplate: {
            code: ``,
            description: `This template is used to customize the shortcut text displayed in the popup menu items.`,
            name: "Shortcut Template",
            active: false
        },
        textTemplate: {
            code: ``,
            description: `This template is used to customize the text displayed in the popup menu items.`,
            name: "Text Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: ``,
            description: `This template is defined at the top level and can be used to customize the appearance of all groups in the popup menu.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelIconTemplate: {
            code: ``,
            description: `This template is defined at the top level and can be used to customize the appearance of all icons in the popup menu.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: ``,
            description: `This template is defined at the top level and can be used to customize the appearance of all shortcuts in the popup menu.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: ``,
            description: `This template is defined at the top level and can be used to customize the appearance of all text in the popup menu.`,
            name: "Top Level Text Template",
            active: false
        },
        separateAnchorAndTarget: {
            code: ``,
            description: `This feature allows you to use a separate anchor element for the popup menu, which can be useful for precise positioning.`,
            name: "Separate Anchor and Target",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<PopupMenuComponent>>({
        code: ``,
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
                defaultValue: "bottomleft"
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
                defaultValue: "topleft"
            },
            precise: {
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
            },
            target: {
                type: "object"
            },
            trigger: {
                type: "dropdown",
                value: ["click", "contextmenu"],
                defaultValue: "click"
            },
            width: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("PopupMenuComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly PopupMenuWrapperComponent = PopupMenuWrapperComponent;
}

@Component({
    imports: [
        ButtonDirective,
        PopupMenuComponent,
        PopupMenuCheckboxItemComponent,
        PopupMenuItemComponent,
        PopupMenuGroupComponent,
        PopupMenuSeparatorComponent,
        PopupMenuGroupTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuRadioGroupComponent,
        PopupMenuRadioItemComponent,
        PopupMenuShortcutTemplateDirective,
        PopupMenuTextTemplateDirective,
        RandomColorPipe,
        LucideArrowLeft,
        LucideArrowRight,
        LucideRotateCw,
        LucideSettings,
        LucideArrowBigLeft,
        LucideArrowBigRight,
        LucideHeart
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <div class="flex gap-2">
            <button monaButton #popupTarget>Popup Target</button>
            @if (featureData["separateAnchorAndTarget"].active) {
                <button monaButton #popupAnchorElement>Popup Anchor</button>
            }
        </div>
        <mona-popup-menu
            [anchor]="popupAnchor()"
            [anchorConnectionPoint]="anchorConnectionPoint()"
            (close)="onClose($event)"
            (menuClick)="onMenuItemClick($event)"
            [minWidth]="minWidth()"
            (navigate)="onNavigate($event)"
            [offset]="offset()"
            [popupConnectionPoint]="popupConnectionPoint()"
            [precise]="precise()"
            [rounded]="rounded()"
            [size]="size()"
            [target]="popupTarget"
            [trigger]="trigger()"
            [width]="width()">
            <mona-popup-menu-group title="Navigation">
                <mona-popup-menu-item label="Back">
                    @if (featureData["iconTemplate"].active) {
                        <ng-template monaPopupMenuIconTemplate>
                            <svg lucideArrowLeft [size]="16"></svg>
                        </ng-template>
                    }
                </mona-popup-menu-item>
                <mona-popup-menu-item label="Forward" [disabled]="true">
                    @if (featureData["iconTemplate"].active) {
                        <ng-template monaPopupMenuIconTemplate>
                            <svg lucideArrowRight [size]="16"></svg>
                        </ng-template>
                    }
                </mona-popup-menu-item>
                <mona-popup-menu-item label="Reload">
                    @if (featureData["iconTemplate"].active) {
                        <ng-template monaPopupMenuIconTemplate>
                            <svg lucideRotateCw [size]="14"></svg>
                        </ng-template>
                    }
                </mona-popup-menu-item>
            </mona-popup-menu-group>
            <mona-popup-menu-separator></mona-popup-menu-separator>
            <mona-popup-menu-item label="Bookmark Page"></mona-popup-menu-item>
            <mona-popup-menu-item label="Bookmark All Tabs">
                <mona-popup-menu-group title="Bookmark Options">
                    <mona-popup-menu-item label="Option 1"></mona-popup-menu-item>
                    <mona-popup-menu-item label="Option 2"></mona-popup-menu-item>
                    <mona-popup-menu-item label="Option 3"></mona-popup-menu-item>
                </mona-popup-menu-group>
            </mona-popup-menu-item>
            <mona-popup-menu-separator></mona-popup-menu-separator>
            <mona-popup-menu-item label="Saved Items">
                <mona-popup-menu-group title="History">
                    <mona-popup-menu-item label="History 1"></mona-popup-menu-item>
                    <mona-popup-menu-item label="History 2"></mona-popup-menu-item>
                    <mona-popup-menu-item label="History 3"></mona-popup-menu-item>
                    @if (featureData["groupTemplate"].active) {
                        <ng-template monaPopupMenuGroupTemplate let-group>
                            <span class="text-teal-500 font-semibold">{{ group }}</span>
                        </ng-template>
                    }
                </mona-popup-menu-group>
                <mona-popup-menu-separator></mona-popup-menu-separator>
                <mona-popup-menu-group title="Bookmarks">
                    <mona-popup-menu-item label="Bookmark 1"></mona-popup-menu-item>
                    <mona-popup-menu-item label="Bookmark 2"></mona-popup-menu-item>
                    <mona-popup-menu-item label="Bookmark 3"></mona-popup-menu-item>
                </mona-popup-menu-group>
            </mona-popup-menu-item>
            @if (featureData["checkableItems"].active) {
                <mona-popup-menu-separator></mona-popup-menu-separator>
                <mona-popup-menu-group title="Tools">
                    <mona-popup-menu-checkbox-item label="Tool 1"></mona-popup-menu-checkbox-item>
                    <mona-popup-menu-checkbox-item label="Tool 2" [checked]="true"></mona-popup-menu-checkbox-item>
                    <mona-popup-menu-checkbox-item label="Tool 3"></mona-popup-menu-checkbox-item>
                </mona-popup-menu-group>
            }
            @if (featureData["radioGroup"].active) {
                <mona-popup-menu-separator></mona-popup-menu-separator>
                <mona-popup-menu-radio-group value="lily" title="People">
                    <mona-popup-menu-radio-item label="Alice" value="alice"></mona-popup-menu-radio-item>
                    <mona-popup-menu-radio-item label="Monica" value="monica"></mona-popup-menu-radio-item>
                    <mona-popup-menu-radio-item label="Lily" value="lily"></mona-popup-menu-radio-item>
                </mona-popup-menu-radio-group>
            }
            <mona-popup-menu-separator></mona-popup-menu-separator>
            <mona-popup-menu-item label="Settings">
                @if (featureData["textTemplate"].active) {
                    <ng-template monaPopupMenuTextTemplate let-item>
                        <span class="text-blue-900 italic">{{ item.label }}</span>
                    </ng-template>
                }
            </mona-popup-menu-item>
            <mona-popup-menu-item label="Help"></mona-popup-menu-item>
            <mona-popup-menu-item label="About">
                <mona-popup-menu-group title="Version">
                    <mona-popup-menu-item label="Version 1.0"></mona-popup-menu-item>
                    <mona-popup-menu-item label="Version 2.0"></mona-popup-menu-item>
                </mona-popup-menu-group>
            </mona-popup-menu-item>
            <mona-popup-menu-item label="Exit">
                @if (featureData["shortcutTemplate"].active) {
                    <ng-template monaPopupMenuShortcutTemplate>
                        <span class="text-xs text-gray-500">Ctrl + Q</span>
                    </ng-template>
                }
            </mona-popup-menu-item>

            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaPopupMenuGroupTemplate let-group>
                    @if (group === "Navigation") {
                        <span class="text-blue-500 font-semibold">{{ group }}</span>
                    } @else if (group === "History") {
                        <span class="text-green-500 font-semibold">{{ group }}</span>
                    } @else if (group === "Bookmarks") {
                        <span class="text-purple-500 font-semibold">{{ group }}</span>
                    } @else {
                        <span class="text-gray-500 font-semibold">{{ group }}</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaPopupMenuIconTemplate let-item>
                    @if (item.label === "Settings") {
                        <svg lucideSettings [size]="14"></svg>
                    } @else if (item.label === "Back") {
                        <svg lucideArrowBigLeft [size]="14"></svg>
                    } @else if (item.label === "Forward") {
                        <svg lucideArrowBigRight [size]="14"></svg>
                    } @else {
                        <svg lucideHeart [size]="14" [color]="'' | randomColor"></svg>
                    }
                </ng-template>
            }

            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaPopupMenuShortcutTemplate let-item>
                    @if (item.label === "Reload") {
                        <span class="text-xs text-gray-500">F5</span>
                    } @else if (item.label === "Exit") {
                        <span class="text-xs text-gray-500">Ctrl + Shift + Q</span>
                    }
                </ng-template>
            }

            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaPopupMenuTextTemplate let-item>
                    @if (item.label === "Help") {
                        <span class="text-rose-700 underline">{{ item.label }}</span>
                    } @else {
                        <span [style.color]="'' | randomColor">{{ item.label }}</span>
                    }
                </ng-template>
            }
        </mona-popup-menu>
    `
})
export class PopupMenuWrapperComponent implements ComponentInputsAsSignal<PopupMenuComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected menuItems: MenuItem[] = [
        {
            label: "test",
            items: [
                { label: "test 1.1", group: "" },
                { label: "test 1.2", group: "" }
            ]
        },
        { group: "x", label: "test 2" },
        { group: "y", label: "test 3" },
        { group: "x", label: "test 4" },
        { label: "test 5", checkable: true, checked: true }
    ];
    protected readonly popupAnchor = viewChild<ElementRef>("popupAnchorElement");
    public readonly anchor = input<ReturnType<PopupMenuComponent["anchor"]>>();
    public readonly anchorConnectionPoint = input<ReturnType<PopupMenuComponent["anchorConnectionPoint"]>>(null);
    public readonly items = input<any>([]);
    public readonly minWidth = input<ReturnType<PopupMenuComponent["minWidth"]>>();
    public readonly offset = input<ReturnType<PopupMenuComponent["offset"]>>({ horizontal: 0, vertical: 0 });
    public readonly popupConnectionPoint = input<ReturnType<PopupMenuComponent["popupConnectionPoint"]>>(null);
    public readonly precise = input<ReturnType<PopupMenuComponent["precise"]>>(false);
    public readonly rounded = input<ReturnType<PopupMenuComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<PopupMenuComponent["size"]>>("medium");
    public readonly target = input<ReturnType<PopupMenuComponent["target"]>>(document.body);
    public readonly trigger = input<ReturnType<PopupMenuComponent["trigger"]>>("click");
    public readonly width = input<ReturnType<PopupMenuComponent["width"]>>();

    public onClose(event: any): void {
        // event.preventDefault();
        console.log("Popup menu closed:", event);
    }

    protected onMenuItemClick(event: MenuItemClickEvent): void {
        const item = event.item;
        const existingItem = this.menuItems.find(i => i.label === item.label);
        if (existingItem && existingItem.checkable) {
            existingItem.checked = !existingItem.checked;
            this.menuItems = [...this.menuItems];
        }
    }

    protected onNavigate(event: any): void {
        console.log("Navigate event:", event.item?.label ?? null, event);
    }
}
