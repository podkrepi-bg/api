import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BootcampSimeonService {
  constructor(private prisma: PrismaService) {}
}
