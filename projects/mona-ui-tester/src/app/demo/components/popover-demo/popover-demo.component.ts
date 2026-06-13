import { NgComponentOutlet, NgOptimizedImage } from "@angular/common";
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, input, signal } from "@angular/core";
import { LucideAngularModule, X } from "lucide-angular";
import {
    ButtonDirective,
    PopoverComponent,
    PopoverFooterTemplateDirective,
    PopoverTitleTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-popover-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./popover-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopoverDemoComponent extends AbstractDemoComponent<PopoverComponent> {
    readonly #injector = createFeatureInjector({
        footerTemplate: {
            code: `
                <ng-template monaPopoverFooterTemplate>
                    <div class="p-2 border-t flex border-t-border">
                        <p class="italic text-xs flex-1 select-none">Photo by Lorenzo Castellino</p>
                        <p class="text-xs select-none">
                            See at
                            <a
                                class="text-primary"
                                target="_blank"
                                href="https://www.pexels.com/photo/scenic-riverside-in-arashiyama-kyoto-japan-33145847/"
                                >Pexels</a
                            >
                        </p>
                    </div>
                </ng-template>
            `,
            description: `This template is used to customize the footer of the popover.`,
            name: "Footer Template",
            active: false
        },
        titleTemplate: {
            code: `
                <ng-template monaPopoverTitleTemplate>
                    <div class="flex w-full bg-accent border-b border-b-border">
                        <p class="flex items-center flex-1 px-2 py-1.5">Arashiyama, Japan</p>
                        <button monaButton [look]="'ghost'" (click)="p.close()">
                            <lucide-angular [name]="closeIcon" [size]="14"></lucide-angular>
                        </button>
                    </div>
                </ng-template>
            `,
            description: `This template is used to customize the title of the popover.`,
            name: "Title Template",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<PopoverComponent>>({
        code: `
            <button monaButton #anchor>Popover Anchor</button>
            <mona-popover
                [displayArrow]="displayArrow()"
                [position]="position()"
                [rounded]="rounded()"
                [target]="anchor"
                [trigger]="trigger()"
                [title]="title()"
                #p="monaPopover">
                <div class="p-2">
                    <img
                        [ngSrc]="'https://images.pexels.com/photos/33145847/pexels-photo-33145847.jpeg'"
                        [width]="400"
                        [height]="300"
                        alt="Arashiyama, Japan" />
                </div>
                <ng-template monaPopoverFooterTemplate>
                    <div class="p-2 border-t flex border-t-border">
                        <p class="italic text-xs flex-1 select-none">Photo by Lorenzo Castellino</p>
                        <p class="text-xs select-none">
                            See at
                            <a
                                class="text-primary"
                                target="_blank"
                                href="https://www.pexels.com/photo/scenic-riverside-in-arashiyama-kyoto-japan-33145847/"
                                >Pexels</a
                            >
                        </p>
                    </div>
                </ng-template>
                <ng-template monaPopoverTitleTemplate>
                    <div class="flex w-full bg-accent border-b border-b-border">
                        <p class="flex items-center flex-1 px-2 py-1.5">Arashiyama, Japan</p>
                        <button monaButton [look]="'ghost'" (click)="p.close()">
                            <lucide-angular [name]="closeIcon" [size]="14"></lucide-angular>
                        </button>
                    </div>
                </ng-template>
            </mona-popover>
            <button monaButton [look]="'link'" (click)="p.open()">Open</button>
            <button monaButton [look]="'link'" (click)="p.close()">Close</button>
        `,
        inputs: {
            displayArrow: {
                type: "boolean",
                value: false
            },
            position: {
                type: "dropdown",
                value: ["top", "bottom", "left", "right"],
                defaultValue: "top"
            },
            rounded: {
                type: "dropdown",
                value: ["large", "medium", "none", "small"],
                defaultValue: "medium"
            },
            target: {
                type: "object"
            },
            trigger: {
                type: "dropdown",
                value: ["click", "contextmenu", "pointerenter"],
                defaultValue: "click"
            },
            title: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("PopoverComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly PopoverWrapperComponent = PopoverWrapperComponent;
}

@Component({
    imports: [
        ButtonDirective,
        PopoverComponent,
        PopoverFooterTemplateDirective,
        PopoverTitleTemplateDirective,
        NgOptimizedImage,
        LucideAngularModule
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <button monaButton #anchor>Popover Anchor</button>
        <mona-popover
            [displayArrow]="displayArrow()"
            [position]="position()"
            [rounded]="rounded()"
            [target]="anchor"
            [trigger]="trigger()"
            [title]="title()"
            #p="monaPopover">
            <div class="p-2">
                <img
                    [ngSrc]="'https://images.pexels.com/photos/33145847/pexels-photo-33145847.jpeg'"
                    [width]="400"
                    [height]="300"
                    alt="Arashiyama, Japan" />
            </div>
            @if (featureData && featureData["footerTemplate"].active) {
                <ng-template monaPopoverFooterTemplate>
                    <div class="p-2 border-t flex border-t-border">
                        <p class="italic text-xs flex-1 select-none">Photo by Lorenzo Castellino</p>
                        <p class="text-xs select-none">
                            See at
                            <a
                                class="text-primary"
                                target="_blank"
                                href="https://www.pexels.com/photo/scenic-riverside-in-arashiyama-kyoto-japan-33145847/"
                                >Pexels</a
                            >
                        </p>
                    </div>
                </ng-template>
            }
            @if (featureData && featureData["titleTemplate"].active) {
                <ng-template monaPopoverTitleTemplate>
                    <div class="flex w-full bg-accent border-b border-b-border">
                        <p class="flex items-center flex-1 px-2 py-1.5">Arashiyama, Japan</p>
                        <button monaButton [look]="'ghost'" (click)="p.close()">
                            <lucide-angular [name]="closeIcon" [size]="14"></lucide-angular>
                        </button>
                    </div>
                </ng-template>
            }
        </mona-popover>
        <button monaButton [look]="'link'" (click)="p.open()">Open</button>
        <button monaButton [look]="'link'" (click)="p.close()">Close</button>
    `
})
class PopoverWrapperComponent implements ComponentInputsAsSignal<PopoverComponent> {
    readonly #document = inject(DOCUMENT);
    protected readonly closeIcon = X;
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly displayArrow = input<ReturnType<PopoverComponent["displayArrow"]>>(false);
    public readonly position = input<ReturnType<PopoverComponent["position"]>>("top");
    public readonly rounded = input<ReturnType<PopoverComponent["rounded"]>>("medium");
    public readonly target = input<ReturnType<PopoverComponent["target"]>>(this.#document.body);
    public readonly trigger = input<ReturnType<PopoverComponent["trigger"]>>("click");
    public readonly title = input<ReturnType<PopoverComponent["title"]>>("");
}
