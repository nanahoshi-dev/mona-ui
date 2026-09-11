import { Component, signal } from "@angular/core";
import { RangeSliderComponent, SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SidebarComponent, SidebarLayoutComponent } from "@nanahoshi/mona-ui/sidebar";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";

export interface FixturePageItem {
    id: number;
    title: string;
}

@Component({
    selector: "app-direction-geometry-fixture",
    imports: [
        SliderComponent,
        RangeSliderComponent,
        SidebarLayoutComponent,
        SidebarComponent,
        ScrollViewComponent
    ],
    template: `
        <div style="padding: 24px; font-family: sans-serif; display: flex; flex-direction: column; gap: 48px;">
            <header>
                <h1 style="margin: 0 0 8px 0; font-size: 20px;">Direction Geometry Browser Fixtures</h1>
            </header>

            <!-- 1. Ordinary LTR -->
            <section
                id="fixture-ltr"
                data-testid="fixture-ltr"
                dir="ltr"
                style="border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #1d4ed8;">1. Ordinary LTR (dir=ltr)</h2>

                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Slider (value=20, min=0, max=100)</h3>
                        <mona-slider
                            data-testid="slider-ltr"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="sliderValueLtr()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="sliderValueLtr.set($event)"
                        />
                    </div>

                    <!-- Range Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">RangeSlider (value=[20, 80], min=0, max=100)</h3>
                        <mona-range-slider
                            data-testid="range-slider-ltr"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="rangeValueLtr()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="rangeValueLtr.set($event)"
                        />
                    </div>

                    <!-- Sidebar -->
                    <div style="width: 400px; height: 220px; border: 1px dashed #94a3b8; position: relative; overflow: hidden;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Drawer Layout</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="open-sidebar-start-ltr" (click)="sidebarStartOpenLtr.set(true)">Open Start</button>
                            <button type="button" data-testid="close-sidebar-start-ltr" (click)="sidebarStartOpenLtr.set(false)">Close Start</button>
                            <button type="button" data-testid="open-sidebar-end-ltr" (click)="sidebarEndOpenLtr.set(true)">Open End</button>
                            <button type="button" data-testid="close-sidebar-end-ltr" (click)="sidebarEndOpenLtr.set(false)">Close End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="5000" style="width: 100%; height: 160px;">
                            <mona-sidebar
                                data-testid="sidebar-start-ltr"
                                side="start"
                                [(expanded)]="sidebarStartOpenLtr"
                                style="width: 120px; background: #e0f2fe; border: 1px solid #38bdf8;">
                                <div style="padding: 8px;">Sidebar Start</div>
                            </mona-sidebar>
                            <mona-sidebar
                                data-testid="sidebar-end-ltr"
                                side="end"
                                [(expanded)]="sidebarEndOpenLtr"
                                style="width: 120px; background: #fef08a; border: 1px solid #facc15;">
                                <div style="padding: 8px;">Sidebar End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 160px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-ltr"
                            [data]="pages"
                            [width]="300"
                            [height]="120"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 120px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>

            <!-- 2. Ordinary RTL -->
            <section
                id="fixture-rtl"
                data-testid="fixture-rtl"
                dir="rtl"
                style="border: 2px solid #10b981; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #047857;">2. Ordinary RTL (dir=rtl)</h2>

                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Slider (value=20, min=0, max=100)</h3>
                        <mona-slider
                            data-testid="slider-rtl"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="sliderValueRtl()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="sliderValueRtl.set($event)"
                        />
                    </div>

                    <!-- Range Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">RangeSlider (value=[20, 80], min=0, max=100)</h3>
                        <mona-range-slider
                            data-testid="range-slider-rtl"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="rangeValueRtl()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="rangeValueRtl.set($event)"
                        />
                    </div>

                    <!-- Sidebar -->
                    <div style="width: 400px; height: 220px; border: 1px dashed #94a3b8; position: relative; overflow: hidden;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Drawer Layout</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="open-sidebar-start-rtl" (click)="sidebarStartOpenRtl.set(true)">Open Start</button>
                            <button type="button" data-testid="close-sidebar-start-rtl" (click)="sidebarStartOpenRtl.set(false)">Close Start</button>
                            <button type="button" data-testid="open-sidebar-end-rtl" (click)="sidebarEndOpenRtl.set(true)">Open End</button>
                            <button type="button" data-testid="close-sidebar-end-rtl" (click)="sidebarEndOpenRtl.set(false)">Close End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="5000" style="width: 100%; height: 160px;">
                            <mona-sidebar
                                data-testid="sidebar-start-rtl"
                                side="start"
                                [(expanded)]="sidebarStartOpenRtl"
                                style="width: 120px; background: #e0f2fe; border: 1px solid #38bdf8;">
                                <div style="padding: 8px;">Sidebar Start</div>
                            </mona-sidebar>
                            <mona-sidebar
                                data-testid="sidebar-end-rtl"
                                side="end"
                                [(expanded)]="sidebarEndOpenRtl"
                                style="width: 120px; background: #fef08a; border: 1px solid #facc15;">
                                <div style="padding: 8px;">Sidebar End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 160px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-rtl"
                            [data]="pages"
                            [width]="300"
                            [height]="120"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 120px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>

            <!-- 3. Split: Semantic LTR + CSS direction: rtl -->
            <section
                id="fixture-split-ltr-css-rtl"
                data-testid="fixture-split-ltr-css-rtl"
                dir="ltr"
                style="direction: rtl; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #b45309;">3. Split (dir=ltr, CSS direction=rtl)</h2>

                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Slider (value=20, min=0, max=100)</h3>
                        <mona-slider
                            data-testid="slider-split-ltr"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="sliderValueSplitLtr()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="sliderValueSplitLtr.set($event)"
                        />
                    </div>

                    <!-- Range Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">RangeSlider (value=[20, 80], min=0, max=100)</h3>
                        <mona-range-slider
                            data-testid="range-slider-split-ltr"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="rangeValueSplitLtr()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="rangeValueSplitLtr.set($event)"
                        />
                    </div>

                    <!-- Sidebar -->
                    <div style="width: 400px; height: 220px; border: 1px dashed #94a3b8; position: relative; overflow: hidden;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Drawer Layout</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="open-sidebar-start-split-ltr" (click)="sidebarStartOpenSplitLtr.set(true)">Open Start</button>
                            <button type="button" data-testid="close-sidebar-start-split-ltr" (click)="sidebarStartOpenSplitLtr.set(false)">Close Start</button>
                            <button type="button" data-testid="open-sidebar-end-split-ltr" (click)="sidebarEndOpenSplitLtr.set(true)">Open End</button>
                            <button type="button" data-testid="close-sidebar-end-split-ltr" (click)="sidebarEndOpenSplitLtr.set(false)">Close End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="5000" style="width: 100%; height: 160px;">
                            <mona-sidebar
                                data-testid="sidebar-start-split-ltr"
                                side="start"
                                [(expanded)]="sidebarStartOpenSplitLtr"
                                style="width: 120px; background: #e0f2fe; border: 1px solid #38bdf8;">
                                <div style="padding: 8px;">Sidebar Start</div>
                            </mona-sidebar>
                            <mona-sidebar
                                data-testid="sidebar-end-split-ltr"
                                side="end"
                                [(expanded)]="sidebarEndOpenSplitLtr"
                                style="width: 120px; background: #fef08a; border: 1px solid #facc15;">
                                <div style="padding: 8px;">Sidebar End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 160px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-split-ltr"
                            [data]="pages"
                            [width]="300"
                            [height]="120"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 120px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>

            <!-- 4. Split: Semantic RTL + CSS direction: ltr -->
            <section
                id="fixture-split-rtl-css-ltr"
                data-testid="fixture-split-rtl-css-ltr"
                dir="rtl"
                style="direction: ltr; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #b91c1c;">4. Split (dir=rtl, CSS direction=ltr)</h2>

                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Slider (value=20, min=0, max=100)</h3>
                        <mona-slider
                            data-testid="slider-split-rtl"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="sliderValueSplitRtl()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="sliderValueSplitRtl.set($event)"
                        />
                    </div>

                    <!-- Range Slider -->
                    <div style="width: 400px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">RangeSlider (value=[20, 80], min=0, max=100)</h3>
                        <mona-range-slider
                            data-testid="range-slider-split-rtl"
                            [minValue]="0"
                            [maxValue]="100"
                            [step]="10"
                            [value]="rangeValueSplitRtl()"
                            [showTicks]="true"
                            [showLabels]="true"
                            [style.width.px]="400"
                            (valueChange)="rangeValueSplitRtl.set($event)"
                        />
                    </div>

                    <!-- Sidebar -->
                    <div style="width: 400px; height: 220px; border: 1px dashed #94a3b8; position: relative; overflow: hidden;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Drawer Layout</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="open-sidebar-start-split-rtl" (click)="sidebarStartOpenSplitRtl.set(true)">Open Start</button>
                            <button type="button" data-testid="close-sidebar-start-split-rtl" (click)="sidebarStartOpenSplitRtl.set(false)">Close Start</button>
                            <button type="button" data-testid="open-sidebar-end-split-rtl" (click)="sidebarEndOpenSplitRtl.set(true)">Open End</button>
                            <button type="button" data-testid="close-sidebar-end-split-rtl" (click)="sidebarEndOpenSplitRtl.set(false)">Close End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="5000" style="width: 100%; height: 160px;">
                            <mona-sidebar
                                data-testid="sidebar-start-split-rtl"
                                side="start"
                                [(expanded)]="sidebarStartOpenSplitRtl"
                                style="width: 120px; background: #e0f2fe; border: 1px solid #38bdf8;">
                                <div style="padding: 8px;">Sidebar Start</div>
                            </mona-sidebar>
                            <mona-sidebar
                                data-testid="sidebar-end-split-rtl"
                                side="end"
                                [(expanded)]="sidebarEndOpenSplitRtl"
                                style="width: 120px; background: #fef08a; border: 1px solid #facc15;">
                                <div style="padding: 8px;">Sidebar End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 160px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-split-rtl"
                            [data]="pages"
                            [width]="300"
                            [height]="120"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 120px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>
        </div>
    `
})
export class DirectionGeometryFixtureComponent {
    public readonly pages: FixturePageItem[] = [
        { id: 1, title: "Page 1" },
        { id: 2, title: "Page 2" },
        { id: 3, title: "Page 3" }
    ];

    public readonly sidebarStartOpenLtr = signal(false);
    public readonly sidebarEndOpenLtr = signal(false);

    public readonly sidebarStartOpenRtl = signal(false);
    public readonly sidebarEndOpenRtl = signal(false);

    public readonly sidebarStartOpenSplitLtr = signal(false);
    public readonly sidebarEndOpenSplitLtr = signal(false);

    public readonly sidebarStartOpenSplitRtl = signal(false);
    public readonly sidebarEndOpenSplitRtl = signal(false);

    public readonly sliderValueLtr = signal(20);
    public readonly sliderValueRtl = signal(20);
    public readonly sliderValueSplitLtr = signal(20);
    public readonly sliderValueSplitRtl = signal(20);

    public readonly rangeValueLtr = signal<[number, number]>([20, 80]);
    public readonly rangeValueRtl = signal<[number, number]>([20, 80]);
    public readonly rangeValueSplitLtr = signal<[number, number]>([20, 80]);
    public readonly rangeValueSplitRtl = signal<[number, number]>([20, 80]);
}
