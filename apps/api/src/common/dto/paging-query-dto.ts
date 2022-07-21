import { Expose, Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PagingQueryDto {
  @Expose()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number.parseInt(value))
  pageindex: number;

  @Expose()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Number.parseInt(value))
  pagesize: number;
}
