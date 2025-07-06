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
                path: "dropdown-button",
                loadComponent: () =>
                    import("./docs/components/drop-down-button-doc/drop-down-button-doc.component").then(
                        m => m.DropDownButtonDocComponent
                    )
            },
            {
                path: "input",
                loadComponent: () =>
                    import("./docs/components/input-doc/input-doc.component").then(m => m.InputDocComponent)
            },
            {
                path: "numeric-textbox",
                loadComponent: () =>
                    import("./docs/components/numeric-textbox-doc/numeric-textbox-doc.component").then(
                        m => m.NumericTextboxDocComponent
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
            }
        ]
    }
];
