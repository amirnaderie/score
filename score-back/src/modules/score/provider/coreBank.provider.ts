import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { logTypes } from 'src/modules/event/enums/logType.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; // Add this import

@Injectable()
export class BankCoreProvider {
  private loginUrl: string;
  private depositUrl: string;
  private getCustomerDetail: string;
  private apiKey: string;

  private expiration: string;
  private userName: string;
  private password: string;

  constructor(
    private configService: ConfigService,
    //  @Inject('REDIS_CLIENT')
    //   private readonly redis: Redis,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.loginUrl = this.configService.get<string>('BANKCORE_LOGIN_URL');
    this.depositUrl = this.configService.get<string>('BANKCORE_DEPOSIT_URL');
    this.getCustomerDetail = this.configService.get<string>(
      'BANKCORE_GET_CUSTOMER_BRIEF_DETAIL_URL',
    );
    this.apiKey = this.configService.get<string>('BANKCORE_API_KEY');
    this.userName = this.configService.get<string>('BANKCORE_USERNAME');
    this.password = this.configService.get<string>('BANKCORE_PASSWORD');
    this.expiration = this.configService.get<string>(
      'BANKCORE_SESSIONID_EXPIRATION',
    );
  }

  async login(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.loginUrl}`,
        { username: this.userName, password: this.password },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
        },
      );
      return response.data?.result?.sessionId;
    } catch (error) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.ERROR,
          fileName: 'coreBank.provide.ts',
          method: 'login',
          message: error.message || 'Error in login',
          requestBody: '',
          stack: error.stack,
        }),
      );
      throw error;
    }
  }

  async getsessionId(): Promise<string> {
    let sessionId;
    try {
      //sessionId = await this.cacheManager.get<string>('coreBankingSeesionId'); // Remove (this.cacheManager as any)

      //if (sessionId) return sessionId;
      sessionId = await this.login();

      // await this.cacheManager.set(
      //   'coreBankingSeesionId',
      //   sessionId,
      //   Number(this.expiration),
      // );

      return sessionId;
    } catch (error) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.ERROR,
          fileName: 'coreBank.provide.ts',
          method: 'getsessionId',
          message: error.message || 'Error in getsessionId',
          requestBody: '',
          stack: error.stack,
        }),
      );
      throw error;
    }
  }

  async getCustomerBriefDetail(nationalCode: number): Promise<any> {
    const sessionId = await this.getsessionId();

    const url = `${this.getCustomerDetail}?context=[{"key":"SESSIONID","value":"${sessionId}"}]`;
    try {
      const response = await axios.post(
        url,
        {
          ssn:
            nationalCode.toString().length < 11
              ? nationalCode.toString().padStart(10, '0')
              : null,
          corporationId:
            nationalCode.toString().length === 11
              ? nationalCode.toString()
              : null,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
            // If you need to set a static or dynamic cookie, add it here:
            // 'Cookie': 'cookiesession1=678B286AF6E8CEA6559DD0AA7F5B527B',
          },
          // If you need to send cookies, you can use 'withCredentials: true' and set up axios accordingly.
        },
      );
      if (
        response.status == 200 &&
        response?.data?.result?.customerBriefDetailInfoBeans.length > 0
      ) {
        const { cif, name } =
          response?.data?.result?.customerBriefDetailInfoBeans[0];
        return { cif, name };
      } else {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.ERROR,
            fileName: 'coreBank.provide.ts',
            method: 'getCustomerBriefDetail',
            message: `getCustomerBriefDetail not found data for nationalCode:${nationalCode}`,
            requestBody: JSON.stringify({ nationalCode }),
            stack: '',
          }),
        );
        throw new NotFoundException('مشتری یافت نشد');
      }
    } catch (error) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.ERROR,
          fileName: 'coreBank.provide.ts',
          method: 'getCustomerBriefDetail',
          message: error.message || 'Error in getCustomerBriefDetail',
          requestBody: JSON.stringify({ nationalCode }),
          stack: error.stack,
        }),
      );
      throw error;
    }
  }

  /**
   * Calls the deposit API with the provided cif and depositNumber(s).
   * @param cif - The customer identification file number.
   * @param depositNumber - Array of deposit numbers.
   * @returns The API response data.
   */
  async getDepositDetail(
    cif: string | number,
    depositNumber: (string | number)[],
  ): Promise<any> {
    const sessionId = await this.getsessionId();
    const url = `${this.depositUrl}?context=[{"key":"SESSIONID","value":"${sessionId}"}]`;
    try {
      const response = await axios.post(
        url,
        {
          cif: cif.toString(),
          depositNumbers: depositNumber.map((d) => d.toString()),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
            // 'Cookie': 'cookiesession1=678B286AF6E8CEA6559DD0AA7F5B527B',
          },
        },
      );
      if (
        response.status == 200 &&
        response?.data?.result?.depositBeans.length > 0
      ) {
        const foundDeposit = response?.data?.result?.depositBeans.find(
          (item) => item.depositNumber === depositNumber[0].toString(),
        );
        if (!foundDeposit|| foundDeposit.depositType!==1206 ) {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.ERROR,
              fileName: 'coreBank.provide.ts',
              method: 'getDepositDetail',
              message: `deposit not found data for cif:${cif} and depositNumber:${depositNumber}`,
              requestBody: JSON.stringify({ cif, depositNumber }),
              stack: '',
            }),
          );
          throw new NotFoundException('حساب یافت نشد');
        }
        return foundDeposit;
      } else {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.ERROR,
            fileName: 'coreBank.provide.ts',
            method: 'getDepositDetail',
            message: `deposit not found data for cif:${cif} and depositNumber:${depositNumber}`,
            requestBody: JSON.stringify({ cif, depositNumber }),
            stack: '',
          }),
        );
        throw new NotFoundException('مشتری یافت نشد');
      }
    } catch (error) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.ERROR,
          fileName: 'coreBank.provide.ts',
          method: 'getDepositDetail',
          message: error.message || 'Error in getDepositDetail',
          requestBody: JSON.stringify({ cif, depositNumber }),
          stack: error.stack,
        }),
      );
      throw error;
    }
  }
}
