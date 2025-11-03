import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { NavigationGroup } from "../../models/NavigationGroup";
import { SidebarGroupComponent } from "../sidebar-group/sidebar-group.component";

@Component({
    selector: "app-sidebar",
    imports: [SidebarGroupComponent],
    templateUrl: "./sidebar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    protected readonly groups = signal<NavigationGroup[]>([
        {
            title: "Get Started",
            path: "",
            items: [
                {
                    text: "Introduction",
                    path: "/introduction"
                },
                {
                    text: "Installation",
                    path: "/installation"
                }
            ]
        },
        {
            title: "Components",
            path: "/components",
            items: [
                {
                    text: "Avatar",
                    path: "/avatar"
                },
                {
                    text: "Button",
                    path: "/button"
                },
                {
                    text: "Button Group",
                    path: "/button-group"
                },
                {
                    text: "Checkbox",
                    path: "/checkbox"
                },
                {
                    text: "Chip",
                    path: "/chip"
                },
                {
                    text: "Circular Progress Bar",
                    path: "/circular-progress-bar"
                },
                {
                    text: "Color Gradient",
                    path: "/color-gradient"
                },
                {
                    text: "Color Palette",
                    path: "/color-palette"
                },
                {
                    text: "Color Picker",
                    path: "/color-picker"
                },
                {
                    text: "Context Menu",
                    path: "/contextmenu"
                },
                {
                    text: "Dropdown Button",
                    path: "/dropdown-button"
                },
                {
                    text: "Dropdown List",
                    path: "/dropdown-list"
                },
                {
                    text: "Input",
                    path: "/input"
                },
                {
                    text: "Menubar",
                    path: "/menubar"
                },
                {
                    text: "Numeric Text Box",
                    path: "/numeric-textbox"
                },
                {
                    text: "Popover",
                    path: "/popover"
                },
                {
                    text: "Popup",
                    path: "/popup"
                },
                {
                    text: "Progress Bar",
                    path: "progress-bar"
                },
                {
                    text: "Radio Button",
                    path: "/radio-button"
                },
                {
                    text: "Slider",
                    path: "/slider"
                },
                {
                    text: "Split Button",
                    path: "/split-button"
                },
                {
                    text: "Switch",
                    path: "/switch"
                },
                {
                    text: "Text Area",
                    path: "/textarea"
                },
                {
                    text: "Text Box",
                    path: "/textbox"
                },
                {
                    text: "Tooltip",
                    path: "/tooltip"
                },
                {
                    text: "Tooltip Directive",
                    path: "/tooltip-directive"
                },
                {
                    text: "#PopupMenuInternal",
                    path: "/popup-menu-internal"
                }
            ]
        }
    ]);
}
