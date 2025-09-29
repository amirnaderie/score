import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Log } from '../entities/log.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import handelError from '../../../utility/handel-error';
import * as jalaali from 'jalaali-js';

@Injectable()
export class LogService {
  methods: string[];
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    private eventEmitter: EventEmitter2,
  ) {
    this.methods = [
      'transferScore',
      'createScore',
      'updateScore',
      'reverseTransfer',
    ];
  }

  public async getLogs(params: {
    from: string;
    to: string;
    page: number;
    limit: number;
    searchText: string;
    sortBy?: 'method' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
  }) {
    try {
      const {
        from,
        to,
        page,
        limit,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        searchText = '',
      } = params;

      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      const logs = await this.logRepository
        .createQueryBuilder('log')
        .where('log.createdAt >= :startDate', { startDate })
        .andWhere('log.createdAt <= :endDate', { endDate })
        .andWhere('log.method IN (:...methods)', { methods: this.methods })
        .andWhere('log.logTypes = :logType', { logType: 'info' })
        .orderBy(`log.${sortBy}`, sortOrder)
        .select(['log.method', 'log.createdAt', 'log.message'])
        .getMany();
      let filteredLogs;

      if (searchText)
        filteredLogs = logs.filter((log) => log.message.includes(searchText));
      else filteredLogs = logs;

      // Apply pagination to filtered results
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      const total = filteredLogs.length;

      return {
        data: paginatedLogs,
        page,
        limit,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      handelError(error, this.eventEmitter, 'log.service', 'getLogs', params);
    }
  }

  public async getOtherLogs(params: {
    from: string;
    to: string;
    page: number;
    limit: number;
    searchText: string;
    sortBy?: 'method' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
  }) {
    try {
      const {
        from,
        to,
        page,
        limit,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        searchText = '',
      } = params;


      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      const logs = await this.logRepository
        .createQueryBuilder('log')
        .where('log.createdAt >= :startDate', { startDate })
        .andWhere('log.createdAt <= :endDate', { endDate })
        .andWhere('log.method IN (:...methods)', { methods: this.methods })
        .andWhere('log.logTypes = :logType', { logType: 'info' })
        .orderBy(`log.${sortBy}`, sortOrder)
        .select(['log.method', 'log.createdAt', 'log.message'])
        .getMany();

      let filteredLogs;

      if (searchText)
        filteredLogs = logs.filter((log) => log.message.includes(searchText));
      else filteredLogs = logs;

      // Apply pagination to filtered results
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        data: paginatedLogs,
        page,
        limit,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'getOtherLogs',
        params,
      );
    }
  }

  public async createLog(logData: Partial<Log>) {
    try {
      const log = this.logRepository.create(logData);
      return await this.logRepository.save(log);
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'createLog',
        logData,
      );
    }
  }
}