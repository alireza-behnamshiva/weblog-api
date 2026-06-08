import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'weblog-api',
      status: 'ok',
    };
  }
}
