import { Component, computed, inject, linkedSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { LucideDynamicIcon, LucideHouse, LucideSettings, LucideUsers } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
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
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { SidebarStateReadoutComponent } from "./sidebar-state-readout.component";

type SidebarId = "inspector" | "nav";

const PAGES = [
    { icon: LucideHouse, iconName: "lucideHouse", label: "Home" },
    { icon: LucideUsers, iconName: "lucideUsers", label: "Team" },
    { icon: LucideSettings, iconName: "lucideSettings", label: "Settings" }
] as const;

const NAV_CODE = [
    '<nav monaSidebarContent aria-label="Workspace">',
    "    <ul monaSidebarMenu>",
    ...PAGES.flatMap(page => [
        "        <li monaSidebarMenuItem>",
        `            <a monaSidebarMenuButton href="/${page.label.toLowerCase()}" tooltip="${page.label}">`,
        `                <svg ${page.iconName} [size]="16"></svg>`,
        `                <span>${page.label}</span>`,
        "            </a>",
        "        </li>"
    ]),
    "    </ul>",
    "</nav>"
].join("\n");

const INSPECTOR_CODE = [
    '<div monaSidebarContent class="p-3 text-sm">',
    '    <p class="font-semibold">Website redesign</p>',
    "    <p>Owner: Grace Hopper</p>",
    "</div>"
].join("\n");

const TRIGGERS_CODE = [
    '<button monaButton monaSidebarTrigger for="nav">Navigation</button>',
    '<button monaButton monaSidebarTrigger for="inspector">Details</button>'
].join("\n");

/**
 * The playground of the Sidebar State & Behavior page: two sidebars, each with its own state, the triggers that name
 * them, what `injectSidebar()` reports for each, and the drawer they become below the breakpoint. It shares nothing
 * with the other sidebar playgrounds.
 */
@Component({
    selector: "app-sidebar-state-demo",
    imports: [
        ButtonDirective,
        LucideDynamicIcon,
        PartsDemoContainerComponent,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarStateReadoutComponent,
        SidebarTriggerDirective
    ],
    templateUrl: "./sidebar-state-demo.component.html"
})
export class SidebarStateDemoComponent {
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    protected readonly eventLog = new DemoEventLog();
    protected readonly inspector = computed(() =>
        readPartValues<SidebarComponent>(this.#part("inspector"), this.values())
    );
    protected readonly layout = computed(() =>
        readPartValues<SidebarLayoutComponent>(this.#part("layout"), this.values())
    );
    protected readonly nav = computed(() => readPartValues<SidebarComponent>(this.#part("nav"), this.values()));
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
                codeAttributes: ['class="h-112"'],
                config: {
                    inputs: deriveInputConfig<SidebarLayoutComponent>(layoutMetadata, layoutOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "nav",
                title: "Navigation sidebar",
                metadata: sidebarMetadata,
                codeAttributes: ['id="nav"'],
                codeContent: [NAV_CODE],
                config: {
                    inputs: deriveInputConfig<SidebarComponent>(sidebarMetadata, sidebarOverrides("icon", true), {
                        resolveAliases: true
                    })
                }
            },
            staticPart("inset", "[monaSidebarInset]", { codeContent: [TRIGGERS_CODE], element: "main" }),
            {
                id: "inspector",
                title: "Details sidebar",
                metadata: sidebarMetadata,
                codeAttributes: ['id="inspector"', 'aria-label="Details"', 'side="end"'],
                codeContent: [INSPECTOR_CODE],
                config: {
                    inputs: deriveInputConfig<SidebarComponent>(sidebarMetadata, sidebarOverrides("offcanvas", false), {
                        resolveAliases: true
                    })
                }
            }
        ];
    });
    /** The panels come from metadata that loads after the page; until then the sidebars would get no settings. */
    protected readonly ready = computed(() =>
        this.parts().every(part => part.panel === false || (part.metadata.inputs ?? []).length > 0)
    );
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onExpandedChange(id: SidebarId, expanded: boolean): void {
        this.values.update(values => ({ ...values, [id]: { ...values[id], expanded } }));
        this.eventLog.record(`${id} expandedChange`, expanded);
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
            note: "Set it above your window's width to turn both sidebars into drawers, of which one opens at a time."
        },
        modalScope: {
            type: "dropdown",
            value: ["page", "layout"],
            defaultValue: "layout",
            note: "With page, an open drawer makes everything else inert, this panel too: close it with Escape or the backdrop."
        },
        userClass: undefined
    };
}

/** The state of one sidebar. Its look has a page of its own. */
function sidebarOverrides(
    collapsible: "icon" | "offcanvas",
    expanded: boolean
): Partial<ComponentConfigInputType<SidebarComponent>> {
    return {
        ariaLabel: undefined,
        ariaLabelledBy: undefined,
        collapsible: {
            type: "dropdown",
            value: ["offcanvas", "icon", "none"],
            defaultValue: collapsible,
            note: "What collapsing does. With none, a trigger has nothing to do while the sidebar is docked."
        },
        expanded: {
            type: "boolean",
            value: expanded,
            note: "Bound both ways: the triggers, the rail and toggle() change it too. On a drawer it reports the drawer."
        },
        iconWidth: undefined,
        id: undefined,
        mobileWidth: undefined,
        persistKey: {
            type: "string",
            value: "",
            note: "Type a key, change the state, and reload the page: it comes back that way. Only the docked state is kept."
        },
        role: undefined,
        side: undefined,
        userClass: undefined,
        variant: undefined,
        width: undefined
    };
}
