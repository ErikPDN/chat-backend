import { ApiProperty } from '@nestjs/swagger';

export class RemoveMemberDto {
  @ApiProperty({
    description: 'ID do usuário a ser removido do grupo',
    example: '60d0fe4f5311236168a109ca',
  })
  userId: string;
}
