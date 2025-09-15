import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { LogService } from '../provider/log.service';
import { Response } from 'express';
import { GetLogsDto } from '../dto/get-logs.dto';
import { ExportLogsDto } from '../dto/export-logs.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) { }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('score.admin')
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getLogs(@Query() query: GetLogsDto) {
    try {
      const params = {
        from: query.from,
        to: query.to,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        methods: query.methods ? query.methods.split(',') : undefined,
      };

      const result = await this.logService.getLogs(params);
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve logs',
        error: error.message,
      };
    }
  }

  @Get('methods')
  async getAvailableMethods() {
    try {
      const methods = await this.logService.getAvailableMethods();
      return {
        success: true,
        data: methods,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve available methods',
        error: error.message,
      };
    }
  }

  @Get(':id')
  async getLogById(@Param('id') id: string) {
    try {
      const log = await this.logService.getLogById(parseInt(id, 10));
      if (!log) {
        return {
          success: false,
          message: 'Log not found',
        };
      }
      return {
        success: true,
        data: log,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve log',
        error: error.message,
      };
    }
  }

  @Get('export/csv')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportLogs(
    @Query() query: ExportLogsDto,
    @Res() res: Response,
  ) {
    try {
      const params = {
        from: query.from,
        to: query.to,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        methods: query.methods ? query.methods.split(',') : undefined,
      };

      const logs = await this.logService.exportLogs(params);

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');

      // Generate CSV content
      const csvHeaders = [
        'ID',
        'File Name',
        'Log Types',
        'Method',
        'Message',
        'Request Body',
        'Stack',
        'User',
        'Created At',
      ].join(',');

      const csvRows = logs.map((log) => [
        log.id,
        `"${log.fileName || ''}"`,
        `"${log.logTypes || ''}"`,
        `"${log.method || ''}"`,
        `"${(log.message || '').replace(/"/g, '""')}"`,
        `"${(log.requestBody || '').replace(/"/g, '""')}"`,
        `"${(log.stack || '').replace(/"/g, '""')}"`,
        `"${log.user || ''}"`,
        `"${log.createdAt.toISOString()}"`,
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      res.send(csvContent);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to export logs',
        error: error.message,
      });
    }
  }
}