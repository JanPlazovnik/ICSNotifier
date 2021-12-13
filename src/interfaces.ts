export interface ICSDataObject {
    uid: string;
    summary: string;
    description: string;
    location: string;
    start: Date;
    end: Date;

    params?: string[];
    dtstamp?: Date;
    type?: string;
}

export type WeeklySchedule = {[key: string]: ICSDataObject[]}