import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsEmail, IsBoolean, IsOptional } from 'class-validator'

export class SendConfirmationDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string
}

export class SubscribePublicDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string

  @ApiProperty()
  @Expose()
  @IsBoolean()
  public readonly consent: boolean

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  public readonly hash: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  public readonly campaignId?: string
}

export class UnsubscribePublicDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  public readonly campaignId?: string
}

export class SubscribeDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  public readonly consent: boolean
}

export class UnsubscribeDto {
  @ApiProperty()
  @Expose()
  @IsOptional()
  public readonly campaignId?: string
}

//Responses
export type SendConfirmationResponse = {
  message: 'Subscribed' | 'Email Sent'
}
export type SubscribePublicResponse = {
  message: 'Subscribed' | 'Success'
}

export type UnsubscribePublicResponse = {
  message: 'Unsubscribed' | 'Success'
}
