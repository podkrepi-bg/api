import { applyDecorators, UseGuards } from "@nestjs/common";
import { ProtectedWithHeaderGuard } from "../app/protected-header.guard";

export  function ProtectedWithHeader() {
    return applyDecorators(UseGuards(ProtectedWithHeaderGuard))
}