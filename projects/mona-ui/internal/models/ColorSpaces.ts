export interface RGB {
    r: number | null;
    g: number | null;
    b: number | null;
}

export interface RGBA extends RGB {
    a: number | null;
}

export interface HSV {
    h: number | null;
    s: number | null;
    v: number | null;
}

export interface HSVA extends HSV {
    a: number | null;
}

export type RGBChannel = keyof RGB;
export type RGBAChannel = keyof RGBA;
export type HSVChannel = keyof HSV;

export type Channel = RGBAChannel | HSVChannel;

export interface HSL {
    h: number | null;
    s: number | null;
    l: number | null;
}

export interface HSLA extends HSL {
    a: number | null;
}
