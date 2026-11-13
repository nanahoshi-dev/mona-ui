import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { LucideArrowUpRight } from "@lucide/angular";
import { MarkdownDocComponent } from "../../layout/components/markdown-doc/markdown-doc.component";

interface TechStackItem {
    readonly href: string;
    /** The brand's logo, from Devicon. None of the site's icon packages has brand logos. */
    readonly logo: string;
    readonly name: string;
    readonly version: string;
}

const DEVICON = "https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons";

const TECH_STACK: readonly TechStackItem[] = Object.freeze([
    {
        href: "https://angular.dev",
        logo: `${DEVICON}/angular/angular-original.svg`,
        name: "Angular",
        version: "22.0"
    },
    {
        href: "https://tailwindcss.com",
        logo: `${DEVICON}/tailwindcss/tailwindcss-original.svg`,
        name: "Tailwind CSS",
        version: "4.3"
    },
    {
        href: "https://www.typescriptlang.org",
        logo: `${DEVICON}/typescript/typescript-original.svg`,
        name: "TypeScript",
        version: "6.0"
    }
]);

@Component({
    selector: "app-introduction-doc",
    imports: [MarkdownDocComponent, LucideArrowUpRight, NgOptimizedImage],
    templateUrl: "./introduction-doc.component.html"
})
export class IntroductionDocComponent {
    protected readonly techStack = TECH_STACK;
}
