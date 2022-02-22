import { Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';

@Module({
  controllers: [VaultController],
  providers: [VaultService]
})
export class VaultModule {}
