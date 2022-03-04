import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CreateBenefactorDto } from './create-benefactor.dto'
import { Person } from '@prisma/client'

export class UpdateBenefactorDto extends PartialType(CreateBenefactorDto) {
  // @ApiProperty()
  // @IsString()
  // id: string ;
  // @ApiProperty()
  // @IsString()
  // personId: string ;
  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // extCustomerId: string  | null;
  // @ApiProperty()
  // @IsOptional()
  // createdAt: Date ;
  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // updatedAt: Date  | null;
  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // person?: Person ;
}
