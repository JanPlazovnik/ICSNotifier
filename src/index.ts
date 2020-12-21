import path from "path";
import ical from "ical";
import moment from "moment";
import notifier from "node-notifier";
import { ICSParsedData, ICSDataObject } from './interfaces';

const refreshTime = process.env.INTERVAL && parseInt(process.env.INTERVAL) || 5;

let ICSData = Object.values(ical.parseFile(path.resolve(__dirname) + "/files/calendar.ics")) as ICSParsedData;

function removePastEvents (cal: ICSParsedData) {
  return cal.filter(item => {
    const start = moment(item.start);
    const current = moment();
      if (start.isAfter(current))
        return start;
  });
}

function removeBadEvents (cal: ICSParsedData, filter: Array<string>) {
  return cal.filter(item => {
    const event = item.description.split(",").pop()?.trim();
    for (const f of filter) {
      if (event == f) return true;
    }
  })
}

function triggerFileUpdateReminder () {
  log("Data is empty.");
  notifier.notify({
    title: "ICSNotifier",
    message: "The parsed ICS data is empty."
  });
}

function triggerNextEvent (event: ICSDataObject, diff: number) {
  const message = `Event ${event.summary} is starting in ${diff} minutes.`;
  log(message);
  notifier.notify({
    title: event.summary,
    message
  });
}

function log(message: string | object) {
  console.log(`${(moment().format("LLL"))} - ${message}`);
}

function checkNextEvent () {
  log("Checking events...");
  ICSData = removeBadEvents(removePastEvents(ICSData), ["RIT 1 VS", "RIT 1 VS RV 2"]);
  if (ICSData.length <= 0) return triggerFileUpdateReminder();

  const currentItem = ICSData[0];
  const start = moment(currentItem.start);
  const current = moment();
  const diff = start.diff(current, 'm');

  if (diff >= 5 && diff <= 15)
    triggerNextEvent(currentItem, diff);
}

// initial run
checkNextEvent();
setInterval(() => checkNextEvent(), refreshTime * 60 * 1000);