import { Component, computed, inject, Injector, linkedSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    LucideChevronRight,
    LucideEllipsis,
    LucideFolder,
    LucideInbox,
    LucidePanelLeft,
    LucideSend
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import { PopupMenuComponent, PopupMenuItemComponent } from "@nanahoshi/mona-ui/popup-menu";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInputDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuActionDirective,
    SidebarMenuBadgeDirective,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarMenuSkeletonComponent,
    SidebarMenuSubDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import {
    DemoEventLog,
    DemoPart,
    DemoPartValues,
    readPartValues,
    reconcilePartValues,
    staticPart
} from "../../utils/demoParts";
import { deriveInputConfig, OPTIONAL_BOOLEAN_CHOICES } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";

const NAV = 'nav monaSidebarContent aria-label="Mail"';
const MENU = "ul monaSidebarMenu";

const SENT_CODE = [
    '<a monaSidebarMenuButton href="/mail/sent" tooltip="Sent">',
    '    <svg lucideSend [size]="16"></svg>',
    "    <span>Sent</span>",
    "</a>"
].join("\n");

const PROJECTS_CODE = [
    '<button monaSidebarMenuButton monaCollapsibleTrigger tooltip="Projects">',
    '    <svg lucideFolder [size]="16"></svg>',
    "    <span>Projects</span>",
    "</button>",
    "<ul monaSidebarMenuSub monaCollapsibleContent>",
    "    <li monaSidebarMenuItem>",
    '        <a monaSidebarMenuButton href="/projects/website">Website</a>',
    "    </li>",
    "    <li monaSidebarMenuItem>",
    '        <a monaSidebarMenuButton href="/projects/mobile">Mobile app</a>',
    "    </li>",
    "</ul>"
].join("\n");

const TRIGGER_CODE = [
    '<button monaButton monaSidebarTrigger aria-label="Toggle sidebar" look="ghost" [iconOnly]="true">',
    '    <svg lucidePanelLeft [size]="16"></svg>',
    "</button>"
].join("\n");

/**
 * The playground of the Sidebar Menus page. It covers a row — its item, its control, a badge and a trailing action —
 * a submenu, a search input and a loading row, in and out of the icon rail. It shares nothing with the other sidebar
 * playgrounds.
 */
@Component({
    selector: "app-sidebar-menus-demo",
    imports: [
        ButtonDirective,
        CollapsibleContentDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        LucideChevronRight,
        LucideEllipsis,
        LucideFolder,
        LucideInbox,
        LucidePanelLeft,
        LucideSend,
        PartsDemoContainerComponent,
        PopupMenuComponent,
        PopupMenuItemComponent,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInputDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuActionDirective,
        SidebarMenuBadgeDirective,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuSkeletonComponent,
        SidebarMenuSubDirective,
        SidebarTriggerDirective
    ],
    templateUrl: "./sidebar-menus-demo.component.html"
})
export class SidebarMenusDemoComponent {
    readonly #itemFeatures = this.#features({
        badge: {
            name: "Badge",
            description: "A trailing count inside the row's highlight. It stands down on the icon rail.",
            active: true,
            code: `<span monaSidebarMenuBadge>12</span>`
        },
        action: {
            name: "Trailing action",
            description:
                "An icon-only button at the end of the row, here opening a menu. It needs an aria-label, and stands " +
                "down on the icon rail.",
            active: true,
            code: `
                <button #inboxActions monaSidebarMenuAction aria-label="Inbox actions">
                    <svg lucideEllipsis [size]="14"></svg>
                </button>
                <mona-popup-menu [target]="inboxActions">
                    <mona-popup-menu-item label="Mark all as read"></mona-popup-menu-item>
                </mona-popup-menu>`
        }
    });
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #sidebarFeatures = this.#features({
        search: {
            name: "Search input",
            description: "A text input sized for the sidebar, above the menu. It stands down on the icon rail.",
            active: false,
            codePosition: "start",
            code: `<input monaSidebarInput aria-label="Search mail" placeholder="Search" />`
        }
    });
    protected readonly button = computed(() =>
        readPartValues<SidebarMenuButtonDirective>(this.#part("button"), this.values())
    );
    protected readonly eventLog = new DemoEventLog();
    protected readonly item = computed(() =>
        readPartValues<SidebarMenuItemDirective>(this.#part("item"), this.values())
    );
    protected readonly itemFeatures = this.#itemFeatures.data;
    protected readonly layout = computed(() =>
        readPartValues<SidebarLayoutComponent>(this.#part("layout"), this.values())
    );
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const layoutMetadata = metadata["SidebarLayoutComponent"] ?? emptyMetadata();
        const sidebarMetadata = metadata["SidebarComponent"] ?? emptyMetadata();
        const itemMetadata = metadata["SidebarMenuItemDirective"] ?? emptyMetadata();
        const buttonMetadata = metadata["SidebarMenuButtonDirective"] ?? emptyMetadata();
        const skeletonMetadata = metadata["SidebarMenuSkeletonComponent"] ?? emptyMetadata();
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
                config: {
                    inputs: deriveInputConfig<SidebarComponent>(sidebarMetadata, sidebarOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#sidebarFeatures
                }
            },
            {
                id: "item",
                title: "Inbox item",
                metadata: itemMetadata,
                parent: "sidebar",
                wrappers: [NAV, MENU],
                config: {
                    inputs: deriveInputConfig<SidebarMenuItemDirective>(itemMetadata, itemOverrides()),
                    featureHandler: this.#itemFeatures
                }
            },
            {
                id: "button",
                title: "Inbox button",
                metadata: buttonMetadata,
                parent: "item",
                codeAttributes: ['href="/mail/inbox"'],
                codeContent: ['<svg lucideInbox [size]="16"></svg>', "<span>Inbox</span>"],
                config: {
                    inputs: deriveInputConfig<SidebarMenuButtonDirective>(buttonMetadata, buttonOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            staticPart("sent", "li[monaSidebarMenuItem]", {
                codeContent: [SENT_CODE],
                parent: "sidebar",
                wrappers: [NAV, MENU]
            }),
            staticPart("projects", "li[monaSidebarMenuItem]", {
                codeAttributes: ["monaCollapsible"],
                codeContent: [PROJECTS_CODE],
                parent: "sidebar",
                wrappers: [NAV, MENU]
            }),
            {
                id: "skeleton",
                title: "Loading row",
                metadata: skeletonMetadata,
                parent: "sidebar",
                wrappers: [NAV, 'ul monaSidebarMenu aria-busy="true"', "li monaSidebarMenuItem"],
                config: {
                    inputs: deriveInputConfig<SidebarMenuSkeletonComponent>(skeletonMetadata, skeletonOverrides())
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
    protected readonly skeleton = computed(() =>
        readPartValues<SidebarMenuSkeletonComponent>(this.#part("skeleton"), this.values())
    );
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onExpandedChange(expanded: boolean): void {
        this.values.update(values => ({ ...values, sidebar: { ...values["sidebar"], expanded } }));
        this.eventLog.record("expandedChange", expanded);
    }

    /** Stands in for the router, so the playground stays on this page. A disabled row never gets here. */
    protected onRowClick(event: Event, label: string): void {
        event.preventDefault();
        this.eventLog.record("click", label);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function layoutOverrides(): Partial<ComponentConfigInputType<SidebarLayoutComponent>> {
    return {
        mobileBreakpoint: {
            type: "number",
            value: 768,
            min: 0,
            nullable: false,
            note: "Set it above your window's width to get a drawer, where activating a row closes it unless closeOnSelect is off."
        },
        modalScope: undefined,
        userClass: undefined
    };
}

/** Only what changes how the rows look: the icon rail, and whether the sidebar is collapsed to it. */
function sidebarOverrides(): Partial<ComponentConfigInputType<SidebarComponent>> {
    return {
        ariaLabel: undefined,
        ariaLabelledBy: undefined,
        collapsible: {
            type: "dropdown",
            value: ["offcanvas", "icon", "none"],
            defaultValue: "icon",
            note: "With icon, collapsing leaves each row's icon, and its tooltip names it."
        },
        expanded: { type: "boolean", value: true, note: "Turn it off to see the rows on the icon rail." },
        iconWidth: undefined,
        id: undefined,
        mobileWidth: undefined,
        persistKey: undefined,
        role: undefined,
        side: undefined,
        userClass: undefined,
        variant: undefined,
        width: undefined
    };
}

function itemOverrides(): Partial<ComponentConfigInputType<SidebarMenuItemDirective>> {
    return {
        active: {
            type: "boolean",
            value: true,
            note: "Marks the current page. The item owns the highlight, and its control gets aria-current."
        },
        userClass: undefined
    };
}

function buttonOverrides(): Partial<ComponentConfigInputType<SidebarMenuButtonDirective>> {
    return {
        closeOnSelect: {
            type: "customDropdown",
            value: OPTIONAL_BOOLEAN_CHOICES,
            textField: "text",
            valueField: "value",
            defaultValue: undefined,
            note: "Whether activating the row closes the drawer. Automatic closes it, except on a submenu's row."
        },
        disabled: {
            type: "boolean",
            value: false,
            note: "Suppresses the click handler too: the Events tab stays empty."
        },
        size: { type: "dropdown", value: ["medium", "large"], defaultValue: "medium" },
        tooltip: {
            type: "string",
            value: "Inbox",
            note: "Names the row on the icon rail, where its label is clipped."
        },
        userClass: undefined
    };
}

function skeletonOverrides(): Partial<ComponentConfigInputType<SidebarMenuSkeletonComponent>> {
    return {
        labelWidth: {
            type: "string",
            value: "60%",
            note: "A CSS length, or a number of pixels when bound as a number."
        },
        showIcon: { type: "boolean", value: true }
    };
}
