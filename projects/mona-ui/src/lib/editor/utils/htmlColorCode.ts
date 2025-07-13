export const htmlColorCode = (name: string): string => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
        return "";
    }
    context.fillStyle = name;
    return context.fillStyle;
};
