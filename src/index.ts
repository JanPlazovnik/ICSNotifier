import path from "path";
import ical from "ical";
import moment from "moment";
import notifier from "node-notifier";
import { ICSParsedData, ICSDataObject } from './interfaces';

const refreshTime = process.env.INTERVAL && parseInt(process.env.INTERVAL) || 5;

let ICSData = Object.values(ical.parseFile(path.resolve(__dirname) + "/files/calendar.ics")) as ICSParsedData;

function log(message: string) {
  console.log(`${(moment().format("LLL"))} - ${message}`);
}

function notify(title: string, message: string) {
  log(`${title}: ${message}`);
  notifier.notify({
    title,
    message,
    icon: 'E:/DEV/ICSNotifier/src/assets/FERI.png',
    contentImage: `E:/DEV/ICSNotifier/src/assets/FERI.png`
  });
}

function removePastEvents(cal: ICSParsedData) {
  return cal.filter(item => {
    const start = moment(item.start);
    const current = moment();
      if (start.isAfter(current))
        return start;
  });
}

function removeBadEvents(cal: ICSParsedData, filter: Array<string>) {
  return cal.filter(item => {
    const eventGroup = item.description.split(",").pop()?.trim();
    for (const allowedGroup of filter) {
      if (eventGroup == allowedGroup) return true;
    }
  });
}

const triggerFileUpdateReminder = () => notify("ICSNotifier", "Next class wasn't found. Update the schedule file.");

const triggerNextEvent = (event: ICSDataObject, diff: number) => notify(event.summary, `Event is starting in ${diff} minutes.`);

function checkNextEvent() {
  const groups = ["RIT 1 VS", "RIT 1 VS RV 2", "RIT 1 VS RV2"];
  ICSData = removeBadEvents(removePastEvents(ICSData), groups);
  if (ICSData.length <= 0) return triggerFileUpdateReminder();

  const currentItem = ICSData[0];
  log(`Next up: ${currentItem.summary}`);
  const start = moment(currentItem.start);
  const current = moment();
  const diff = start.diff(current, 'm');

  if (diff >= 5 && diff <= 15)
    triggerNextEvent(currentItem, diff);
}

// initial run
checkNextEvent();
setInterval(() => checkNextEvent(), refreshTime * 60 * 1000);
