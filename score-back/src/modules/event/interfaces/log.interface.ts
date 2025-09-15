import { logTypes } from '../../log/enums/logType.enum';

export interface LogParams {
  logTypes: logTypes;
  fileName: string;
  method: string;
  lineNumber?: number;
  message: string;
  stack: string | null | undefined;
  requestBody?: string;
}
