import { NgComponentOutlet } from "@angular/common";
import { Component, signal } from "@angular/core";
import {
    LucideAudioWaveform,
    LucideCirclePlus,
    LucideCommand,
    LucideDynamicIcon,
    LucideGalleryVerticalEnd,
    LucideHouse,
    LucideLayers,
    LucidePalette,
    LucidePlus
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";
import { PopupComponent } from "@nanahoshi/mona-ui/popup";
import {
    SidebarContentDirective,
    SidebarFooterDirective,
    SidebarGroupActionDirective,
    SidebarGroupContentDirective,
    SidebarGroupDirective,
    SidebarGroupHeaderDirective,
    SidebarGroupLabelDirective,
    SidebarHeaderDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective
} from "@nanahoshi/mona-ui/sidebar";
import type { ComponentConfig } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-sidebar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./sidebar-demo.component.html"
})
export class SidebarDemoComponent extends AbstractDemoComponent<SidebarLayoutComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<SidebarLayoutComponent>>({
        inputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SidebarLayoutComponent");
    protected readonly SidebarLayoutWrapperComponent = SidebarLayoutWrapperComponent;
}

@Component({
    imports: [
        SidebarLayoutComponent,
        SidebarHeaderDirective,
        ButtonDirective,
        LucideLayers,
        PopupComponent,
        SidebarFooterDirective,
        LucideDynamicIcon,
        SidebarContentDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        ExpansionPanelComponent,
        SidebarGroupDirective,
        SidebarGroupLabelDirective,
        SidebarGroupContentDirective,
        SidebarGroupActionDirective,
        LucideCirclePlus,
        SidebarGroupHeaderDirective,
        SidebarMenuButtonDirective,
        LucideHouse,
        LucideGalleryVerticalEnd,
        LucidePalette
    ],
    template: `
        <mona-sidebar-layout class="h-150 border border-border">
            <header monaSidebarHeader>
                <button monaButton look="ghost" class="w-full h-auto p-0 py-1 cursor-default" #headerMenu>
                    <div class="flex w-full h-full">
                        <div class="flex w-10 aspect-square items-center justify-center">
                            <svg lucideLayers [size]="16"></svg>
                        </div>
                        <div class="flex flex-col items-start flex-1">
                            <span class="text-sm">Nanahoshi</span>
                            <span class="text-xs font-normal">Mona UI</span>
                        </div>
                    </div>
                </button>
                <mona-popup
                    [anchor]="headerMenu"
                    [anchorConnectionPoint]="'topright'"
                    [popupConnectionPoint]="'topleft'">
                    <div class="w-64 rounded-xl border border-border bg-surface-raised p-1.5 shadow-sm font-sans">
                        <div class="px-2 py-1.5 text-xs font-normal text-foreground">Teams</div>
                        <div class="space-y-1">
                            @for (item of headerMenuItems; track $index) {
                                <button
                                    class="flex w-full items-center justify-between rounded-lg p-1.5 hover:bg-accent transition-colors text-left group cursor-pointer">
                                    <div class="flex items-center gap-2.5">
                                        <div
                                            class="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-foregroud shadow-xs">
                                            <svg [lucideIcon]="item.icon" [size]="18" />
                                        </div>
                                        <span class="text-sm font-medium text-foregroud">{{ item.label }}</span>
                                    </div>
                                </button>
                                @if ($index === $count - 2) {
                                    <div class="my-1.5 h-px bg-accent"></div>
                                }
                            }
                        </div>
                    </div>
                </mona-popup>
            </header>
            <div monaSidebarContent>
                <div monaSidebarGroup>
                    <div monaSidebarGroupHeader>
                        <div monaSidebarGroupLabel>Getting Started</div>
                        <button monaButton [iconOnly]="true" look="ghost" monaSidebarGroupAction>
                            <svg lucidePlusCircle [size]="14"></svg>
                        </button>
                    </div>
                    <div monaSidebarGroupContent>
                        <ul monaSidebarMenu>
                            <li monaSidebarMenuItem>
                                <button monaButton monaSidebarMenuButton>
                                    <svg lucideHome [size]="14"></svg>
                                    <span>Introduction</span>
                                </button>
                            </li>
                            <li monaSidebarMenuItem>
                                <button monaButton monaSidebarMenuButton>
                                    <svg lucideGalleryVerticalEnd [size]="14"></svg>
                                    <span>Installation</span>
                                </button>
                            </li>
                            <li monaSidebarMenuItem>
                                <button monaButton monaSidebarMenuButton>
                                    <svg lucidePalette [size]="14"></svg>
                                    <span>Theming</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <footer monaSidebarFooter>
                <p>FOOTER</p>
            </footer>
        </mona-sidebar-layout>
    `
})
export class SidebarLayoutWrapperComponent {
    protected readonly headerMenuItems = [
        { label: "Nanahoshi Inc.", icon: LucideGalleryVerticalEnd },
        { label: "Nanahoshi Corp.", icon: LucideAudioWaveform },
        { label: "Mona UI", icon: LucideCommand },
        { label: "Add team", icon: LucidePlus }
    ];
}
