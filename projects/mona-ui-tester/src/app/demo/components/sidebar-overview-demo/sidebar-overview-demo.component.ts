import { Component, computed, inject, Injector, linkedSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    LucideCalendar,
    LucideCommand,
    LucideDynamicIcon,
    LucideHouse,
    LucideInbox,
    LucidePanelLeft,
    LucideSettings
} from "@lucide/angular";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarFooterDirective,
    SidebarHeaderDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarRailDirective,
    SidebarSeparatorDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigInputType } from "../../utils/componentConfig";
import {
    DemoEventLog,
    DemoPart,
    DemoPartValues,
    readPartValues,
    reconcilePartValues,
    staticPart
} from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";

/** The rows of the playground's menu, which only the Sidebar Menus page lets you change. */
const PAGES = [
    { icon: LucideHouse, iconName: "lucideHouse", label: "Home" },
    { icon: LucideInbox, iconName: "lucideInbox", label: "Inbox" },
    { icon: LucideCalendar, iconName: "lucideCalendar", label: "Calendar" },
    { icon: LucideSettings, iconName: "lucideSettings", label: "Settings" }
] as const;

const NAV_CODE = [
    '<nav monaSidebarContent aria-label="Main">',
    "    <ul monaSidebarMenu>",
    ...PAGES.flatMap((page, index) => [
        `        <li monaSidebarMenuItem${index === 0 ? ' [active]="true"' : ""}>`,
        `            <a monaSidebarMenuButton href="/${page.label.toLowerCase()}" tooltip="${page.label}">`,
        `                <svg ${page.iconName} [size]="16"></svg>`,
        `                <span>${page.label}</span>`,
        "            </a>",
        "        </li>"
    ]),
    "    </ul>",
    "</nav>"
].join("\n");

const TRIGGER_CODE = [
    '<button monaButton monaSidebarTrigger aria-label="Toggle sidebar" look="ghost" [iconOnly]="true">',
    '    <svg lucidePanelLeft [size]="16"></svg>',
    "</button>"
].join("\n");

/**
 * The playground of the Sidebar page. It covers the layout and the panel: its regions, its look, its width and its
 * side. Rows have their own playground on Sidebar Menus, and state on Sidebar State & Behavior. It shares nothing with
 * them.
 */
@Component({
    selector: "app-sidebar-overview-demo",
    imports: [
        AvatarComponent,
        ButtonDirective,
        LucideCommand,
        LucideDynamicIcon,
        LucidePanelLeft,
        PartsDemoContainerComponent,
        SidebarComponent,
        SidebarContentDirective,
        SidebarFooterDirective,
        SidebarHeaderDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarRailDirective,
        SidebarSeparatorDirective,
        SidebarTriggerDirective
    ],
    templateUrl: "./sidebar-overview-demo.component.html"
})
export class SidebarOverviewDemoComponent {
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #sidebarFeatures = createFeatureInjector(
        {
            header: {
                name: "Header",
                description: "A region pinned above the scrolling content, here with a workspace row.",
                active: true,
                codePosition: "start",
                code: `
                    <header monaSidebarHeader>
                        <ul monaSidebarMenu>
                            <li monaSidebarMenuItem>
                                <button monaSidebarMenuButton tooltip="Acme Inc.">
                                    <svg lucideCommand [size]="16"></svg>
                                    <span class="font-semibold">Acme Inc.</span>
                                </button>
                            </li>
                        </ul>
                    </header>`
            },
            separator: {
                name: "Separator",
                description: "A rule between the header and the content.",
                active: true,
                codePosition: "start",
                code: `<div monaSidebarSeparator></div>`
            },
            footer: {
                name: "Footer",
                description:
                    "A region pinned below the scrolling content, here with a profile row. The row's size is large, " +
                    "so the avatar fills the icon rail's square.",
                active: true,
                code: `
                    <footer monaSidebarFooter>
                        <ul monaSidebarMenu>
                            <li monaSidebarMenuItem>
                                <button monaSidebarMenuButton size="large" tooltip="Grace Hopper">
                                    <mona-avatar label="GH" [width]="32" [height]="32"></mona-avatar>
                                    <span>Grace Hopper</span>
                                </button>
                            </li>
                        </ul>
                    </footer>`
            },
            rail: {
                name: "Rail",
                description:
                    "A strip along the panel's inner edge that toggles it with a click. It isn't in the tab order, " +
                    "so keep the trigger as well.",
                active: true,
                code: `<button monaSidebarRail></button>`
            }
        },
        inject(Injector)
    ).get(FeatureConfigHandler);
    protected readonly eventLog = new DemoEventLog();
    protected readonly layout = computed(() =>
        readPartValues<SidebarLayoutComponent>(this.#part("layout"), this.values())
    );
    protected readonly pages = PAGES;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const layoutMetadata = metadata["SidebarLayoutComponent"] ?? emptyMetadata();
        const sidebarMetadata = metadata["SidebarComponent"] ?? emptyMetadata();
        return [
            {
                id: "layout",
                title: "Layout",
                metadata: layoutMetadata,
                codeAttributes: ['class="h-112"', 'modalScope="layout"'],
                config: { inputs: deriveInputConfig<SidebarLayoutComponent>(layoutMetadata, layoutOverrides()) }
            },
            {
                id: "sidebar",
                title: "Sidebar",
                metadata: sidebarMetadata,
                codeContent: [NAV_CODE],
                config: {
                    inputs: deriveInputConfig<SidebarComponent>(sidebarMetadata, sidebarOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#sidebarFeatures
                }
            },
            staticPart("inset", "[monaSidebarInset]", { codeContent: [TRIGGER_CODE], element: "main" })
        ];
    });
    /** The panels come from metadata that loads after the page; until then the sidebar would get no settings. */
    protected readonly ready = computed(() =>
        this.parts().every(part => part.panel === false || (part.metadata.inputs ?? []).length > 0)
    );
    protected readonly sidebar = computed(() => readPartValues<SidebarComponent>(this.#part("sidebar"), this.values()));
    protected readonly sidebarFeatures = this.#sidebarFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

/** Only the breakpoint: how far the drawer's modality reaches is on Sidebar State & Behavior. */
function layoutOverrides(): Partial<ComponentConfigInputType<SidebarLayoutComponent>> {
    return {
        mobileBreakpoint: {
            type: "number",
            value: 768,
            min: 0,
            nullable: false,
            note: "The window width below which the sidebar is a drawer. Set it above your window's width to see one, or 0 to never get one."
        },
        modalScope: undefined,
        userClass: undefined
    };
}

/** The panel's look, width, side and name. Its state has a page of its own. */
function sidebarOverrides(): Partial<ComponentConfigInputType<SidebarComponent>> {
    return {
        ariaLabel: {
            type: "string",
            value: "",
            note: "Names the sidebar. Needed with a role, and names the drawer, which otherwise has a localized default."
        },
        ariaLabelledBy: undefined,
        collapsible: {
            type: "dropdown",
            value: ["offcanvas", "icon", "none"],
            defaultValue: "icon",
            note: "What collapsing does. Toggle the sidebar with the trigger or the rail to see it."
        },
        expanded: undefined,
        iconWidth: { type: "string", value: "3rem", note: "The icon rail's width, with collapsible set to icon." },
        id: undefined,
        mobileWidth: { type: "string", value: "18rem", note: "The drawer's width." },
        persistKey: undefined,
        role: {
            type: "string",
            value: "",
            note: 'Leave it empty while the sidebar holds more than navigation. Set "navigation" with a name otherwise.'
        },
        userClass: undefined,
        width: { type: "string", value: "16rem", note: "A CSS length, or a number of pixels when bound as a number." }
    };
}
