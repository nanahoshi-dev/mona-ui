import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { LucideBookOpen, LucideSearch, LucideSparkles } from "@lucide/angular";
import { NavigationGroup } from "../../models/NavigationGroup";
import { SidebarGroupComponent } from "../sidebar-group/sidebar-group.component";

@Component({
    selector: "app-sidebar",
    imports: [SidebarGroupComponent, LucideSearch, LucideSparkles],
    templateUrl: "./sidebar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "flex flex-col h-full"
    }
})
export class SidebarComponent {
    protected readonly groups = signal<NavigationGroup[]>([
        {
            title: "Get Started",
            path: "/components",
            items: [
                { text: "Introduction", path: "/introduction", icon: LucideSparkles },
                { text: "Installation", path: "/installation", icon: LucideBookOpen }
            ]
        },
        {
            title: "Components",
            path: "/components",
            items: [
                { text: "Auto Complete", path: "/auto-complete" },
                { text: "Avatar", path: "/avatar" },
                { text: "Breadcrumb", path: "/breadcrumb" },
                { text: "Button", path: "/button" },
                { text: "Button Group", path: "/button-group" },
                { text: "Calendar", path: "/calendar" },
                { text: "Checkbox", path: "/checkbox" },
                { text: "Chip", path: "/chip" },
                { text: "Circular Progress Bar", path: "/circular-progress-bar" },
                { text: "Color Gradient", path: "/color-gradient" },
                { text: "Color Palette", path: "/color-palette" },
                { text: "Color Picker", path: "/color-picker" },
                { text: "Combo Box", path: "/combo-box" },
                { text: "Context Menu", path: "/contextmenu" },
                { text: "Date Picker", path: "/date-picker" },
                { text: "Date Time Picker", path: "/datetime-picker" },
                { text: "Dialog", path: "/dialog" },
                { text: "Dropdown Button", path: "/dropdown-button" },
                { text: "Dropdown List", path: "/dropdown-list" },
                { text: "Expansion Panel", path: "/expansion-panel" },
                { text: "Fieldset", path: "/fieldset" },
                { text: "Grid", path: "/grid" },
                { text: "Input", path: "/input" },
                { text: "List Box", path: "/list-box" },
                { text: "List View", path: "/list-view" },
                { text: "Menubar", path: "/menubar" },
                { text: "Multi Select", path: "/multi-select" },
                { text: "Notification", path: "/notification" },
                { text: "Numeric Text Box", path: "/numeric-textbox" },
                { text: "Pager", path: "/pager" },
                { text: "Placeholder", path: "/placeholder" },
                { text: "Popover", path: "/popover" },
                { text: "Popup", path: "/popup" },
                { text: "Progress Bar", path: "/progress-bar" },
                { text: "Radio Button", path: "/radio-button" },
                { text: "Scroll View", path: "/scroll-view" },
                { text: "Slider", path: "/slider" },
                { text: "Split Button", path: "/split-button" },
                { text: "Splitter", path: "/splitter" },
                { text: "Stepper", path: "/stepper" },
                { text: "Switch", path: "/switch" },
                { text: "Tabs", path: "/tabs" },
                { text: "Text Area", path: "/textarea" },
                { text: "Text Box", path: "/textbox" },
                { text: "Time Picker", path: "/time-picker" },
                { text: "Tooltip", path: "/tooltip" },
                { text: "Tooltip Directive", path: "/tooltip-directive" },
                { text: "Tree View", path: "/tree-view" },
                { text: "Window", path: "/window" },
                { text: "#PopupMenuInternal", path: "/popup-menu-internal" }
            ]
        }
    ]);
}
