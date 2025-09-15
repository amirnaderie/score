import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Log } from '../entities/log.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import handelError from '../../../utility/handel-error';
import * as jalaali from 'jalaali-js';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    private eventEmitter: EventEmitter2,

  ) { }

  /**
   * Get logs with filtering and pagination
   */
  public async getLogs(params: {
    from: string;
    to: string;
    page: number;
    limit: number;
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

      } = params;
      const methods: string[] = ["transferScore", "createScore", "updateScore"]

      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);


      const total = await this.logRepository
        .createQueryBuilder('log')
        .where('log.createdAt >= :startDate', { startDate })
        .andWhere('log.createdAt <= :endDate', { endDate })
        .andWhere('log.method IN (:...methods)', { methods })
        .getCount(); // <-- Returns [results, count] tuple

      const logs = await this.logRepository
        .createQueryBuilder('log')
        .where('log.createdAt >= :startDate', { startDate })
        .andWhere('log.createdAt <= :endDate', { endDate })
        .andWhere('log.method IN (:...methods)', { methods })
        .andWhere('log.logtypes <> :excludedType', { excludedType: 'error' }) // <-- new condition
        .orderBy(`log.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .select(['log.id', 'log.method', 'log.createdAt', 'log.message'])
        .getMany();

      return {
        data: logs,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'getLogs',
        params,
      );
    }
  }

  /**
   * Get a single log by ID
   */
  public async getLogById(id: number) {
    try {
      const log = await this.logRepository.findOne({ where: { id } });
      return log;
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'getLogById',
        { id },
      );
    }
  }

  /**
   * Get available methods for filtering
   */
  public async getAvailableMethods() {
    try {
      const methods = await this.logRepository
        .createQueryBuilder('log')
        .select('DISTINCT log.method', 'method')
        .orderBy('log.method', 'ASC')
        .getRawMany();

      return methods.map((item) => item.method);
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'getAvailableMethods',
        {},
      );
    }
  }

  /**
   * Export logs as CSV (without pagination)
   */
  public async exportLogs(params: {
    from: string;
    to: string;
    sortBy?: 'method' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    methods?: string[];
  }) {
    try {
      const {
        from,
        to,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        methods,
      } = params;

      // Create date range for filtering
      const startDate = new Date(from);
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      // Build where clause
      const whereClause: any = {
        createdAt: Between(startDate, endDate),
      };

      if (methods && methods.length > 0) {
        whereClause.method = In(methods);
      }

      // Get all logs without pagination
      const logs = await this.logRepository.find({
        where: whereClause,
        order: {
          [sortBy]: sortOrder,
        },
      });

      return logs;
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'log.service',
        'exportLogs',
        params,
      );
    }
  }

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