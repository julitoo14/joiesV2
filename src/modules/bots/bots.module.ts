import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotPersistence, BotSchema } from './infrastructure/bot.schema';
import { BotsService } from './bots.service';
import { BotManagerService } from './engine/bot-manager.service';
import { BotsController } from './bots.controller';
import { UsersModule } from '../users/users.module';

import { MarketDataService } from './engine/market-data.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: BotPersistence.name, schema: BotSchema }]),
        UsersModule,
    ],
    controllers: [BotsController],
    providers: [BotsService, BotManagerService, MarketDataService],
    exports: [BotsService, BotManagerService, MarketDataService],
})
export class BotsModule { }
