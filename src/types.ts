export type TronValue =
  | string
  | number
  | boolean
  | null
  | TronValue[]
  | { [key: string]: TronValue }
  | TronClassInstance;

export interface TronClassInstance {
  _class: string;
  _args: TronValue[];
}

export interface ClassDefinition {
  name: string;
  properties: string[];
}
