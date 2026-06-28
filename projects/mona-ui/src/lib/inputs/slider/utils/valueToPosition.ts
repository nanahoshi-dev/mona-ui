export const valueToPosition = (value: number, min: number, max: number): number => {
    if (value <= min) {
        return 0;
    }
    if (value >= max) {
        return 100;
    }
    if (max === min) {
        return 0;
    }
    return ((value - min) / (max - min)) * 100;
};
