import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import { ScrollViewComponent } from "@mirei/mona-ui/scroll-view";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-scroll-view-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./scroll-view-demo.component.html"
})
export class ScrollViewDemoComponent extends AbstractDemoComponent<ScrollViewComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<ScrollViewComponent>>({
        code: ``,
        inputs: {
            animate: {
                type: "dropdown",
                value: [true, false, 500, 1000, 2000],
                defaultValue: true
            },
            data: {
                type: "iterable",
                value: [
                    "https://t3.ftcdn.net/jpg/08/90/78/28/360_F_890782873_Yaz9CuDC8x08irGjVzpsegd3zavg0Dqr.jpg",
                    "https://w.wallhaven.cc/full/4y/wallhaven-4y5q8x.jpg",
                    "https://photos.smugmug.com/photos/i-MVxLrNn/0/CBrrvJV84VqpZBXMgN39mHXgmDWgLRVcjSPZtnd9F/O/i-MVxLrNn.jpg",
                    "https://photos.smugmug.com/photos/i-CRB8Dqc/0/P8m7ZJJ3jFL9sHHHbsrczhxmVVbzkFVgNPxCsKmS/O/i-CRB8Dqc.jpg",
                    "https://photos.smugmug.com/photos/i-8HfQH43/0/DQbGCs9m8w7ZFtRVV7C2snGnStrGv7sLkVdzq4XHD/O/i-8HfQH43.jpg",
                    "https://photos.smugmug.com/photos/i-Q2qwD8V/0/FV3cC7LFRmCw9KpSkvLhKGNZ7s7mz5g45rjJ83fRq/O/i-Q2qwD8V.jpg",
                    "https://photos.smugmug.com/photos/i-4FHqHbw/0/FVv9trWGx5hPvmwSSQtC74XbpnkRbWfTD8kL3vB9C/O/i-4FHqHbw.jpg",
                    "https://photos.smugmug.com/photos/i-WdTGTMg/0/C7DHJwxbzW5qWcrvtXhz9GfXnVswJnq7qpT3HbMc3/O/i-WdTGTMg.jpg",
                    "https://photos.smugmug.com/photos/i-XZGtpZC/0/C9CcBbKZ8JWPXwsn3qrjkmxtvGn9KNr33Fr5MTszb/O/i-XZGtpZC.jpg",
                    "https://photos.smugmug.com/photos/i-DrRSngh/0/CT3xwsnHv5wZQ4wh9WHmP8F6jFr7Z3sHDD97t2k5J/O/i-DrRSngh.jpg",
                    "https://photos.smugmug.com/photos/i-tFWWgxZ/0/P97tdGMtSQLhb6WBwBr6TcCGnSnV5MxS73BDP6ND/O/i-tFWWgxZ.jpg",
                    "https://photos.smugmug.com/photos/i-wcqdW6P/0/mBS27n36NDJRWtk8ZDhHFf5pzZDLnDfpqzFZ2zxN/O/i-wcqdW6P.jpg",
                    "https://photos.smugmug.com/photos/i-344RwvF/0/D79WSZ4FKJdvJMqgZZrjphRffFKFBDZJBJkLpb7KM/O/i-344RwvF.png"
                ]
            },
            height: {
                type: "string",
                value: "360px"
            },
            index: {
                type: "number",
                value: 0
            },
            infinite: {
                type: "boolean",
                value: false
            },
            pageable: {
                type: "boolean",
                value: true
            },
            pagerBlur: {
                type: "number",
                value: 3
            },
            pagerOverlay: {
                type: "dropdown",
                value: ["dark", "light", "none"],
                defaultValue: "dark"
            },
            pagerRounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "none"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "none"
            },
            width: {
                type: "string",
                value: "640px"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ScrollViewComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ScrollViewWrapperComponent = ScrollViewWrapperComponent;
}

@Component({
    imports: [ScrollViewComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <mona-scroll-view
            [animate]="animate()"
            [arrows]="arrows()"
            [data]="data()"
            [height]="height()"
            [index]="index()"
            [infinite]="infinite()"
            [pageable]="pageable()"
            [pagerBlur]="pagerBlur()"
            [pagerOverlay]="pagerOverlay()"
            [pagerRounded]="pagerRounded()"
            [rounded]="rounded()"
            [width]="width()">
            <ng-template let-item>
                <img [src]="item" alt="" />
            </ng-template>
        </mona-scroll-view>
    `
})
class ScrollViewWrapperComponent implements ComponentInputsAsSignal<ScrollViewComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly animate = input<ReturnType<ScrollViewComponent["animate"]>>(true);
    public readonly arrows = input<ReturnType<ScrollViewComponent["arrows"]>>(true);
    public readonly data = input<ReturnType<ScrollViewComponent["data"]>>([]);
    public readonly height = input.required<ReturnType<ScrollViewComponent["height"]>>();
    public readonly index = model<ReturnType<ScrollViewComponent["index"]>>(0);
    public readonly infinite = input<ReturnType<ScrollViewComponent["infinite"]>>(false);
    public readonly pageable = input<ReturnType<ScrollViewComponent["pageable"]>>(true);
    public readonly pagerBlur = input<ReturnType<ScrollViewComponent["pagerBlur"]>>(1);
    public readonly pagerOverlay = input<ReturnType<ScrollViewComponent["pagerOverlay"]>>("dark");
    public readonly pagerRounded = input<ReturnType<ScrollViewComponent["pagerRounded"]>>("none");
    public readonly rounded = input<ReturnType<ScrollViewComponent["rounded"]>>("none");
    public readonly width = input.required<ReturnType<ScrollViewComponent["width"]>>();
}
