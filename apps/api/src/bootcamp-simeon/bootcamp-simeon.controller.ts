import { Controller, Get, Post, Delete, NotFoundException } from "@nestjs/common";
import { BootcampSimeonService } from "./bootcamp-simeon.service";

@Controller('bootcamp-simeon')
export class BootcampSimeonController {
  constructor(private readonly bootcampSimeonService: BootcampSimeonService) {}
}
