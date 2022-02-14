import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateBenefactorDto } from './create-benefactor.dto';
import { Person } from "@prisma/client";

export class UpdateBenefactorDto extends PartialType(CreateBenefactorDto) {

    
    // @ApiProperty()
    // @IsString()
    // id: string ;

    // @ApiProperty()
    // @Expose()
    // @IsString()
    // personId: string ;

    @ApiProperty()
    @IsString()
    extCustomerId: string  | null;

    @ApiProperty()
    createdAt: Date ;
   
    @ApiProperty()
    @IsString()
    updatedAt: Date  | null;
    
    @ApiProperty()
    @IsString()
    person?: Person ;


    
}
