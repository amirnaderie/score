import { LogParams } from "./interfaces/log.interface";

export class LogEvent {
    private logParams: LogParams;

    constructor(
        logParams: LogParams
    ) { 
        this.logParams = logParams;
    }

    getLogParams(): LogParams {
        return this.logParams;
    }
}