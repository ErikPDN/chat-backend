import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID do destinatário da mensagem',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsMongoId({ message: 'ID do destinatário inválido' })
  @IsNotEmpty({ message: 'ID do destinatário é obrigatório' })
  receiverId: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Olá, como você está?',
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  content: string;
}
