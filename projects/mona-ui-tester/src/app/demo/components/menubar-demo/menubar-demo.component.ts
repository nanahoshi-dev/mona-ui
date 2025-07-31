import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { MenubarComponent, MenuComponent, MenuItemComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-menubar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./menubar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenubarDemoComponent extends AbstractDemoComponent<MenubarComponent> {
    protected readonly config = signal<ComponentConfig<MenubarComponent>>({
        code: ``,
        inputs: {
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("MenubarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "MenuComponent",
        "MenuItemComponent",
        "MenuItemGroupComponent"
    ]);
    protected readonly MenubarWrapperComponent = MenubarWrapperComponent;
}

@Component({
    imports: [MenubarComponent, MenuComponent, MenuItemComponent],
    template: `
        <mona-menubar [size]="size()" [rounded]="rounded()">
            <mona-menu text="File">
                <mona-menu-item text="New"></mona-menu-item>
                <mona-menu-item text="Open"></mona-menu-item>
                <mona-menu-item text="Open Recent">
                    <mona-menu-item text="Document 1"></mona-menu-item>
                    <mona-menu-item text="Document 2"></mona-menu-item>
                    <mona-menu-item text="Document 3"></mona-menu-item>
                </mona-menu-item>
                <mona-menu-item text="Save"></mona-menu-item>
                <mona-menu-item text="Save As"></mona-menu-item>
                <mona-menu-item text="Exit"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Edit">
                <mona-menu-item text="Undo"></mona-menu-item>
                <mona-menu-item text="Redo"></mona-menu-item>
                <mona-menu-item [divider]="true"></mona-menu-item>
                <mona-menu-item text="Cut"></mona-menu-item>
                <mona-menu-item text="Copy"></mona-menu-item>
                <mona-menu-item text="Paste"></mona-menu-item>
            </mona-menu>
            <mona-menu text="View">
                <mona-menu-item text="Zoom In"></mona-menu-item>
                <mona-menu-item text="Zoom Out"></mona-menu-item>
                <mona-menu-item text="Reset Zoom"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Help">
                <mona-menu-item text="Documentation"></mona-menu-item>
                <mona-menu-item text="About"></mona-menu-item>
            </mona-menu>
        </mona-menubar>
    `
})
class MenubarWrapperComponent implements ComponentInputsAsSignal<MenubarComponent> {
    public readonly size = input<ReturnType<MenubarComponent["size"]>>("medium");
    public readonly rounded = input<ReturnType<MenubarComponent["rounded"]>>("medium");
}
