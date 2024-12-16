import { Address4, Address6 } from 'ip-address';

export interface IpCollectionOptions {
  useHash?: boolean;
  maxSearch?: number;
  dataV4?: string[];
  dataV6?: string[];
  dataValue?: DataValue;
  dataRange?: DataRange;
}

export interface DataValue {
  [key: string]: string | number;
}

export interface DataRange {
  [key: string]: Array<{ n: string; i?: number; v?: string | number }>;
}

export type IpType = 'v4' | 'v6' | 'unk';

export interface DataImport {
  dataV4: string[],
  dataV6: string[],
  dataRange: DataRange;
  dataValue?: DataValue
}

export default class IpCollection {

  constructor(options?: IpCollectionOptions);

  lookup(ip: string, all: boolean): any[];

  castIpV6ToNum(ip: string): string;

  castIpV4ToNum(ip: string): string;

  castBigIntIpToV4Str(val: bigint): string;

  castBigIntIpToV6Str(val: bigint): string;

  formatIP(ip: string): string;

  insertRange(start: string, end: string, ipType: IpType, value: string | number): void;

  insertRangeAddress(
    startAddr: Address6 | Address4,
    endAddr: Address6 | Address4,
    ipType: IpType,
    value: any
  ): void;

  loadFromString(listString: string, value: string | number): void;

  stringHash(str: string | number): number;

  export(): string;

  import(data: DataImport): void;

  clear(): void;

}