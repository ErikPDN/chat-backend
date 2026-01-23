import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Nome do grupo',
    example: 'Amigos da Faculdade',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição do grupo',
    example: 'Grupo para organizar encontros e eventos',
  })
  description?: string;

  @ApiProperty({
    description: 'IDs dos membros iniciais do grupo',
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'],
  })
  members?: string[];
}
