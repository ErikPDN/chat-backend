import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { UsersService } from 'src/users/users.service';
import { Model, Types } from 'mongoose';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
  ) { }

  async create(createMessageDto: CreateMessageDto, senderId: string) {
    const receiver = await this.usersService.findOne(
      createMessageDto.receiverId,
    );
    if (!receiver) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    const message = new this.messageModel({
      ...createMessageDto,
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(createMessageDto.receiverId),
    });

    return message.save();
  }

  async getConversation(userId1: string, userId2: string) {
    return this.messageModel
      .find({
        $or: [
          {
            senderId: new Types.ObjectId(userId1),
            receiverId: new Types.ObjectId(userId2),
          },
          {
            senderId: new Types.ObjectId(userId2),
            receiverId: new Types.ObjectId(userId1),
          },
        ],
      })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .exec();
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    if (message.receiverId.toString() !== userId) {
      throw new NotFoundException(
        'Você não tem permissão para marcar esta mensagem',
      );
    }

    message.isRead = true;
    message.readAt = new Date();
    return message.save();
  }

  async getUnreadCount(userId: string) {
    return this.messageModel
      .countDocuments({
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }
}
