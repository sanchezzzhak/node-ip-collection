import { Address4, Address6 } from 'ip-address';

export interface IpCollectionOptions {
  resultFormat?: "default" | "stat-result"
}

export type DefaultResult = string[] | number[];

export interface StatResult {
  time: number;
  result: DefaultResult;
}

export type IpType = 'v4' | 'v6' | 'unk';

export interface DataSize {
  v4: number
  v6: number;
}

export default class IpCollection {
  get size(): DataSize;

  get height(): DataSize;

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

  clear(): void;

}
