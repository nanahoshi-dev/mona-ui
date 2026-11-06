import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, model } from "@angular/core";
import { LucideArrowDown, LucideArrowUp, LucideSettings } from "@lucide/angular";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import {
    AccordionComponent,
    ExpansionPanelActionsTemplateDirective,
    ExpansionPanelComponent,
    ExpansionPanelIconTemplateDirective,
    ExpansionPanelTitleTemplateDirective
} from "@nanahoshi/mona-ui/expansion-panel";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { NgComponentOutlet } from "@angular/common";

const TITLE_TEMPLATE_CODE = `<ng-template monaExpansionPanelTitleTemplate>
    <span class="text-sm uppercase" [style.color]="country.color">{{ country.name }}</span>
</ng-template>`;

const ICON_TEMPLATE_CODE = `<ng-template monaExpansionPanelIconTemplate let-expanded>
    <div class="px-2">
        @if (expanded) {
            <svg lucideArrowUp [size]="14"></svg>
        } @else {
            <svg lucideArrowDown [size]="14"></svg>
        }
    </div>
</ng-template>`;

const ACTIONS_TEMPLATE_CODE = `<ng-template monaExpansionPanelActionsTemplate>
    <button
        monaButton
        look="ghost"
        [size]="'small'"
        [iconOnly]="true"
        aria-label="Settings"
        (click)="openSettings()">
        <svg lucideSettings [size]="14"></svg>
    </button>
</ng-template>`;

const ACCORDION_CODE = `<mona-accordion>
    <mona-expansion-panel title="Japan">...</mona-expansion-panel>
    <mona-expansion-panel title="China">...</mona-expansion-panel>
</mona-accordion>`;

@Component({
    selector: "app-expansion-panel-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./expansion-panel-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionPanelDemoComponent extends AbstractDemoComponent<ExpansionPanelComponent> {
    readonly #injector = createFeatureInjector({
        accordion: {
            active: false,
            code: ACCORDION_CODE,
            name: "Accordion",
            description: "Wrap the panels in mona-accordion: one open at a time, and arrow keys between the headers."
        },
        multiple: {
            active: false,
            code: `<mona-accordion multiple>...</mona-accordion>`,
            name: "Multiple",
            description: "Let several panels in the accordion stay open."
        },
        actionsTemplate: {
            active: false,
            code: ACTIONS_TEMPLATE_CODE,
            name: "Actions Template",
            description: "Custom template for the expansion panel actions."
        },
        iconTemplate: {
            active: false,
            code: ICON_TEMPLATE_CODE,
            name: "Icon Template",
            description: "Custom template for the expansion panel icon."
        },
        titleTemplate: {
            active: false,
            code: TITLE_TEMPLATE_CODE,
            name: "Title Template",
            description: "Custom template for the expansion panel title."
        }
    });
    protected readonly config = computed<ComponentConfig<ExpansionPanelComponent>>(() => ({
        inputs: deriveInputConfig<ExpansionPanelComponent>(this.metadata(), {
            headingLevel: {
                type: "number",
                value: 3,
                nullable: true,
                min: 1,
                max: 6
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "none"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ExpansionPanelComponent");
    protected readonly ExpansionPanelWrapperComponent = ExpansionPanelWrapperComponent;
}

@Component({
    imports: [
        AccordionComponent,
        ExpansionPanelComponent,
        ExpansionPanelTitleTemplateDirective,
        ExpansionPanelActionsTemplateDirective,
        ButtonDirective,
        ExpansionPanelIconTemplateDirective,
        LucideArrowUp,
        LucideArrowDown,
        LucideSettings
    ],
    template: `
        @let featureData = features();
        @if (featureData["accordion"].active) {
            <mona-accordion [multiple]="featureData['multiple'].active">
                @for (country of countryData; track $index) {
                    <mona-expansion-panel
                        [class]="userClass()"
                        [disabled]="disabled()"
                        [headingLevel]="headingLevel()"
                        [rounded]="rounded()"
                        [title]="title() || country.name">
                        <p class="w-full h-full p-2 text-justify">{{ country.description }}</p>
                    </mona-expansion-panel>
                }
            </mona-accordion>
        } @else {
            @for (country of countryData; track $index) {
                <mona-expansion-panel
                    [class]="userClass()"
                    [disabled]="disabled()"
                    [expanded]="expanded()"
                    [headingLevel]="headingLevel()"
                    [rounded]="rounded()"
                    [title]="title() || country.name">
                    <p class="w-full h-full p-2 text-justify">{{ country.description }}</p>
                    @if (featureData["titleTemplate"].active) {
                        <ng-template monaExpansionPanelTitleTemplate>
                            <span class="text-sm uppercase" [style.color]="country.color">{{ country.name }}</span>
                        </ng-template>
                    }
                    @if (featureData["iconTemplate"].active) {
                        <ng-template monaExpansionPanelIconTemplate let-expanded>
                            <div class="px-2">
                                @if (expanded) {
                                    <svg lucideArrowUp [size]="14"></svg>
                                } @else {
                                    <svg lucideArrowDown [size]="14"></svg>
                                }
                            </div>
                        </ng-template>
                    }
                    @if (featureData["actionsTemplate"].active) {
                        <ng-template monaExpansionPanelActionsTemplate>
                            <button
                                monaButton
                                look="ghost"
                                [size]="'small'"
                                [iconOnly]="true"
                                aria-label="Settings"
                                type="button">
                                <svg lucideSettings [size]="14"></svg>
                            </button>
                        </ng-template>
                    }
                </mona-expansion-panel>
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full gap-0!"
    }
})
class ExpansionPanelWrapperComponent implements ComponentInputsAsSignal<ExpansionPanelComponent> {
    protected readonly countryData = [
        {
            name: "Japan",
            description: `
                Japan is an island country in East Asia. Located in the Pacific Ocean off the northeast coast of the Asian mainland, it is bordered to the west by the Sea of Japan and extends from the Sea of Okhotsk in the north to the East China Sea in the south. The Japanese archipelago consists of four major islands alongside 14,121 smaller islands. Japan is divided into 47 administrative prefectures and eight traditional regions, and around 75% of its terrain is mountainous and heavily forested, concentrating its agriculture and highly urbanized population along its eastern coastal plains. With a population of over 123 million as of 2025, it is the world's 11th most populous country. Tokyo is the country's capital and largest city.
            `,
            color: "#BC002D"
        },
        {
            name: "China",
            description: `
                China, officially the People's Republic of China (PRC), is a country in East Asia. With a population exceeding 1.4 billion, it is the second-most populous country after India, representing 17% of the world population. China borders fourteen countries by land across an area of 9.6 million square kilometers (3,700,000 sq mi), making it the third-largest country by area. The country is divided into 33 province-level divisions: 22 provinces, 5 autonomous regions, 4 municipalities, and 2 semi-autonomous special administrative regions. Beijing is the capital, while Shanghai is the most populous city by urban area and largest financial center.
            `,
            color: "#EE1C25"
        },
        {
            name: "South Korea",
            description: `
                South Korea, officially the Republic of Korea (ROK), is a country in East Asia. It constitutes the southern half of the Korean Peninsula and borders North Korea along the Korean Demilitarized Zone, with the Yellow Sea to the west and the Sea of Japan to the east. Like North Korea, South Korea claims to be the sole legitimate government of the entire peninsula and adjacent islands. It has a population of about 52 million, of which half live in the Seoul metropolitan area, the ninth most populous metropolitan area in the world; other major cities include Busan, Daegu, and Incheon.
            `,
            color: "#0F64CD"
        },
        {
            name: "Turkey",
            description: `
                Turkey, officially the Republic of Türkiye, is a country mainly located in Anatolia in West Asia, with a relatively small part called East Thrace in Southeast Europe. It borders the Black Sea to the north; Georgia, Armenia, Azerbaijan, and Iran to the east; Iraq, Syria, and the Mediterranean Sea to the south; and the Aegean Sea, Greece, and Bulgaria to the west. Turkey is home to over 85 million people; most are ethnic Turks, while Kurds are the largest ethnic minority. Officially a secular state, Turkey has a Muslim-majority population. Ankara is Turkey's capital and second-largest city. Istanbul is its largest city and economic center. Other major cities include İzmir, Bursa, and Antalya.
            `,
            color: "#C8102E"
        },
        {
            name: "Spain",
            description: `
                Spain, officially the Kingdom of Spain, is a country in Southern and Western Europe with territories in North Africa. Featuring the southernmost point of continental Europe, it is the largest country in Southern Europe and the fourth-most populous European Union (EU) member state. Spanning the majority of the Iberian Peninsula, its territory also includes the Canary Islands, in the Eastern Atlantic Ocean, the Balearic Islands, in the Western Mediterranean Sea, and the autonomous cities of Ceuta and Melilla, in mainland Africa. Peninsular Spain is bordered to the north by France, Andorra, and the Bay of Biscay; to the east and south by the Mediterranean Sea and Gibraltar; and to the west by Portugal and the Atlantic Ocean. Spain's capital and largest city is Madrid; other major urban areas include Barcelona, Valencia, Seville, Zaragoza, Málaga, Murcia, and Palma de Mallorca.
            `,
            color: "#F1BF00"
        }
    ];
    protected readonly features = inject(FeatureConfigHandler).data;

    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly expanded = model(false);
    public readonly headingLevel = input<number | null, unknown>(3, { transform: value => value as number | null });
    public readonly rounded = input<ReturnType<ExpansionPanelComponent["rounded"]>>("medium");
    public readonly title = input("");
    public readonly userClass = input("");
}
