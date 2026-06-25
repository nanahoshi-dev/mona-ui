import type { LucideIconInput } from "@lucide/angular";

export interface NavigationItem {
    icon?: LucideIconInput;
    path: string;
    text: string;
}
