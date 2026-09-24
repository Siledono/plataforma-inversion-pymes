import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'
import { EFirmaService } from './efirma/efirma.service'
import { TotpService } from './totp/totp.service'
import { WebAuthnService } from './webauthn/webauthn.service'
import { DeviceService } from './device/device.service'
import { IpWhitelistService } from './ip-whitelist/ip-whitelist.service'
import { BruteForceService } from './brute-force/brute-force.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    EFirmaService,
    TotpService,
    WebAuthnService,
    DeviceService,
    IpWhitelistService,
    BruteForceService,
  ],
  exports: [AuthService, IpWhitelistService],
})
export class AuthModule {}
