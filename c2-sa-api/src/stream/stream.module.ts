import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { MqttModule } from '../mqtt/mqtt.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, forwardRef(() => MqttModule), AuthModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
