import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import {
    LucideArrowUpNarrowWide,
    LucideClipboardPaste,
    LucideCopy,
    LucideHeart,
    LucideScissors
} from "@lucide/angular";
import {
    ButtonDirective,
    ContextMenuCheckboxItemComponent,
    ContextMenuComponent,
    ContextMenuGroupComponent,
    ContextMenuGroupTemplateDirective,
    ContextMenuIconTemplateDirective,
    ContextMenuItemComponent,
    ContextMenuRadioGroupComponent,
    ContextMenuRadioItemComponent,
    ContextMenuSeparatorComponent,
    ContextMenuShortcutTemplateDirective,
    ContextMenuTextTemplateDirective
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
                <mona-contextmenu-group [title]="'System Actions'">
                    <ng-template monaContextMenuGroupTemplate let-title>
                        <span class="text-blue-500">{{ title }}</span>
                    </ng-template>
                </mona-contextmenu-group>
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
                <mona-contextmenu-item label="Paste Shortcut">
                    <ng-template monaContextMenuShortcutTemplate>
                        <div class="flex items-center gap-1 text-gray-600">Ctrl + Shift + V</div>
                    </ng-template>
                </mona-contextmenu-item>
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
                <mona-contextmenu-item label="Paste">
                    <ng-template monaContextMenuTextTemplate let-item>
                        <span class="text-amber-600">{{ item.label }}</span>
                    </ng-template>
                </mona-contextmenu-item>
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

            `,
            description: `This template is used to customize the icons of all menu items.`,
            name: "Top Level Icon Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: `
                <mona-contextmenu>
                    <ng-template monaContextMenuGroupTemplate let-group>
                        <div class="text-green-500 p-2">{{ group }}</div>
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
                    <ng-template monaContextMenuShortcutTemplate let-item>
                        @if (item.label === "Properties") {
                            <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></div>
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
                     <ng-template monaContextMenuTextTemplate let-item>
                        <span [style.color]="'' | randomColor">{{ item.text }}</span>
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

        `,
        inputs: {
            // context: { type: "object", value: { prop: "Context menu context" } },
            items: {
                type: "object"
            },
            minWidth: {
                type: "string",
                value: ""
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
            width: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ContextMenuComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "ContextMenuItemComponent",
        "ContextMenuGroupComponent",
        "ContextMenuCheckboxItemComponent",
        "ContextMenuRadioGroupComponent",
        "ContextMenuRadioItemComponent",
        "ContextMenuSeparatorComponent"
    ]);
    protected readonly ContextMenuWrapperComponent = ContextMenuWrapperComponent;
}

@Component({
    imports: [
        ButtonDirective,
        ContextMenuComponent,
        ContextMenuCheckboxItemComponent,
        ContextMenuItemComponent,
        ContextMenuRadioGroupComponent,
        ContextMenuRadioItemComponent,
        ContextMenuSeparatorComponent,
        ContextMenuGroupComponent,
        ContextMenuIconTemplateDirective,
        ContextMenuGroupTemplateDirective,
        ContextMenuShortcutTemplateDirective,
        ContextMenuTextTemplateDirective,
        RandomColorPipe,
        LucideArrowUpNarrowWide,
        LucideScissors,
        LucideCopy,
        LucideClipboardPaste,
        LucideHeart
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <button monaButton class="mr-4" #menuTarget>Context Menu Target</button>
        <mona-contextmenu
            (menuClick)="onMenuClick($event, 'mona-contextmenu')"
            [minWidth]="minWidth()"
            [rounded]="rounded()"
            [size]="size()"
            [target]="menuTarget"
            [width]="width()">
            <!--            [context]="context()"-->
            <mona-contextmenu-item [label]="'Open in New Tab'"></mona-contextmenu-item>
            <mona-contextmenu-item [label]="'Open in New Window'" [disabled]="true"></mona-contextmenu-item>
            <mona-contextmenu-separator></mona-contextmenu-separator>
            <mona-contextmenu-item label="View">
                <mona-contextmenu-checkbox-item label="Preview Pane"></mona-contextmenu-checkbox-item>
                <mona-contextmenu-checkbox-item label="Details Pane" [checked]="true"></mona-contextmenu-checkbox-item>
                <mona-contextmenu-checkbox-item
                    label="Navigation Pane"
                    [checked]="true"></mona-contextmenu-checkbox-item>
            </mona-contextmenu-item>
            <mona-contextmenu-item [label]="'Sort By'">
                @if (featureData["iconTemplate"].active) {
                    <ng-template monaContextMenuIconTemplate>
                        <svg lucideSortAsc [size]="14"></svg>
                    </ng-template>
                }
                <mona-contextmenu-radio-group value="name">
                    <mona-contextmenu-radio-item label="Name" value="name"></mona-contextmenu-radio-item>
                    <mona-contextmenu-radio-item
                        label="Date Modified"
                        value="dateModified"></mona-contextmenu-radio-item>
                    <mona-contextmenu-radio-item label="Type" value="type"></mona-contextmenu-radio-item>
                    <mona-contextmenu-radio-item label="Size" value="size"></mona-contextmenu-radio-item>
                </mona-contextmenu-radio-group>
                <mona-contextmenu-separator></mona-contextmenu-separator>
                <mona-contextmenu-radio-group value="asc">
                    <mona-contextmenu-radio-item label="Ascending" value="asc"></mona-contextmenu-radio-item>
                    <mona-contextmenu-radio-item label="Descending" value="desc"></mona-contextmenu-radio-item>
                </mona-contextmenu-radio-group>
            </mona-contextmenu-item>
            <mona-contextmenu-separator></mona-contextmenu-separator>
            <mona-contextmenu-item label="New">
                <mona-contextmenu-item label="Folder"></mona-contextmenu-item>
                <mona-contextmenu-item label="Shortcut"></mona-contextmenu-item>
                <mona-contextmenu-item label="Text Document"></mona-contextmenu-item>
                <mona-contextmenu-item label="Compressed (zipped) Folder"></mona-contextmenu-item>
            </mona-contextmenu-item>
            <mona-contextmenu-separator></mona-contextmenu-separator>
            <mona-contextmenu-item label="Cut">
                @if (featureData["iconTemplate"].active) {
                    <ng-template monaContextMenuIconTemplate>
                        <svg lucideScissors [size]="14"></svg>
                    </ng-template>
                }
            </mona-contextmenu-item>
            <mona-contextmenu-item label="Copy">
                @if (featureData["iconTemplate"].active) {
                    <ng-template monaContextMenuIconTemplate>
                        <svg lucideCopy [size]="14"></svg>
                    </ng-template>
                }
            </mona-contextmenu-item>
            <mona-contextmenu-item label="Paste">
                @if (featureData["iconTemplate"].active) {
                    <ng-template monaContextMenuIconTemplate>
                        <svg lucideClipboardPaste [size]="14"></svg>
                    </ng-template>
                }
                @if (featureData["textTemplate"].active) {
                    <ng-template monaContextMenuTextTemplate let-item>
                        <span class="text-amber-600">{{ item.label }}</span>
                    </ng-template>
                }
            </mona-contextmenu-item>
            <mona-contextmenu-item label="Paste Shortcut">
                @if (featureData["shortcutTemplate"].active) {
                    <ng-template monaContextMenuShortcutTemplate>
                        <div class="flex items-center gap-1 text-gray-600">Ctrl + Shift + V</div>
                    </ng-template>
                }
            </mona-contextmenu-item>
            <mona-contextmenu-separator></mona-contextmenu-separator>
            <mona-contextmenu-group title="System Actions">
                <mona-contextmenu-item label="Share">
                    <mona-contextmenu-item label="Email"></mona-contextmenu-item>
                    <mona-contextmenu-item label="Zip and Email"></mona-contextmenu-item>
                    <mona-contextmenu-item label="Print"></mona-contextmenu-item>
                    <mona-contextmenu-separator></mona-contextmenu-separator>
                    <mona-contextmenu-item label="Specific People..."></mona-contextmenu-item>
                </mona-contextmenu-item>
                <mona-contextmenu-item label="Properties"></mona-contextmenu-item>
                @if (featureData["groupTemplate"].active) {
                    <ng-template monaContextMenuGroupTemplate let-title>
                        <span class="text-blue-500">{{ title }}</span>
                    </ng-template>
                }
            </mona-contextmenu-group>

            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaContextMenuIconTemplate let-item>
                    <svg lucideHeart [size]="14" [color]="'' | randomColor"></svg>
                </ng-template>
            }
            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaContextMenuGroupTemplate let-group>
                    <div class="text-green-500 p-2">{{ group }}</div>
                </ng-template>
            }
            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaContextMenuShortcutTemplate let-item>
                    @if (item.label === "Properties") {
                        <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></div>
                    }
                </ng-template>
            }
            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaContextMenuTextTemplate let-item>
                    <span [style.color]="'' | randomColor">{{ item.label }}</span>
                </ng-template>
            }
        </mona-contextmenu>
    `
})
class ContextMenuWrapperComponent implements ComponentInputsAsSignal<ContextMenuComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly items = input<ReturnType<ContextMenuComponent["items"]>>([]);
    public readonly minWidth = input<ReturnType<ContextMenuComponent["minWidth"]>>();
    public readonly rounded = input<ReturnType<ContextMenuComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ContextMenuComponent["size"]>>("medium");
    public readonly target = input.required<ReturnType<ContextMenuComponent["target"]>>();
    public readonly width = input<ReturnType<ContextMenuComponent["width"]>>();

    protected onMenuClick(event: any, source: string): void {
        console.log("Menu item clicked: ", source, event);
    }
}
