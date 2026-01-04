import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiOperation } from '@nestjs/swagger';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';

@Controller('chat')
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
