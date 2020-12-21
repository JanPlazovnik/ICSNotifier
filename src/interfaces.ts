export interface ICSDataObject {
  uid: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
}

export type ICSParsedData = Array<ICSDataObject>;