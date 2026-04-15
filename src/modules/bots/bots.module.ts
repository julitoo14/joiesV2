import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotPersistence, BotSchema } from './infrastructure/bot.schema';
import { BotsService } from './bots.service';
import { BotManagerService } from './engine/bot-manager.service';
import { BotsController } from './bots.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: BotPersistence.name, schema: BotSchema }]),
    ],
    controllers: [BotsController],
    providers: [BotsService, BotManagerService],
    exports: [BotsService, BotManagerService],
})
export class BotsModule { }
