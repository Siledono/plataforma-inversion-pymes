// Tipos y enums compartidos entre frontend y backend

export enum UserRol {
  EMPRESA = 'empresa',
  BANCO = 'banco',
  INVERSOR = 'inversor',
  ADMIN = 'admin',
}

export enum EstadoProyecto {
  BORRADOR = 'borrador',
  PUBLICADO = 'publicado',
  EN_REVISION_BANCO = 'en_revision_banco',
  FINANCIADO_BANCO = 'financiado_banco',
  FINANCIADO_INVERSOR = 'financiado_inversor',
  FINANCIADO_TOTAL = 'financiado_total',
  ELIMINADO = 'eliminado',
}

export enum EstadoSolicitudBanco {
  EN_REVISION = 'en_revision',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  CONTRAOFERTA_PENDIENTE = 'contraoferta_pendiente',
  EXPIRADA = 'expirada',
}

export enum EstadoNegociacion {
  PENDIENTE = 'pendiente',
  CONTRAOFERTA = 'contraoferta',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  EXPIRADA = 'expirada',
}

export enum TipoFinanciamiento {
  ACCIONES = 'acciones',
  PRESTAMO = 'prestamo',
  AMBOS = 'ambos',
}

export enum TipoNotificacion {
  OFERTA_RECIBIDA = 'oferta_recibida',
  CONTRAOFERTA = 'contraoferta',
  PROYECTO_ACEPTADO = 'proyecto_aceptado',
}

export enum RolDestinoToken {
  EMPRESA = 'empresa',
  BANCO = 'banco',
  INVERSOR = 'inversor',
}
