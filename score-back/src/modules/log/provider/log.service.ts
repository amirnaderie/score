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

  /**
   * Get logs with filtering and pagination
   */
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
        .andWhere('log.method IN (:...methods)', { methods:this.methods })
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

  // /**
  //  * Get a single log by ID
  //  */
  // public async getLogById(id: number) {
  //   try {
  //     const log = await this.logRepository.findOne({ where: { id } });
  //     return log;
  //   } catch (error) {
  //     handelError(
  //       error,
  //       this.eventEmitter,
  //       'log.service',
  //       'getLogById',
  //       { id },
  //     );
  //   }
  // }

  // /**
  //  * Get available methods for filtering
  //  */
  // public async getAvailableMethods() {
  //   try {
  //     const methods = await this.logRepository
  //       .createQueryBuilder('log')
  //       .select('DISTINCT log.method', 'method')
  //       .orderBy('log.method', 'ASC')
  //       .getRawMany();

  //     return methods.map((item) => item.method);
  //   } catch (error) {
  //     handelError(
  //       error,
  //       this.eventEmitter,
  //       'log.service',
  //       'getAvailableMethods',
  //       {},
  //     );
  //   }
  // }

  // /**
  //  * Export logs as CSV (without pagination)
  //  */
  // public async exportLogs(params: {
  //   from: string;
  //   to: string;
  //   sortBy?: 'method' | 'createdAt';
  //   sortOrder?: 'ASC' | 'DESC';
  //   methods?: string[];
  // }) {
  //   try {
  //     const {
  //       from,
  //       to,
  //       sortBy = 'createdAt',
  //       sortOrder = 'DESC',
  //       methods,
  //     } = params;

  //     // Create date range for filtering
  //     const startDate = new Date(from);
  //     const endDate = new Date(to);
  //     endDate.setHours(23, 59, 59, 999);

  //     // Build where clause
  //     const whereClause: any = {
  //       createdAt: Between(startDate, endDate),
  //     };

  //     if (methods && methods.length > 0) {
  //       whereClause.method = In(methods);
  //     }

  //     // Get all logs without pagination
  //     const logs = await this.logRepository.find({
  //       where: whereClause,
  //       order: {
  //         [sortBy]: sortOrder,
  //       },
  //     });

  //     return logs;
  //   } catch (error) {
  //     handelError(
  //       error,
  //       this.eventEmitter,
  //       'log.service',
  //       'exportLogs',
  //       params,
  //     );
  //   }
  // }

  /**
   * Create a new log entry
   */
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
