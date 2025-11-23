import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "components",
        loadComponent: () =>
            import("./layout/components/components/components.component").then(m => m.ComponentsComponent),
        children: [
            {
                path: "avatar",
                loadComponent: () =>
                    import("./docs/components/avatar-doc/avatar-doc.component").then(m => m.AvatarDocComponent)
            },
            {
                path: "button",
                loadComponent: () =>
                    import("./docs/components/button-doc/button-doc.component").then(m => m.ButtonDocComponent)
            },
            {
                path: "button-group",
                loadComponent: () =>
                    import("./docs/components/button-group-doc/button-group-doc.component").then(
                        m => m.ButtonGroupDocComponent
                    )
            },
            {
                path: "checkbox",
                loadComponent: () =>
                    import("./docs/components/checkbox-doc/checkbox-doc.component").then(m => m.CheckboxDocComponent)
            },
            {
                path: "chip",
                loadComponent: () =>
                    import("./docs/components/chip-doc/chip-doc.component").then(m => m.ChipDocComponent)
            },
            {
                path: "circular-progress-bar",
                loadComponent: () =>
                    import("./docs/components/circular-progress-bar-doc/circular-progress-bar-doc.component").then(
                        m => m.CircularProgressBarDocComponent
                    )
            },
            {
                path: "color-gradient",
                loadComponent: () =>
                    import("./docs/components/color-gradient-doc/color-gradient-doc.component").then(
                        m => m.ColorGradientDocComponent
                    )
            },
            {
                path: "color-palette",
                loadComponent: () =>
                    import("./docs/components/color-palette-doc/color-palette-doc.component").then(
                        m => m.ColorPaletteDocComponent
                    )
            },
            {
                path: "color-picker",
                loadComponent: () =>
                    import("./docs/components/color-picker-doc/color-picker-doc.component").then(
                        m => m.ColorPickerDocComponent
                    )
            },
            {
                path: "contextmenu",
                loadComponent: () =>
                    import("./docs/components/contextmenu-doc/contextmenu-doc.component").then(
                        m => m.ContextMenuDocComponent
                    )
            },
            {
                path: "dropdown-button",
                loadComponent: () =>
                    import("./docs/components/dropdown-button-doc/dropdown-button-doc.component").then(
                        m => m.DropdownButtonDocComponent
                    )
            },
            {
                path: "dropdown-list",
                loadComponent: () =>
                    import("./docs/components/dropdown-list-doc/dropdown-list-doc.component").then(
                        m => m.DropdownListDocComponent
                    )
            },
            {
                path: "expansion-panel",
                loadComponent: () =>
                    import("./docs/components/expansion-panel-doc/expansion-panel-doc.component").then(
                        m => m.ExpansionPanelDocComponent
                    )
            },
            {
                path: "input",
                loadComponent: () =>
                    import("./docs/components/input-doc/input-doc.component").then(m => m.InputDocComponent)
            },
            {
                path: "list-box",
                loadComponent: () =>
                    import("./docs/components/list-box-doc/list-box-doc.component").then(m => m.ListBoxDocComponent)
            },
            {
                path: "list-view",
                loadComponent: () =>
                    import("./docs/components/list-view-doc/list-view-doc.component").then(m => m.ListViewDocComponent)
            },
            {
                path: "menubar",
                loadComponent: () =>
                    import("./docs/components/menubar-doc/menubar-doc.component").then(m => m.MenubarDocComponent)
            },
            {
                path: "numeric-textbox",
                loadComponent: () =>
                    import("./docs/components/numeric-textbox-doc/numeric-textbox-doc.component").then(
                        m => m.NumericTextboxDocComponent
                    )
            },
            {
                path: "pager",
                loadComponent: () =>
                    import("./docs/components/pager-doc/pager-doc.component").then(m => m.PagerDocComponent)
            },
            {
                path: "popover",
                loadComponent: () =>
                    import("./docs/components/popover-doc/popover-doc.component").then(m => m.PopoverDocComponent)
            },
            {
                path: "popup",
                loadComponent: () =>
                    import("./docs/components/popup-doc/popup-doc.component").then(m => m.PopupDocComponent)
            },
            {
                path: "progress-bar",
                loadComponent: () =>
                    import("./docs/components/progress-bar-doc/progress-bar-doc.component").then(
                        m => m.ProgressBarDocComponent
                    )
            },
            {
                path: "radio-button",
                loadComponent: () =>
                    import("./docs/components/radio-button-doc/radio-button-doc.component").then(
                        m => m.RadioButtonDocComponent
                    )
            },
            {
                path: "slider",
                loadComponent: () =>
                    import("./docs/components/slider-doc/slider-doc.component").then(m => m.SliderDocComponent)
            },
            {
                path: "split-button",
                loadComponent: () =>
                    import("./docs/components/split-button-doc/split-button-doc.component").then(
                        m => m.SplitButtonDocComponent
                    )
            },
            {
                path: "switch",
                loadComponent: () =>
                    import("./docs/components/switch-doc/switch-doc.component").then(m => m.SwitchDocComponent)
            },
            {
                path: "textarea",
                loadComponent: () =>
                    import("./docs/components/text-area-doc/text-area-doc.component").then(m => m.TextAreaDocComponent)
            },
            {
                path: "textbox",
                loadComponent: () =>
                    import("./docs/components/text-box-doc/text-box-doc.component").then(m => m.TextBoxDocComponent)
            },
            {
                path: "tooltip",
                loadComponent: () =>
                    import("./docs/components/tooltip-doc/tooltip-doc.component").then(m => m.TooltipDocComponent)
            },
            {
                path: "tooltip-directive",
                loadComponent: () =>
                    import("./docs/components/tooltip-directive-doc/tooltip-directive-doc.component").then(
                        m => m.TooltipDirectiveDocComponent
                    )
            },
            {
                path: "popup-menu-internal",
                loadComponent: () =>
                    import("./docs/components/popup-menu-doc/popup-menu-doc.component").then(
                        m => m.PopupMenuDocComponent
                    )
            }
        ]
    }
];
