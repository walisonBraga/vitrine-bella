import { Type } from "@angular/core";

export interface Dashboard {
  id: number;
  label: string;
  content: Type<unknown>
}
