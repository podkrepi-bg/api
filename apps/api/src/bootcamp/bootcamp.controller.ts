import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from "@nestjs/common";
import { Public } from "nest-keycloak-connect";
import { BootcampService } from "./bootcamp.service";

@Controller("bootcamp")
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) { }

  @Post()
  @Public()
  async create(
    @Body()
    createBootcampDto: {
      MyName: string;
      phone: string;
      email: string;
      adress: string;
    }
  ) {
    return await this.bootcampService.create(createBootcampDto);
  }

  @Get()
  @Public()
  async findAll() {
    return await this.bootcampService.findAll();
  }

  @Get(":id")
  @Public()
  async findOne(@Param("id") id: string) {
    return await this.bootcampService.findOne(id);
  }

  @Put(":id")
  @Public()
  async update(
    @Body()
    updateBootcampDto: {
      MyName: string;
      phone: string;
      email: string;
      adress: string;
    },
    @Param("id") id: string
  ) {
    return await this.bootcampService.update(id, updateBootcampDto);
  }

  @Delete(":id")
  @Public()
  async remove(@Param("id") id: string) {
    await this.bootcampService.remove(id);
    return { message: "Success" };
  }

  @Get('/search/phone/:key')
  @Public()
  async searchByPhone(@Param("key") keyword: string) {
    return await this.bootcampService.searchByPhone(keyword)
  }

  @Get('/search/name/:key')
  @Public()
  async searchByName(@Param("key") keyword: string) {
    return await this.bootcampService.searchByName(keyword)
  }

  @Get('/search/email/:key')
  @Public()
  async searchByEmail(@Param("key") keyword: string) {
    return await this.bootcampService.searchByEmail(keyword)
  }

  @Get('/search/adress/:key')
  @Public()
  async searchByAdress(@Param("key") keyword: string) {
    return await this.bootcampService.searchByAdress(keyword)
  }
}
