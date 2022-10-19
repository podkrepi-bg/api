import { Body, Controller, Post } from '@nestjs/common';
import { Public, Resource } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { RefreshDto } from './dto/refresh.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('refresh')
@Controller('refresh')
@Resource('refresh')
export class RefreshController {
    constructor(private readonly authService: AuthService) {}
    @Post()
    @Public()
    async refresh(@Body() refreshDto: RefreshDto) {
      return await this.authService.issueTokenFromRefresh(refreshDto)
    }
}
