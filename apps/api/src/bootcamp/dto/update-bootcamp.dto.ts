import { PartialType, ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { CreateBootcampDto } from "./create-bootcamp.dto";

export class UpdateBootcampDto extends PartialType(CreateBootcampDto) {
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
