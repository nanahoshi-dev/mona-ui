import { NavigationItem } from "./NavigationItem";

export interface NavigationGroup {
    items: NavigationItem[];
    path: string;
    title: string;
}
