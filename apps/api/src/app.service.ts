import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'taskfield-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
