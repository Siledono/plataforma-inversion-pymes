import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCmsDto, UpdateCmsDto } from './dto/cms.dto'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {
    // Configurar Cloudinary desde variables de entorno
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  // ═══════════════════════════════════════════════════════
  // CREAR ARTÍCULO (solo Admin)
  // ═══════════════════════════════════════════════════════

  async create(adminUserId: string, dto: CreateCmsDto, file?: Express.Multer.File) {
    let archivoUrl: string | undefined

    if (file) {
      archivoUrl = await this.subirArchivo(file)
    }

    return this.prisma.cmsContenido.create({
      data: {
        adminId: adminUserId,
        titulo: dto.titulo,
        cuerpo: dto.cuerpo,
        archivoUrl,
      },
    })
  }

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR ARTÍCULO (solo Admin)
  // ═══════════════════════════════════════════════════════

  async update(id: string, dto: UpdateCmsDto, file?: Express.Multer.File) {
    const articulo = await this.prisma.cmsContenido.findUnique({ where: { id } })
    if (!articulo) throw new NotFoundException('Artículo no encontrado')

    let archivoUrl = articulo.archivoUrl

    if (file) {
      // Si hay archivo anterior en Cloudinary, eliminarlo
      if (articulo.archivoUrl) {
        await this.eliminarArchivoCloudinary(articulo.archivoUrl).catch(() => {})
      }
      archivoUrl = await this.subirArchivo(file)
    }

    return this.prisma.cmsContenido.update({
      where: { id },
      data: {
        titulo: dto.titulo ?? articulo.titulo,
        cuerpo: dto.cuerpo ?? articulo.cuerpo,
        archivoUrl,
      },
    })
  }

  // ═══════════════════════════════════════════════════════
  // ELIMINAR ARTÍCULO (solo Admin)
  // ═══════════════════════════════════════════════════════

  async remove(id: string) {
    const articulo = await this.prisma.cmsContenido.findUnique({ where: { id } })
    if (!articulo) throw new NotFoundException('Artículo no encontrado')

    if (articulo.archivoUrl) {
      await this.eliminarArchivoCloudinary(articulo.archivoUrl).catch(() => {})
    }

    await this.prisma.cmsContenido.delete({ where: { id } })
    return { message: 'Artículo eliminado exitosamente' }
  }

  // ═══════════════════════════════════════════════════════
  // LISTAR ARTÍCULOS (público)
  // ═══════════════════════════════════════════════════════

  async findAll() {
    return this.prisma.cmsContenido.findMany({
      select: {
        id: true,
        titulo: true,
        archivoUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ═══════════════════════════════════════════════════════
  // OBTENER ARTÍCULO POR ID (público)
  // ═══════════════════════════════════════════════════════

  async findById(id: string) {
    const articulo = await this.prisma.cmsContenido.findUnique({ where: { id } })
    if (!articulo) throw new NotFoundException('Artículo no encontrado')
    return articulo
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS: Cloudinary
  // ═══════════════════════════════════════════════════════

  private async subirArchivo(file: Express.Multer.File): Promise<string> {
    // Validar tipo: solo PDF
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF')
    }
    // Validar tamaño: máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo no puede superar 10MB')
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'conecta-inversion/cms',
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result.secure_url)
        },
      )
      const readable = Readable.from(file.buffer)
      readable.pipe(uploadStream)
    })
  }

  private async eliminarArchivoCloudinary(url: string): Promise<void> {
    // Extraer el public_id de la URL de Cloudinary
    const parts = url.split('/')
    const fileWithExt = parts[parts.length - 1]
    const publicId = `conecta-inversion/cms/${fileWithExt.split('.')[0]}`
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
  }
}
