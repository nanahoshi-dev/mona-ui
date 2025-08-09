import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { LucideAngularModule, File, Info, HeartIcon, FolderOpen } from "lucide-angular";
import {
    MenubarComponent,
    MenuComponent,
    MenuGroupTemplateDirective,
    MenuItemClickEvent,
    MenuItemComponent,
    MenuItemGroupComponent,
    MenuItemIconTemplateDirective,
    MenuItemShortcutTemplateDirective,
    MenuItemTextTemplateDirective,
    MenuTextTemplateDirective
} from "mona-ui";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-menubar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./menubar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenubarDemoComponent extends AbstractDemoComponent<MenubarComponent> {
    readonly #injector = createFeatureInjector({
        groupTemplate: {
            code: `
                <mona-menu-item-group [title]="'History'">
                    <ng-template monaMenuGroupTemplate let-group>
                        <span class="px-2 text-violet-600">{{group}}</span>
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
                <mona-menu-item [text]="'Open'">
                    <ng-template monaMenuItemIconTemplate>
                        <lucide-angular [name]="openIcon" [size]="14"></lucide-angular>
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
        menuTextTemplate: {
            code: `
                <mona-menu text="File">
                    <ng-template monaMenuTextTemplate let-text let-items="items">
                        <div class="flex items-center gap-1.5">
                            <lucide-angular [name]="fileIcon" [size]="14"></lucide-angular>
                            <span>{{text}} ({{items.length}} items)</span>
                        </div>
                    </ng-template>
                </mona-menu>
            `,
            description: `This template is used to customize the text of the menu on the menubar.`,
            name: "Menu Text Template",
            active: false
        },
        shortcutTemplate: {
            code: `
                <mona-menu-item text="Undo">
                    <ng-template monaMenuItemShortcutTemplate>
                        <div class="flex items-center gap-1"><kbd>Ctrl</kbd> + <kbd>Z</kbd></div>
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
                <mona-menu-item [text]="'Paste'">
                    <ng-template monaMenuItemTextTemplate let-item>
                        <span class="italic text-rose-800">{{item.text}}</span>
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
                <mona-menubar>
                    <ng-template monaMenuItemIconTemplate let-item>
                        @if (item.text === "About") {
                            <lucide-angular [name]="infoIcon" [size]="14"></lucide-angular>
                        } @else {
                            <lucide-angular [name]="heartIcon" [size]="14" [color]="''|randomColor"></lucide-angular>
                        }
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the icons of all menu items.`,
            name: "Top Level Menu Item Icon Template",
            active: false
        },
        topLevelGroupTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuGroupTemplate let-group>
                        <span class="text-emerald-900 font-semibold px-2 underline">{{group}}</span>
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the title of all menu item groups.`,
            name: "Top Level Group Template",
            active: false
        },
        topLevelShortcutTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuItemShortcutTemplate let-item>
                        @if (item.text === "About") {
                            <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd></div>
                        }
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the shortcuts of all menu items.`,
            name: "Top Level Shortcut Template",
            active: false
        },
        topLevelTextTemplate: {
            code: `
                <mona-menubar>
                    <ng-template monaMenuItemTextTemplate let-menuItem>
                        <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                    </ng-template>
                </mona-menubar>
            `,
            description: `This template is used to customize the text of tall menu items.`,
            name: "Top Level Text Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<MenubarComponent>>({
        code: `
            <mona-menubar [size]="size()" [rounded]="rounded()">
                <mona-menu text="File">
                    <mona-menu-item text="New"></mona-menu-item>
                    <mona-menu-item text="Open">
                        <ng-template monaMenuItemIconTemplate>
                            <lucide-angular [name]="openIcon" [size]="14"></lucide-angular>
                        </ng-template>
                    </mona-menu-item>
                    <mona-menu-item text="Open Recent">
                        <mona-menu-item text="Document 1"></mona-menu-item>
                        <mona-menu-item text="Document 2">
                            <mona-menu-item text="Version 1"></mona-menu-item>
                            <mona-menu-item text="Version 2"></mona-menu-item>
                        </mona-menu-item>
                        <mona-menu-item text="Document 3"></mona-menu-item>
                    </mona-menu-item>
                    <mona-menu-item text="Save" [disabled]="true"></mona-menu-item>
                    <mona-menu-item text="Save As"></mona-menu-item>
                    <mona-menu-item text="Exit"></mona-menu-item>
                    <ng-template monaMenuTextTemplate let-text let-items="items">
                        <div class="flex items-center gap-1.5">
                            <lucide-angular [name]="fileIcon" [size]="14"></lucide-angular>
                            <span>{{text}} ({{items.length}} items)</span>
                        </div>
                    </ng-template>
                </mona-menu>
                <mona-menu text="Edit">
                    <mona-menu-item-group [title]="'History'">
                        <mona-menu-item text="Undo">
                            <ng-template monaMenuItemShortcutTemplate>
                                <div class="flex items-center gap-1"><kbd>Ctrl</kbd> + <kbd>Z</kbd></div>
                            </ng-template>
                        </mona-menu-item>
                        <mona-menu-item text="Redo"></mona-menu-item>
                        <ng-template monaMenuGroupTemplate let-group>
                            <span class="px-2 text-violet-600">{{group}}</span>
                        </ng-template>
                    </mona-menu-item-group>
                    <mona-menu-item [divider]="true"></mona-menu-item>
                    <mona-menu-item text="Cut"></mona-menu-item>
                    <mona-menu-item text="Copy"></mona-menu-item>
                    <mona-menu-item text="Paste">
                        <ng-template monaMenuItemTextTemplate let-item>
                            <span class="italic text-rose-800">{{item.text}}</span>
                        </ng-template>
                    </mona-menu-item>
                </mona-menu>
                <mona-menu text="View">
                    <mona-menu-item text="Zoom In"></mona-menu-item>
                    <mona-menu-item text="Zoom Out"></mona-menu-item>
                    <mona-menu-item text="Reset Zoom"></mona-menu-item>
                </mona-menu>
                <mona-menu text="Help">
                    <mona-menu-item text="Documentation"></mona-menu-item>
                    <mona-menu-item text="About"></mona-menu-item>
                </mona-menu>
                <ng-template monaMenuGroupTemplate let-group>
                    <span class="text-emerald-900 font-semibold px-2 underline">{{group}}</span>
                </ng-template>
                <ng-template monaMenuItemIconTemplate let-item>
                    @if (item.text === "About") {
                        <lucide-angular [name]="infoIcon" [size]="14"></lucide-angular>
                    } @else {
                        <lucide-angular [name]="heartIcon" [size]="14" [color]="''|randomColor"></lucide-angular>
                    }
                </ng-template>
                <ng-template monaMenuItemShortcutTemplate let-item>
                    @if (item.text === "About") {
                        <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd></div>
                    }
                </ng-template>
                <ng-template monaMenuItemTextTemplate let-menuItem>
                    <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                </ng-template>
            </mona-menubar>
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
        outputs: {
            menuItemClick: {
                type: "event"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("MenubarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "MenuComponent",
        "MenuItemComponent",
        "MenuItemGroupComponent"
    ]);
    protected readonly MenubarWrapperComponent = MenubarWrapperComponent;
}

@Component({
    imports: [
        MenubarComponent,
        MenuComponent,
        MenuItemComponent,
        MenuItemGroupComponent,
        MenuGroupTemplateDirective,
        MenuItemIconTemplateDirective,
        MenuItemShortcutTemplateDirective,
        MenuItemTextTemplateDirective,
        MenuTextTemplateDirective,
        LucideAngularModule,
        RandomColorPipe
    ],
    template: `
        @let featureData = features();
        <mona-menubar
            [disabled]="disabled()"
            [rounded]="rounded()"
            [size]="size()"
            (menuItemClick)="onMenuItemClick($event)">
            <mona-menu text="File">
                <mona-menu-item text="New"></mona-menu-item>
                <mona-menu-item text="Open">
                    @if (featureData["iconTemplate"].active) {
                        <ng-template monaMenuItemIconTemplate>
                            <lucide-angular [name]="openIcon" [size]="14"></lucide-angular>
                        </ng-template>
                    }
                </mona-menu-item>
                <mona-menu-item text="Open Recent">
                    <mona-menu-item text="Document 1"></mona-menu-item>
                    <mona-menu-item text="Document 2">
                        <mona-menu-item text="Version 1"></mona-menu-item>
                        <mona-menu-item text="Version 2"></mona-menu-item>
                    </mona-menu-item>
                    <mona-menu-item text="Document 3"></mona-menu-item>
                </mona-menu-item>
                <mona-menu-item text="Save" [disabled]="true"></mona-menu-item>
                <mona-menu-item text="Save As"></mona-menu-item>
                <mona-menu-item text="Exit"></mona-menu-item>
                @if (featureData["menuTextTemplate"].active) {
                    <ng-template monaMenuTextTemplate let-text let-items="items">
                        <div class="flex items-center gap-1.5">
                            <lucide-angular [name]="fileIcon" [size]="14"></lucide-angular>
                            <span>{{ text }} ({{ items.length }} items)</span>
                        </div>
                    </ng-template>
                }
            </mona-menu>
            <mona-menu text="Edit">
                <mona-menu-item-group [title]="'History'">
                    <mona-menu-item text="Undo">
                        @if (featureData["shortcutTemplate"].active) {
                            <ng-template monaMenuItemShortcutTemplate>
                                <div class="flex items-center gap-1"><kbd>Ctrl</kbd> + <kbd>Z</kbd></div>
                            </ng-template>
                        }
                    </mona-menu-item>
                    <mona-menu-item text="Redo"></mona-menu-item>
                    @if (featureData["groupTemplate"].active) {
                        <ng-template monaMenuGroupTemplate let-group>
                            <span class="px-2 text-violet-600">{{ group }}</span>
                        </ng-template>
                    }
                </mona-menu-item-group>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item text="Cut"></mona-menu-item>
                <mona-menu-item text="Copy"></mona-menu-item>
                <mona-menu-item text="Paste">
                    @if (featureData["textTemplate"].active) {
                        <ng-template monaMenuItemTextTemplate let-item>
                            <span class="italic text-rose-800">{{ item.text }}</span>
                        </ng-template>
                    }
                </mona-menu-item>
            </mona-menu>
            <mona-menu text="View">
                <mona-menu-item text="Zoom In"></mona-menu-item>
                <mona-menu-item text="Zoom Out"></mona-menu-item>
                <mona-menu-item text="Reset Zoom"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Help">
                <mona-menu-item text="Documentation"></mona-menu-item>
                <mona-menu-item text="About"></mona-menu-item>
            </mona-menu>
            @if (featureData["topLevelGroupTemplate"].active) {
                <ng-template monaMenuGroupTemplate let-group>
                    <span class="text-emerald-900 font-semibold px-2 underline">{{ group }}</span>
                </ng-template>
            }
            @if (featureData["topLevelIconTemplate"].active) {
                <ng-template monaMenuItemIconTemplate let-item>
                    @if (item.text === "About") {
                        <lucide-angular [name]="infoIcon" [size]="14"></lucide-angular>
                    } @else {
                        <lucide-angular [name]="heartIcon" [size]="14" [color]="'' | randomColor"></lucide-angular>
                    }
                </ng-template>
            }
            @if (featureData["topLevelShortcutTemplate"].active) {
                <ng-template monaMenuItemShortcutTemplate let-item>
                    @if (item.text === "About") {
                        <div class="flex items center gap-1"><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd></div>
                    }
                </ng-template>
            }
            @if (featureData["topLevelTextTemplate"].active) {
                <ng-template monaMenuItemTextTemplate let-menuItem>
                    <span [style.color]="'' | randomColor">{{ menuItem.text }}</span>
                </ng-template>
            }
        </mona-menubar>
    `
})
class MenubarWrapperComponent implements ComponentInputsAsSignal<MenubarComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly fileIcon = File;
    protected readonly heartIcon = HeartIcon;
    protected readonly infoIcon = Info;
    protected readonly openIcon = FolderOpen;
    public readonly disabled = input(false);
    public readonly size = input<ReturnType<MenubarComponent["size"]>>("medium");
    public readonly rounded = input<ReturnType<MenubarComponent["rounded"]>>("medium");

    public onMenuItemClick(event: MenuItemClickEvent): void {
        console.log(event);
    }
}
