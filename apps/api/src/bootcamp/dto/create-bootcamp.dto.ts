import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateBootcampDto {
  @ApiProperty()
  @IsString()
  MyName: string;
  @ApiProperty()
  @IsString()
  email: string;
  @ApiProperty()
  @IsString()
  phone: string;
  @ApiProperty()
  @IsString()
  adress: string;
}
