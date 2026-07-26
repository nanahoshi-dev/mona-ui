import { NgComponentOutlet } from "@angular/common";
import { Component, signal } from "@angular/core";
import {
    LucideAudioWaveform,
    LucideBell,
    LucideCalendar,
    LucideChevronDown,
    LucideChevronRight,
    LucideCirclePlus,
    LucideCircleUser,
    LucideCommand,
    LucideCreditCard,
    LucideDatabase,
    LucideDynamicIcon,
    LucideEllipsis,
    LucideGalleryHorizontalEnd,
    LucideGalleryVerticalEnd,
    LucideHouse,
    LucideList,
    LucideLogOut,
    LucidePalette,
    LucidePanelLeft,
    LucidePlus,
    LucideSparkles,
    LucideSquarePen
} from "@lucide/angular";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import { PopupComponent } from "@nanahoshi/mona-ui/popup";
import {
    PopupMenuComponent,
    PopupMenuIconTemplateDirective,
    PopupMenuItemComponent,
    PopupMenuSeparatorComponent
} from "@nanahoshi/mona-ui/popup-menu";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarFooterDirective,
    SidebarGroupActionDirective,
    SidebarGroupContentDirective,
    SidebarGroupDirective,
    SidebarGroupHeaderDirective,
    SidebarGroupLabelDirective,
    SidebarHeaderDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuActionDirective,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuBadgeDirective,
    SidebarMenuItemDirective,
    SidebarMenuSubDirective,
    SidebarRailDirective,
    SidebarSeparatorDirective,
    SidebarTriggerDirective
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
        SidebarComponent,
        SidebarInsetDirective,
        SidebarTriggerDirective,
        SidebarRailDirective,
        SidebarSeparatorDirective,
        SidebarMenuBadgeDirective,
        LucidePanelLeft,
        SidebarHeaderDirective,
        ButtonDirective,
        PopupComponent,
        SidebarFooterDirective,
        LucideDynamicIcon,
        SidebarContentDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarGroupDirective,
        SidebarGroupLabelDirective,
        SidebarGroupContentDirective,
        SidebarGroupActionDirective,
        LucideCirclePlus,
        SidebarGroupHeaderDirective,
        SidebarMenuButtonDirective,
        LucideHouse,
        LucideGalleryVerticalEnd,
        LucidePalette,
        SidebarMenuActionDirective,
        LucideEllipsis,
        PopupMenuComponent,
        PopupMenuItemComponent,
        LucideCalendar,
        LucideSquarePen,
        LucideDatabase,
        AvatarComponent,
        PopupMenuSeparatorComponent,
        PopupMenuIconTemplateDirective,
        LucideSparkles,
        LucideCircleUser,
        LucideCreditCard,
        LucideBell,
        LucideLogOut,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        CollapsibleContentDirective,
        SidebarMenuSubDirective,
        LucideGalleryHorizontalEnd,
        LucideChevronDown,
        LucideChevronRight,
        LucideList
    ],
    template: `
        <mona-sidebar-layout class="h-150 border border-border">
            <mona-sidebar collapsible="icon" variant="floating">
                <header monaSidebarHeader>
                    <ul monaSidebarMenu class="px-0!">
                        <li monaSidebarMenuItem #headerMenu>
                            <button monaSidebarMenuButton class="flex items-center gap-1">
                                <span class="text-md font-semibold">Nanahoshi</span>
                                <svg lucideChevronDown [size]="14"></svg>
                            </button>
                        </li>
                    </ul>
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
                <div monaSidebarSeparator></div>
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
                                    <button monaSidebarMenuButton tooltip="Introduction">
                                        <svg lucideHome [size]="14"></svg>
                                        <span>Introduction</span>
                                        <span monaSidebarMenuBadge>12</span>
                                    </button>
                                    <button monaSidebarMenuAction #introItem>
                                        <svg lucideEllipsis [size]="14"></svg>
                                    </button>
                                    <mona-popup-menu [target]="introItem">
                                        <mona-popup-menu-item label="Edit"></mona-popup-menu-item>
                                        <mona-popup-menu-item label="Delete"></mona-popup-menu-item>
                                    </mona-popup-menu>
                                </li>
                                <li monaSidebarMenuItem>
                                    <button monaSidebarMenuButton>
                                        <svg lucideGalleryVerticalEnd [size]="14"></svg>
                                        <span>Installation</span>
                                    </button>
                                </li>
                                <li monaSidebarMenuItem>
                                    <button monaSidebarMenuButton>
                                        <svg lucidePalette [size]="14"></svg>
                                        <span>Theming</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div monaSidebarGroup>
                        <div monaSidebarGroupHeader>
                            <div monaSidebarGroupLabel>Components</div>
                        </div>
                        <div monaSidebarGroupContent>
                            <ul monaSidebarMenu>
                                <li monaSidebarMenuItem>
                                    <button monaSidebarMenuButton>
                                        <svg lucideCalendar [size]="14"></svg>
                                        <span>Calendar</span>
                                    </button>
                                </li>
                                <li monaSidebarMenuItem>
                                    <button monaSidebarMenuButton>
                                        <svg lucideEdit [size]="14"></svg>
                                        <span>Editor</span>
                                    </button>
                                </li>
                                <li monaSidebarMenuItem>
                                    <button monaSidebarMenuButton>
                                        <svg lucideDatabase [size]="14"></svg>
                                        <span>Grid</span>
                                    </button>
                                </li>
                            </ul>
                            <ul monaSidebarMenu>
                                <li monaSidebarMenuItem monaCollapsible #lists="monaCollapsible">
                                    <button monaSidebarMenuButton monaCollapsibleTrigger>
                                        <svg lucideList [size]="14"></svg>
                                        <span>Lists</span>
                                        <svg
                                            lucideChevronRight
                                            [size]="14"
                                            class="ms-auto transition-transform"
                                            [style.rotate]="lists.expanded() ? '90deg' : '0deg'"></svg>
                                    </button>
                                    <ul monaSidebarMenuSub monaCollapsibleContent>
                                        <li monaSidebarMenuItem>
                                            <button monaSidebarMenuButton>
                                                <svg lucideGalleryHorizontalEnd [size]="14"></svg>
                                                <span>List Box</span>
                                            </button>
                                        </li>
                                        <li monaSidebarMenuItem>
                                            <button monaSidebarMenuButton>
                                                <svg lucideGalleryHorizontalEnd [size]="14"></svg>
                                                <span>List View</span>
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <footer class="flex" monaSidebarFooter>
                    <ul class="px-0!" monaSidebarMenu>
                        <li monaSidebarMenuItem>
                            <button monaSidebarMenuButton #profile>
                                <div class="flex items-center gap-2">
                                    <mona-avatar
                                        [width]="32"
                                        [height]="32"
                                        label="NH"
                                        labelFontSize="0.8em"
                                        backgroundColor="black"
                                        borderRadius="100%"
                                        labelColor="white"></mona-avatar>
                                    <div class="flex flex-col justify-start flex-1">
                                        <p class="text-left font-semibold">Nanahoshi</p>
                                        <p class="font-light">nanahoshi&#64;nanahoshi.dev</p>
                                    </div>
                                </div>
                            </button>
                            <mona-popup-menu
                                [target]="profile"
                                [anchorConnectionPoint]="'bottomright'"
                                [popupConnectionPoint]="'bottomleft'">
                                <mona-popup-menu-item label="Upgrade to Pro">
                                    <ng-template monaPopupMenuIconTemplate>
                                        <svg lucideSparkles [size]="14"></svg>
                                    </ng-template>
                                </mona-popup-menu-item>
                                <mona-popup-menu-separator></mona-popup-menu-separator>
                                <mona-popup-menu-item label="Account">
                                    <ng-template monaPopupMenuIconTemplate>
                                        <svg lucideCircleUser [size]="14"></svg>
                                    </ng-template>
                                </mona-popup-menu-item>
                                <mona-popup-menu-item label="Billing">
                                    <ng-template monaPopupMenuIconTemplate>
                                        <svg lucideCreditCard [size]="14"></svg>
                                    </ng-template>
                                </mona-popup-menu-item>
                                <mona-popup-menu-item label="Notifications">
                                    <ng-template monaPopupMenuIconTemplate>
                                        <svg lucideBell [size]="14"></svg>
                                    </ng-template>
                                </mona-popup-menu-item>
                                <mona-popup-menu-separator></mona-popup-menu-separator>
                                <mona-popup-menu-item label="Log out">
                                    <ng-template monaPopupMenuIconTemplate>
                                        <svg lucideLogOut [size]="14"></svg>
                                    </ng-template>
                                </mona-popup-menu-item>
                            </mona-popup-menu>
                        </li>
                    </ul>
                </footer>
                <button monaSidebarRail aria-label="Toggle sidebar"></button>
            </mona-sidebar>
            <main monaSidebarInset class="items-center justify-center">
                <button monaButton monaSidebarTrigger look="ghost" [iconOnly]="true" aria-label="Toggle sidebar">
                    <svg lucidePanelLeft [size]="16"></svg>
                </button>
            </main>
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
