import path from "path";
import ical from "ical";
import fs from "fs";
import moment from "moment";
import { WindowsToaster } from "node-notifier";
import { ICSParsedData } from './interfaces';

const notifier = new WindowsToaster();

export function fetchParsedICS() {
  const ICSFile = fs.readFileSync(path.resolve(__dirname) + "/files/calendar.ics", 'utf-8');
  const parsedData = ical.parseICS(ICSFile);
  return Object.values(parsedData) as ICSParsedData;
}

export function log(message: string) {
  console.log(`${(moment().format("LLL"))} - ${message}`);
}

export function notify(title: string, message: string) {
  log(`${title}: ${message}`);
  notifier.notify({
    title,
    message,
    icon: path.join(__dirname, "/assets/FERI.png"),
    appID: "ICSNotifier"
  });
}