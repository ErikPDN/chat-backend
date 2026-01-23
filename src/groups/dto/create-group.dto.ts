import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Nome do grupo',
    example: 'Amigos da Faculdade',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Descrição do grupo',
    example: 'Grupo para organizar encontros e eventos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @ApiProperty({
    description: 'IDs dos membros iniciais do grupo',
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'memberIds deve ser um array' })
  @IsMongoId({
    each: true,
    message: 'Cada ID deve ser um MongoDB ObjectId válido',
  })
  memberIds?: string[];
}
