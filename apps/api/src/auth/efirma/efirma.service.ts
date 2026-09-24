import { Injectable, BadRequestException } from '@nestjs/common'
import * as crypto from 'crypto'
import * as forge from 'node-forge'

// Número de serie del Certificado Raíz SAT (CSD Raíz)
// En producción se descarga de: https://www.sat.gob.mx/tramites/16703/descarga-el-certificado-raiz
// Para fines del sistema se valida la cadena de firma, no se hace conexión al SAT
const SAT_ROOT_SUBJECT_KEYWORDS = ['SAT', 'Servicio de Administración Tributaria', 'MEXICO']

export interface EFirmaParseada {
  rfc: string
  razonSocial: string
  serial: string
  vigenciaDesde: Date
  vigenciaHasta: Date
  cerPem: string
}

@Injectable()
export class EFirmaService {

  /**
   * Parsea un archivo .cer (DER o PEM), extrae RFC, razón social y fechas de validez.
   * Valida que el certificado no esté expirado.
   */
  parseCertificado(cerBuffer: Buffer): EFirmaParseada {
    let cert: forge.pki.Certificate

    try {
      // Intentar como DER (binario) primero, luego como PEM
      let pem: string
      if (cerBuffer[0] === 0x30) {
        // Archivo DER — convertir a PEM
        const b64 = cerBuffer.toString('base64')
        pem = `-----BEGIN CERTIFICATE-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END CERTIFICATE-----`
      } else {
        pem = cerBuffer.toString('utf-8')
      }
      cert = forge.pki.certificateFromPem(pem)
    } catch {
      throw new BadRequestException('El archivo .cer no es un certificado válido')
    }

    const ahora = new Date()
    const vigenciaDesde = cert.validity.notBefore
    const vigenciaHasta = cert.validity.notAfter

    if (ahora > vigenciaHasta) {
      throw new BadRequestException('El certificado e.Firma ha expirado')
    }
    if (ahora < vigenciaDesde) {
      throw new BadRequestException('El certificado e.Firma aún no es válido')
    }

    // Extraer RFC y Razón Social del Subject DN
    // En e.Firma SAT: CN=RFC / OU=CURP / O=Razón Social / C=MX
    const subject = cert.subject.attributes
    const cnAttr = subject.find((a) => a.shortName === 'CN')
    const oAttr = subject.find((a) => a.shortName === 'O')

    if (!cnAttr?.value) {
      throw new BadRequestException('No se pudo extraer el RFC del certificado')
    }

    // El CN puede tener formato "RFC / EMAIL"
    const rfcRaw = (cnAttr.value as string).split('/')[0].trim()
    const rfc = rfcRaw.toUpperCase().replace(/\s/g, '')
    const razonSocial = oAttr?.value as string ?? rfc

    const serial = cert.serialNumber

    const certPem = forge.pki.certificateToPem(cert)

    return { rfc, razonSocial, serial, vigenciaDesde, vigenciaHasta, cerPem: certPem }
  }

  /**
   * Valida que la llave privada (.key) corresponde al certificado (.cer) dado
   * y que la contraseña es correcta.
   * Los archivos .key del SAT son PKCS#8 cifrados con 3DES.
   */
  validarLlavePrivada(keyBuffer: Buffer, password: string, cerPem: string): boolean {
    try {
      // Intentar desencriptar la llave privada con la contraseña
      let privateKey: forge.pki.PrivateKey
      try {
        const asn1 = forge.asn1.fromDer(forge.util.createBuffer(keyBuffer))
        const encryptedPkInfo = forge.pki.encryptedPrivateKeyFromAsn1(asn1)
        const pkInfo = forge.pki.decryptPrivateKeyInfo(encryptedPkInfo, password)
        if (!pkInfo) throw new Error('contraseña incorrecta')
        privateKey = forge.pki.privateKeyFromAsn1(pkInfo)
      } catch {
        throw new BadRequestException('Contraseña de llave privada incorrecta')
      }

      // Verificar que la llave pública del certificado coincide con la privada
      const cert = forge.pki.certificateFromPem(cerPem)
      const pubKeyFromCert = cert.publicKey as forge.pki.rsa.PublicKey
      const privKeyRsa = privateKey as forge.pki.rsa.PrivateKey

      // Comparar módulos RSA — deben ser idénticos
      const moduloCert = pubKeyFromCert.n.toString(16)
      const moduloPriv = privKeyRsa.n.toString(16)

      return moduloCert === moduloPriv
    } catch (e) {
      if (e instanceof BadRequestException) throw e
      return false
    }
  }

  /**
   * Verificación básica de cadena de confianza SAT.
   * Valida que el Issuer del certificado contiene palabras clave del SAT.
   * En producción real se debe verificar contra el cert raíz descargado del SAT.
   */
  validarCadenaSAT(cerPem: string): boolean {
    try {
      const cert = forge.pki.certificateFromPem(cerPem)
      const issuer = cert.issuer.attributes
      const issuerStr = issuer.map((a) => String(a.value)).join(' ').toUpperCase()

      return SAT_ROOT_SUBJECT_KEYWORDS.some((kw) => issuerStr.includes(kw.toUpperCase()))
    } catch {
      return false
    }
  }

  /**
   * Simula verificación contra LCR (Lista de Certificados Revocados).
   * En producción real, se consulta la CRL Distribution Point del certificado
   * o el endpoint OCSP del SAT.
   * Aquí se valida contra la BD local de seriales revocados.
   */
  async verificarLCR(serial: string, revocadoEnBD: boolean): Promise<boolean> {
    // Si la BD marcó este serial como revocado, rechazar
    if (revocadoEnBD) return false
    // Simulación: todos los certificados no revocados en BD se consideran válidos
    // En producción: consultar CRL del SAT o endpoint OCSP
    return true
  }

  /**
   * Firma un reto (challenge) con la llave privada para verificar posesión.
   * Se usa en el flujo de login e.Firma.
   */
  firmarChallenge(keyBuffer: Buffer, password: string, challenge: string): string {
    try {
      const asn1 = forge.asn1.fromDer(forge.util.createBuffer(keyBuffer))
      const encryptedPkInfo = forge.pki.encryptedPrivateKeyFromAsn1(asn1)
      const pkInfo = forge.pki.decryptPrivateKeyInfo(encryptedPkInfo, password)
      const privateKey = forge.pki.privateKeyFromAsn1(pkInfo!) as forge.pki.rsa.PrivateKey

      const md = forge.md.sha256.create()
      md.update(challenge, 'utf8')
      const signature = privateKey.sign(md)
      return forge.util.encode64(signature)
    } catch {
      throw new BadRequestException('No se pudo firmar con la llave privada proporcionada')
    }
  }
}
