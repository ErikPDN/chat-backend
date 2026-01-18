import { ApiProperty } from '@nestjs/swagger';

export class UpdateContactDto {
  @ApiProperty({
    description: 'Apelido para o contato',
    example: 'João',
  })
  nickname: string;
}
