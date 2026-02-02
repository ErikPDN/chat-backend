import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
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

  @Get('conversations/p2p/:userId/messages')
  @ApiOperation({ summary: 'Obter mensagens de conversa P2P' })
  getP2PMessages(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.getConversation(user.userId, otherUserId);
  }

  @Get('conversations/group/:groupId/messages')
  @ApiOperation({ summary: 'Obter mensagens de grupo' })
  getGroupMessages(@Param('groupId') groupId: string, @CurrentUser() user: RequestUser) {
    return this.chatService.getGroupMessages(groupId, user.userId);
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

  @Patch('conversations/p2p/:userId/mark-as-read')
  @ApiOperation({ summary: 'Marcar conversa P2P como lida' })
  markConversationAsRead(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.markConversationAsRead(
      user.userId,
      otherUserId
    )
  }

  @Patch('conversations/group/:groupId/mark-as-read')
  @ApiOperation({ summary: 'Marcar mensagens do grupo como lidas' })
  markGroupMessagesAsRead(
    @Param('groupId') groupId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.markGroupMessagesAsRead(user.userId, groupId);
  }
}
