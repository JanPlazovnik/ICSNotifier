import dayjs from "dayjs";
import express from "express";
import {ICSDataObject, WeeklySchedule} from './interfaces';
import { fetchParsedICS, notify, log, weekdays } from './utils';
import * as fs from "fs";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json())
const refreshTime = process.env.INTERVAL && parseInt(process.env.INTERVAL) || 5;
// const activeGroups = ["RIT 2 VS", ""];
const activeGroups: string[] = [];
let ICSData = [] as ICSDataObject[];

function removePastEvents(cal: ICSDataObject[]) {
    return cal.filter(item => {
        const start = dayjs(item.start);
        const current = dayjs();
        if (start.isAfter(current)) {
            return start;
        }
    });
}

function removeBadEvents(cal: ICSDataObject[], filter: string[]) {
    return cal.filter(item => {
        const eventGroup = item.description.split(",").pop()?.trim();
        for (const allowedGroup of filter) {
            if (eventGroup == allowedGroup) {
                return true;
            }
        }
    });
}

const triggerFileUpdateReminder = () => notify("Empty schedule", "Next class wasn't found. Update the schedule file.");

const triggerNextEvent = (event: ICSDataObject, diff: number) => notify(event.summary, `Event is starting in ${diff} minutes.`);

function checkNextEvent() {
    ICSData = removeBadEvents(removePastEvents(ICSData), activeGroups);
    if (ICSData.length <= 0) return triggerFileUpdateReminder();

    const currentItem = ICSData[0];
    log(`Next up: ${currentItem.summary}`);
    const start = dayjs(currentItem.start);
    const current = dayjs();
    const diff = start.diff(current, 'm');

    if (diff >= 5 && diff <= 15) {
        triggerNextEvent(currentItem, diff);
    }
}

// try {
//     ICSData = fetchParsedICS();
//     checkNextEvent();
//     setInterval(() => checkNextEvent(), refreshTime * 60 * 1000);
// }
// catch (error: any) {
//     notify("Error", error.message);
// }

function splitSchedule(data: ICSDataObject[]): WeeklySchedule {
    const schedule = {
        "monday": [] as ICSDataObject[],
        "tuesday": [] as ICSDataObject[],
        "wednesday": [] as ICSDataObject[],
        "thursday": [] as ICSDataObject[],
        "friday": [] as ICSDataObject[],
        "saturday": [] as ICSDataObject[],
        "sunday": [] as ICSDataObject[],
    } as WeeklySchedule;

    for (const event of data) {
        const start = dayjs(event.start);
        delete event.type;
        delete event.dtstamp;
        delete event.params;
        schedule[weekdays[start.day()]].push(event);
    }

    return schedule;
}

splitSchedule(fetchParsedICS())

app.get("/api/schedule/week", (req, res) => res.json(splitSchedule(fetchParsedICS())))
app.get("/api/schedule/day/:name", (req, res) => {
    console.log("Got request");
    console.log("Headers", req.headers);
    console.log("Params", req.params)
    return res.json(splitSchedule(fetchParsedICS())[req.params.name] ?? []);
})

// Mock Database
const attendanceData = JSON.parse(fs.readFileSync(__dirname + "/data.json", "utf-8")) as {[key: string]: any}

app.get("/api/users/:id/attendance", (req, res) => {
    const data = attendanceData[req.params.id]
    if (data) {
        return res.status(200).json(data)
    }
    return res.status(404).send()
})
app.post("/api/users/:id/attendance", (req, res) => {
    const {status, eventId} = req.body
    let userData = attendanceData[req.params.id]
    if (!userData) {
        userData = attendanceData[req.params.id] = []
    }
    userData.push({
        timestamp: +new Date(),
        status,
        eventId
    })
    fs.writeFileSync(__dirname + "/data.json", JSON.stringify(attendanceData, null, 4));
    return res.status(200).json(userData)
})
app.put("/api/users/:id/attendance/:att_id", (req, res) => {})
app.delete("/api/users/:id/attendance/:att_id", (req, res) => {})

app.listen(3000, () => console.log("Running!"));