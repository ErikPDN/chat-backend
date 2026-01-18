import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddContactDto {
  @ApiProperty({
    description: 'ID do usuário a ser adicionado como contato',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsMongoId({ message: 'ID do usuário inválido' })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  contactId: string;

  @ApiProperty({
    description: 'Apelido para o contato (opcional)',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}
