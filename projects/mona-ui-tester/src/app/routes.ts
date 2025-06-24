import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "components",
        loadComponent: () =>
            import("./layout/components/components/components.component").then(m => m.ComponentsComponent),
        children: [
            {
                path: "buttons",
                children: [
                    {
                        path: "button",
                        loadComponent: () =>
                            import("./docs/components/button-doc/button-doc.component").then(m => m.ButtonDocComponent)
                    }
                    //                 {
                    //                     path: "button-group",
                    //                     loadComponent: () =>
                    //                         import("./components/button-group-doc/button-group-doc.component").then(
                    //                             m => m.ButtonGroupDocComponent
                    //                         )
                    //                 }
                ]
            },
            {
                path: "chip",
                loadComponent: () =>
                    import("./docs/components/chip-doc/chip-doc.component").then(m => m.ChipDocComponent)
            }
        ]
    }
];
