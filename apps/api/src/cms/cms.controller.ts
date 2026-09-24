import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CmsService } from './cms.service'
import { CreateCmsDto, UpdateCmsDto } from './dto/cms.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // GET /cms — público, sin autenticación
  @Get()
  findAll() {
    return this.cmsService.findAll()
  }

  // GET /cms/:id — público, sin autenticación
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.cmsService.findById(id)
  }

  // POST /cms — solo Admin, acepta multipart/form-data con archivo PDF opcional
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage() }))
  create(
    @Request() req,
    @Body() dto: CreateCmsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.cmsService.create(req.user.id, dto, file)
  }

  // PATCH /cms/:id — solo Admin
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage() }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCmsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.cmsService.update(id, dto, file)
  }

  // DELETE /cms/:id — solo Admin
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.cmsService.remove(id)
  }
}
