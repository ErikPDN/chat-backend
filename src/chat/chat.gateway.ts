import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authToken =
        typeof client.handshake.auth?.token === 'string'
          ? client.handshake.auth.token
          : null;
      const headerToken =
        typeof client.handshake.headers?.authorization === 'string'
          ? client.handshake.headers.authorization.split(' ')[1]
          : null;

      const token: string | null = authToken || headerToken || null;

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const payload: JwtPayload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      client.userId = payload.sub;
      this.connectedUsers.set(client.id, payload.sub);

      await this.usersService.updateLastSeen(payload.sub);

      client.broadcast.emit('userOnline', { userId: payload.sub });

      console.log(`Cliente conectado: ${client.id} (User: ${payload.sub})`);
    } catch (error) {
      console.error('Erro na autenticação WebSocket:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.id);

      client.broadcast.emit('userOffline', { userId: client.userId });

      await this.usersService.updateLastSeen(client.userId);

      console.log(
        `Cliente desconectado: ${client.id} (User: ${client.userId})`,
      );
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Não autenticado' };
    }

    try {
      const message = await this.chatService.create(
        createMessageDto,
        client.userId,
      );

      const receiverSocketId = Array.from(this.connectedUsers.entries()).find(
        ([_, userId]) => userId === createMessageDto.receiverId,
      )?.[0];

      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', {
          ...message.toObject(),
          senderId: message.senderId,
          receiverId: message.receiverId,
        });
      }

      return { success: true, message: message.toObject() };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      client.join(`user:${data.userId}`);
      return { success: true };
    }
    return { error: 'Não autenticado' };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      client.leave(`user:${data.userId}`);
      return { success: true };
    }
    return { error: 'Não autenticado' };
  }

  @SubscribeMessage('sendGroupMessage')
  async handleGroupMessage(
    @MessageBody() messageData: { groupId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Não autenticado' };
    }

    try {
      const message = await this.chatService.createGroupMessage(
        messageData.groupId,
        messageData.content,
        client.userId,
      );

      this.server.to(`group:${messageData.groupId}`).emit('newGroupMessage', {
        ...message.toObject(),
        senderId: client.userId,
        groupId: messageData.groupId,
      });

      return { success: true, message: message.toObject() };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      client.join(`group:${data.groupId}`);
      this.server.to(`group:${data.groupId}`).emit('userJoinedGroup', {
        userId: client.userId,
        groupId: data.groupId,
      });
      return { success: true };
    }
    return { error: 'Não autenticado' };
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      client.leave(`group:${data.groupId}`);
      this.server.to(`group:${data.groupId}`).emit('userLeftGroup', {
        userId: client.userId,
        groupId: data.groupId,
      });
      return { success: true };
    }
    return { error: 'Não autenticado' };
  }
}
