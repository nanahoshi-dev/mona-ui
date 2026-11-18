/** A place in the playgrounds of the dropdown tree and the multi-select tree. */
export interface DemoPlace {
    readonly id: string;
    readonly name: string;
    readonly places?: readonly DemoPlace[];
}

export const demoPlaces: readonly DemoPlace[] = [
    {
        id: "europe",
        name: "Europe",
        places: [
            {
                id: "germany",
                name: "Germany",
                places: [
                    { id: "berlin", name: "Berlin" },
                    { id: "hamburg", name: "Hamburg" },
                    { id: "munich", name: "Munich" }
                ]
            },
            {
                id: "italy",
                name: "Italy",
                places: [
                    { id: "milan", name: "Milan" },
                    { id: "rome", name: "Rome" }
                ]
            },
            {
                id: "turkiye",
                name: "Türkiye",
                places: [
                    { id: "ankara", name: "Ankara" },
                    { id: "istanbul", name: "Istanbul" },
                    { id: "izmir", name: "İzmir" }
                ]
            }
        ]
    },
    {
        id: "asia",
        name: "Asia",
        places: [
            {
                id: "japan",
                name: "Japan",
                places: [
                    { id: "osaka", name: "Osaka" },
                    { id: "tokyo", name: "Tokyo" }
                ]
            },
            {
                id: "south-korea",
                name: "South Korea",
                places: [
                    { id: "busan", name: "Busan" },
                    { id: "seoul", name: "Seoul" }
                ]
            }
        ]
    },
    {
        id: "americas",
        name: "Americas",
        places: [
            {
                id: "brazil",
                name: "Brazil",
                places: [
                    { id: "rio", name: "Rio de Janeiro" },
                    { id: "sao-paulo", name: "São Paulo" }
                ]
            },
            {
                id: "canada",
                name: "Canada",
                places: [
                    { id: "montreal", name: "Montréal" },
                    { id: "toronto", name: "Toronto" }
                ]
            }
        ]
    }
];
