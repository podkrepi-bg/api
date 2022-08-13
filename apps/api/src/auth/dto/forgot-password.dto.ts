import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgottenPasswordEmailDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string
}
