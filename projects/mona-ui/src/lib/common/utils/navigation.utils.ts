export enum NavigationKeys {
    ArrowUp = "ArrowUp",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",
    Enter = "Enter",
    Escape = "Escape",
    Home = "Home",
    End = "End",
    PageDown = "PageDown",
    PageUp = "PageUp",
    Space = " "
}

export const NavigationKeysList = Object.keys(NavigationKeys);

export const isNavigationKey = (key: string): boolean => {
    return NavigationKeysList.includes(key);
};
