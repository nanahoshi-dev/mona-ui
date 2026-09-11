import { Component, computed, signal, viewChild, ViewEncapsulation } from "@angular/core";
import { RangeSliderComponent, SliderComponent } from "@nanahoshi/mona-ui/slider";
import {
    SidebarComponent,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarRailDirective
} from "@nanahoshi/mona-ui/sidebar";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";

export interface FixturePageItem {
    id: number;
    title: string;
}

@Component({
    selector: "app-shadow-sidebar-fixture",
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective],
    encapsulation: ViewEncapsulation.ShadowDom,
    template: `
        <div [style.direction]="shadowDirection()" style="width: 450px; height: 180px; border: 1px solid #94a3b8; position: relative;">
            <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 140px;" data-testid="docked-layout-shadow">
                <mona-sidebar
                    data-testid="docked-sidebar-start-shadow"
                    side="start"
                    [expanded]="true"
                    [width]="120"
                    style="background: #e0f2fe;">
                    <div style="padding: 8px;">Shadow Start</div>
                </mona-sidebar>
                <main monaSidebarInset data-testid="docked-inset-shadow" style="background: #f8fafc; padding: 8px;">
                    Shadow Inset
                </main>
                <mona-sidebar
                    data-testid="docked-sidebar-end-shadow"
                    side="end"
                    [expanded]="true"
                    [width]="120"
                    style="background: #fef08a;">
                    <div style="padding: 8px;">Shadow End</div>
                </mona-sidebar>
            </mona-sidebar-layout>
        </div>
    `
})
export class ShadowSidebarFixtureComponent {
    public readonly shadowDirection = signal<"ltr" | "rtl">("ltr");
}

@Component({
    selector: "app-direction-geometry-fixture",
    imports: [
        SliderComponent,
        RangeSliderComponent,
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarInsetDirective,
        SidebarRailDirective,
        ScrollViewComponent,
        ShadowSidebarFixtureComponent
    ],
    styles: `
        .direction-rtl {
            direction: rtl !important;
        }
        @media (max-width: 900px) {
            .responsive-dir-container {
                direction: rtl !important;
            }
        }
    `,
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-slider-ltr-0" (click)="sliderValueLtr.set(0)">0</button>
                            <button type="button" data-testid="set-slider-ltr-20" (click)="sliderValueLtr.set(20)">20</button>
                            <button type="button" data-testid="set-slider-ltr-50" (click)="sliderValueLtr.set(50)">50</button>
                            <button type="button" data-testid="set-slider-ltr-80" (click)="sliderValueLtr.set(80)">80</button>
                            <button type="button" data-testid="set-slider-ltr-100" (click)="sliderValueLtr.set(100)">100</button>
                        </div>
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-range-ltr-0-100" (click)="rangeValueLtr.set([0, 100])">[0, 100]</button>
                            <button type="button" data-testid="set-range-ltr-20-80" (click)="rangeValueLtr.set([20, 80])">[20, 80]</button>
                            <button type="button" data-testid="set-range-ltr-40-60" (click)="rangeValueLtr.set([40, 60])">[40, 60]</button>
                        </div>
                    </div>

                    <!-- Sidebar Drawer Layout -->
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

                    <!-- Sidebar Docked Layout -->
                    <div style="width: 450px; height: 190px; border: 1px solid #94a3b8; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Docked Layout (breakpoint=0)</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="toggle-docked-start-ltr" (click)="dockedStartOpenLtr.set(!dockedStartOpenLtr())">Toggle Start</button>
                            <button type="button" data-testid="toggle-docked-end-ltr" (click)="dockedEndOpenLtr.set(!dockedEndOpenLtr())">Toggle End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 130px;" data-testid="docked-layout-ltr">
                            <mona-sidebar
                                data-testid="docked-sidebar-start-ltr"
                                side="start"
                                [(expanded)]="dockedStartOpenLtr"
                                collapsible="icon"
                                [width]="120"
                                [iconWidth]="40"
                                style="background: #e0f2fe;">
                                <div style="padding: 8px;">Docked Start</div>
                                <button monaSidebarRail data-testid="docked-rail-start-ltr" aria-label="Toggle rail"></button>
                            </mona-sidebar>
                            <main monaSidebarInset data-testid="docked-inset-ltr" style="background: #f8fafc; padding: 8px;">
                                Docked Content Inset
                            </main>
                            <mona-sidebar
                                data-testid="docked-sidebar-end-ltr"
                                side="end"
                                [(expanded)]="dockedEndOpenLtr"
                                collapsible="offcanvas"
                                [width]="120"
                                style="background: #fef08a;">
                                <div style="padding: 8px;">Docked End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView (overflowing pager)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-ltr"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-slider-rtl-0" (click)="sliderValueRtl.set(0)">0</button>
                            <button type="button" data-testid="set-slider-rtl-20" (click)="sliderValueRtl.set(20)">20</button>
                            <button type="button" data-testid="set-slider-rtl-50" (click)="sliderValueRtl.set(50)">50</button>
                            <button type="button" data-testid="set-slider-rtl-80" (click)="sliderValueRtl.set(80)">80</button>
                            <button type="button" data-testid="set-slider-rtl-100" (click)="sliderValueRtl.set(100)">100</button>
                        </div>
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-range-rtl-0-100" (click)="rangeValueRtl.set([0, 100])">[0, 100]</button>
                            <button type="button" data-testid="set-range-rtl-20-80" (click)="rangeValueRtl.set([20, 80])">[20, 80]</button>
                            <button type="button" data-testid="set-range-rtl-40-60" (click)="rangeValueRtl.set([40, 60])">[40, 60]</button>
                        </div>
                    </div>

                    <!-- Sidebar Drawer Layout -->
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

                    <!-- Sidebar Docked Layout -->
                    <div style="width: 450px; height: 190px; border: 1px solid #94a3b8; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Docked Layout (breakpoint=0)</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="toggle-docked-start-rtl" (click)="dockedStartOpenRtl.set(!dockedStartOpenRtl())">Toggle Start</button>
                            <button type="button" data-testid="toggle-docked-end-rtl" (click)="dockedEndOpenRtl.set(!dockedEndOpenRtl())">Toggle End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 130px;" data-testid="docked-layout-rtl">
                            <mona-sidebar
                                data-testid="docked-sidebar-start-rtl"
                                side="start"
                                [(expanded)]="dockedStartOpenRtl"
                                collapsible="icon"
                                [width]="120"
                                [iconWidth]="40"
                                style="background: #e0f2fe;">
                                <div style="padding: 8px;">Docked Start</div>
                                <button monaSidebarRail data-testid="docked-rail-start-rtl" aria-label="Toggle rail"></button>
                            </mona-sidebar>
                            <main monaSidebarInset data-testid="docked-inset-rtl" style="background: #f8fafc; padding: 8px;">
                                Docked Content Inset
                            </main>
                            <mona-sidebar
                                data-testid="docked-sidebar-end-rtl"
                                side="end"
                                [(expanded)]="dockedEndOpenRtl"
                                collapsible="offcanvas"
                                [width]="120"
                                style="background: #fef08a;">
                                <div style="padding: 8px;">Docked End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView (overflowing pager)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-rtl"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-slider-split-ltr-0" (click)="sliderValueSplitLtr.set(0)">0</button>
                            <button type="button" data-testid="set-slider-split-ltr-20" (click)="sliderValueSplitLtr.set(20)">20</button>
                            <button type="button" data-testid="set-slider-split-ltr-50" (click)="sliderValueSplitLtr.set(50)">50</button>
                            <button type="button" data-testid="set-slider-split-ltr-80" (click)="sliderValueSplitLtr.set(80)">80</button>
                            <button type="button" data-testid="set-slider-split-ltr-100" (click)="sliderValueSplitLtr.set(100)">100</button>
                        </div>
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-range-split-ltr-0-100" (click)="rangeValueSplitLtr.set([0, 100])">[0, 100]</button>
                            <button type="button" data-testid="set-range-split-ltr-20-80" (click)="rangeValueSplitLtr.set([20, 80])">[20, 80]</button>
                            <button type="button" data-testid="set-range-split-ltr-40-60" (click)="rangeValueSplitLtr.set([40, 60])">[40, 60]</button>
                        </div>
                    </div>

                    <!-- Sidebar Drawer Layout -->
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

                    <!-- Sidebar Docked Layout -->
                    <div style="width: 450px; height: 190px; border: 1px solid #94a3b8; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Docked Layout (breakpoint=0)</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="toggle-docked-start-split-ltr" (click)="dockedStartOpenSplitLtr.set(!dockedStartOpenSplitLtr())">Toggle Start</button>
                            <button type="button" data-testid="toggle-docked-end-split-ltr" (click)="dockedEndOpenSplitLtr.set(!dockedEndOpenSplitLtr())">Toggle End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 130px;" data-testid="docked-layout-split-ltr">
                            <mona-sidebar
                                data-testid="docked-sidebar-start-split-ltr"
                                side="start"
                                [(expanded)]="dockedStartOpenSplitLtr"
                                collapsible="icon"
                                [width]="120"
                                [iconWidth]="40"
                                style="background: #e0f2fe;">
                                <div style="padding: 8px;">Docked Start</div>
                                <button monaSidebarRail data-testid="docked-rail-start-split-ltr" aria-label="Toggle rail"></button>
                            </mona-sidebar>
                            <main monaSidebarInset data-testid="docked-inset-split-ltr" style="background: #f8fafc; padding: 8px;">
                                Docked Content Inset
                            </main>
                            <mona-sidebar
                                data-testid="docked-sidebar-end-split-ltr"
                                side="end"
                                [(expanded)]="dockedEndOpenSplitLtr"
                                collapsible="offcanvas"
                                [width]="120"
                                style="background: #fef08a;">
                                <div style="padding: 8px;">Docked End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView (overflowing pager)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-split-ltr"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-slider-split-rtl-0" (click)="sliderValueSplitRtl.set(0)">0</button>
                            <button type="button" data-testid="set-slider-split-rtl-20" (click)="sliderValueSplitRtl.set(20)">20</button>
                            <button type="button" data-testid="set-slider-split-rtl-50" (click)="sliderValueSplitRtl.set(50)">50</button>
                            <button type="button" data-testid="set-slider-split-rtl-80" (click)="sliderValueSplitRtl.set(80)">80</button>
                            <button type="button" data-testid="set-slider-split-rtl-100" (click)="sliderValueSplitRtl.set(100)">100</button>
                        </div>
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
                        <div style="display: flex; gap: 4px; margin-top: 32px; position: relative; z-index: 10;">
                            <button type="button" data-testid="set-range-split-rtl-0-100" (click)="rangeValueSplitRtl.set([0, 100])">[0, 100]</button>
                            <button type="button" data-testid="set-range-split-rtl-20-80" (click)="rangeValueSplitRtl.set([20, 80])">[20, 80]</button>
                            <button type="button" data-testid="set-range-split-rtl-40-60" (click)="rangeValueSplitRtl.set([40, 60])">[40, 60]</button>
                        </div>
                    </div>

                    <!-- Sidebar Drawer Layout -->
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

                    <!-- Sidebar Docked Layout -->
                    <div style="width: 450px; height: 190px; border: 1px solid #94a3b8; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">Sidebar Docked Layout (breakpoint=0)</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button type="button" data-testid="toggle-docked-start-split-rtl" (click)="dockedStartOpenSplitRtl.set(!dockedStartOpenSplitRtl())">Toggle Start</button>
                            <button type="button" data-testid="toggle-docked-end-split-rtl" (click)="dockedEndOpenSplitRtl.set(!dockedEndOpenSplitRtl())">Toggle End</button>
                        </div>
                        <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 130px;" data-testid="docked-layout-split-rtl">
                            <mona-sidebar
                                data-testid="docked-sidebar-start-split-rtl"
                                side="start"
                                [(expanded)]="dockedStartOpenSplitRtl"
                                collapsible="icon"
                                [width]="120"
                                [iconWidth]="40"
                                style="background: #e0f2fe;">
                                <div style="padding: 8px;">Docked Start</div>
                                <button monaSidebarRail data-testid="docked-rail-start-split-rtl" aria-label="Toggle rail"></button>
                            </mona-sidebar>
                            <main monaSidebarInset data-testid="docked-inset-split-rtl" style="background: #f8fafc; padding: 8px;">
                                Docked Content Inset
                            </main>
                            <mona-sidebar
                                data-testid="docked-sidebar-end-split-rtl"
                                side="end"
                                [(expanded)]="dockedEndOpenSplitRtl"
                                collapsible="offcanvas"
                                [width]="120"
                                style="background: #fef08a;">
                                <div style="padding: 8px;">Docked End</div>
                            </mona-sidebar>
                        </mona-sidebar-layout>
                    </div>

                    <!-- ScrollView -->
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView (overflowing pager)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-split-rtl"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>

            <!-- 5. Dynamic dir mutation fixture -->
            <section
                id="fixture-dynamic-dir"
                data-testid="fixture-dynamic-dir"
                [attr.dir]="dynamicDir()"
                style="border: 2px solid #8b5cf6; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #6d28d9;">5. Dynamic Dir Mutation</h2>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button type="button" data-testid="set-dynamic-ltr" (click)="dynamicDir.set('ltr')">Set LTR</button>
                    <button type="button" data-testid="set-dynamic-rtl" (click)="dynamicDir.set('rtl')">Set RTL</button>
                </div>
                <div style="width: 450px; height: 180px; border: 1px solid #94a3b8; position: relative;">
                    <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 140px;" data-testid="docked-layout-dynamic">
                        <mona-sidebar
                            data-testid="docked-sidebar-start-dynamic"
                            side="start"
                            [expanded]="true"
                            [width]="120"
                            style="background: #e0f2fe;">
                            <div style="padding: 8px;">Dynamic Start</div>
                        </mona-sidebar>
                        <main monaSidebarInset data-testid="docked-inset-dynamic" style="background: #f8fafc; padding: 8px;">
                            Dynamic Inset
                        </main>
                        <mona-sidebar
                            data-testid="docked-sidebar-end-dynamic"
                            side="end"
                            [expanded]="true"
                            [width]="120"
                            style="background: #fef08a;">
                            <div style="padding: 8px;">Dynamic End</div>
                        </mona-sidebar>
                    </mona-sidebar-layout>
                </div>

                <!-- Dynamic ScrollView -->
                <div style="margin-top: 16px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px;">Dynamic ScrollView (overflowing pager)</h3>
                    <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                        <button type="button" data-testid="set-dynamic-pages-40" (click)="dynamicPageCount.set(40)">40 Pages</button>
                        <button type="button" data-testid="set-dynamic-pages-8" (click)="dynamicPageCount.set(8)">8 Pages</button>
                        <button type="button" data-testid="set-dynamic-pages-2" (click)="dynamicPageCount.set(2)">2 Pages</button>
                    </div>
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <mona-scroll-view
                            data-testid="scroll-view-dynamic"
                            [data]="dynamicPages()"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                </div>
            </section>

            <!-- 6. Dynamic CSS ancestor class toggle fixture -->
            <section
                id="fixture-dynamic-css"
                data-testid="fixture-dynamic-css"
                dir="ltr"
                style="border: 2px solid #06b6d4; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #0891b2;">6. Dynamic CSS-Only Ancestor Class Toggle</h2>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button type="button" data-testid="set-css-ltr" (click)="dynamicCssClass.set('')">Set CSS LTR</button>
                    <button type="button" data-testid="set-css-rtl" (click)="dynamicCssClass.set('direction-rtl')">Set CSS RTL</button>
                </div>
                <div [class]="dynamicCssClass()" style="width: 450px; height: 180px; border: 1px solid #94a3b8; position: relative;">
                    <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 140px;" data-testid="docked-layout-dynamic-css">
                        <mona-sidebar
                            data-testid="docked-sidebar-start-dynamic-css"
                            side="start"
                            [expanded]="true"
                            [width]="120"
                            style="background: #e0f2fe;">
                            <div style="padding: 8px;">CSS Dynamic Start</div>
                        </mona-sidebar>
                        <main monaSidebarInset data-testid="docked-inset-dynamic-css" style="background: #f8fafc; padding: 8px;">
                            CSS Dynamic Inset
                        </main>
                        <mona-sidebar
                            data-testid="docked-sidebar-end-dynamic-css"
                            side="end"
                            [expanded]="true"
                            [width]="120"
                            style="background: #fef08a;">
                            <div style="padding: 8px;">CSS Dynamic End</div>
                        </mona-sidebar>
                    </mona-sidebar-layout>
                </div>
            </section>

            <!-- 7. Dynamic Viewport Responsive CSS Fixture -->
            <section
                id="fixture-responsive-css"
                data-testid="fixture-responsive-css"
                dir="ltr"
                style="border: 2px solid #ec4899; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #be185d;">7. Dynamic Responsive Media Query Direction</h2>
                <div class="responsive-dir-container" style="width: 450px; height: 180px; border: 1px solid #94a3b8; position: relative;">
                    <mona-sidebar-layout [mobileBreakpoint]="0" style="width: 100%; height: 140px;" data-testid="docked-layout-responsive">
                        <mona-sidebar
                            data-testid="docked-sidebar-start-responsive"
                            side="start"
                            [expanded]="true"
                            [width]="120"
                            style="background: #e0f2fe;">
                            <div style="padding: 8px;">Responsive Start</div>
                        </mona-sidebar>
                        <main monaSidebarInset data-testid="docked-inset-responsive" style="background: #f8fafc; padding: 8px;">
                            Responsive Inset
                        </main>
                        <mona-sidebar
                            data-testid="docked-sidebar-end-responsive"
                            side="end"
                            [expanded]="true"
                            [width]="120"
                            style="background: #fef08a;">
                            <div style="padding: 8px;">Responsive End</div>
                        </mona-sidebar>
                    </mona-sidebar-layout>
                </div>
            </section>

            <!-- 8. Dynamic CSS-only Shadow DOM Ancestor Direction -->
            <section
                id="fixture-shadow-dom"
                data-testid="fixture-shadow-dom"
                dir="ltr"
                style="border: 2px solid #14b8a6; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #0f766e;">8. Dynamic CSS-Only Shadow DOM Ancestor Direction</h2>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button type="button" data-testid="set-shadow-ltr" (click)="shadowFixtureRef().shadowDirection.set('ltr')">Set Shadow LTR</button>
                    <button type="button" data-testid="set-shadow-rtl" (click)="shadowFixtureRef().shadowDirection.set('rtl')">Set Shadow RTL</button>
                </div>
                <app-shadow-sidebar-fixture #shadowFixture data-testid="shadow-fixture-host" />
            </section>

            <!-- 9. ScrollView Animation / Reduced Motion Fixture -->
            <section
                id="fixture-scroll-view-reduced-motion"
                data-testid="fixture-scroll-view-reduced-motion"
                dir="ltr"
                style="border: 2px solid #6366f1; border-radius: 8px; padding: 16px; background: #fafafa;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #4338ca;">9. ScrollView Animation and Reduced Motion</h2>
                <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView Standard (animate=true)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-anim-standard"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView Custom Duration (animate=1200)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-anim-custom"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true"
                            [animate]="1200">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
                                    {{ item.title }}
                                </div>
                            </ng-template>
                        </mona-scroll-view>
                    </div>
                    <div style="width: 300px; height: 170px; border: 1px solid #cbd5e1; position: relative;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px;">ScrollView Disabled (animate=false)</h3>
                        <mona-scroll-view
                            data-testid="scroll-view-anim-disabled"
                            [data]="manyPages"
                            [width]="300"
                            [height]="130"
                            [arrows]="true"
                            [infinite]="true"
                            [pageable]="true"
                            [animate]="false">
                            <ng-template let-item>
                                <div style="width: 300px; height: 90px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-weight: bold;">
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
    public readonly dockedEndOpenLtr = signal(true);
    public readonly dockedEndOpenRtl = signal(true);
    public readonly dockedEndOpenSplitLtr = signal(true);
    public readonly dockedEndOpenSplitRtl = signal(true);
    public readonly dockedStartOpenLtr = signal(true);
    public readonly dockedStartOpenRtl = signal(true);
    public readonly dockedStartOpenSplitLtr = signal(true);
    public readonly dockedStartOpenSplitRtl = signal(true);
    public readonly dynamicCssClass = signal("");
    public readonly dynamicDir = signal<"ltr" | "rtl">("ltr");
    public readonly dynamicPageCount = signal(40);
    public readonly dynamicPages = computed(() => this.manyPages.slice(0, this.dynamicPageCount()));
    public readonly manyPages: FixturePageItem[] = Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        title: `Page ${i + 1}`
    }));
    public readonly rangeValueLtr = signal<[number, number]>([20, 80]);
    public readonly rangeValueRtl = signal<[number, number]>([20, 80]);
    public readonly rangeValueSplitLtr = signal<[number, number]>([20, 80]);
    public readonly rangeValueSplitRtl = signal<[number, number]>([20, 80]);
    public readonly shadowFixtureRef = viewChild.required<ShadowSidebarFixtureComponent>("shadowFixture");
    public readonly sidebarEndOpenLtr = signal(false);
    public readonly sidebarEndOpenRtl = signal(false);
    public readonly sidebarEndOpenSplitLtr = signal(false);
    public readonly sidebarEndOpenSplitRtl = signal(false);
    public readonly sidebarStartOpenLtr = signal(false);
    public readonly sidebarStartOpenRtl = signal(false);
    public readonly sidebarStartOpenSplitLtr = signal(false);
    public readonly sidebarStartOpenSplitRtl = signal(false);
    public readonly sliderValueLtr = signal(20);
    public readonly sliderValueRtl = signal(20);
    public readonly sliderValueSplitLtr = signal(20);
    public readonly sliderValueSplitRtl = signal(20);
}
