import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: 'ID do usuário a ser adicionado ao grupo',
    example: '60d0fe4f5311236168a109ca',
  })
  userId: string;
}
