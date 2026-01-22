import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({
    description: 'Apelido para o contato',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: 'Se o contato está bloqueado',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}
