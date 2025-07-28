import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "randomColor"
})
export class RandomColorPipe implements PipeTransform {
    public transform(value: unknown): string {
        const randomColor = () => {
            const letters = "0123456789ABCDEF";
            let color = "#";
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        };
        return randomColor();
    }
}
