import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Injectable()
export class ElkLoggerService {
  private readonly logger: winston.Logger;
  private readonly elasticsearchClient: Client;

  constructor() {
    this.elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });

    const esTransport = new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      },
      index: 'score-logs',
      dataStream: true,
      source: 'score-backend',
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'score-backend',
        environment: process.env.ENV || 'dev',
      },
      transports: [
        esTransport,
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  async logToElk(level: string, logData: any) {
    try {
      this.logger.log({
        level,
        message: logData.message,
        timestamp: new Date().toISOString(),
        ...logData,
      });
    } catch (error) {
      Logger.error('Error sending log to ELK:', error);
    }
  }

  async info(logData: any) {
    await this.logToElk('info', logData);
  }

  async error(logData: any) {
    await this.logToElk('error', logData);
  }

  async warn(logData: any) {
    await this.logToElk('warn', logData);
  }

  async debug(logData: any) {
    await this.logToElk('debug', logData);
  }
}