import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('chats')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.create(createMessageDto, user.userId);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Obter conversa entre dois usuários' })
  getConversation(
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.getConversation(user.userId, userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Obter todas as conversas (P2P e grupos)' })
  getAllConversations(@CurrentUser() user: RequestUser) {
    return this.chatService.getAllConversations(user.userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter contagem de mensagens não lidas' })
  getUnreadCount(@CurrentUser() user: RequestUser) {
    return this.chatService.getUnreadCount(user.userId);
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Marcar mensagem como lida' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.chatService.markAsRead(id, user.userId);
  }
}
