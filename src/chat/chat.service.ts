import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { UsersService } from 'src/users/users.service';
import { Model, Types } from 'mongoose';
import { GroupsService } from 'src/groups/groups.service';
import { ContactsService } from 'src/contacts/contacts.service';
import { ConversationItem } from 'src/common/interfaces/conversation-item';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private contactsService: ContactsService,
  ) { }

  async create(createMessageDto: CreateMessageDto, senderId: string) {
    const receiver = await this.usersService.findOne(
      createMessageDto.receiverId,
    );
    if (!receiver) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    const contact = await this.contactsService.getContactById(
      senderId,
      createMessageDto.receiverId,
    );

    if (!contact) {
      throw new BadRequestException(
        'Você precisa adicionar este usuário como contato antes de enviar mensagens',
      );
    }

    if (contact.blocked) {
      throw new BadRequestException(
        'Você não pode enviar mensagens para este usuário (contato bloqueado)',
      );
    }

    const message = new this.messageModel({
      ...createMessageDto,
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(createMessageDto.receiverId),
    });

    return message.save();
  }

  async createGroupMessage(groupId: string, content: string, senderId: string) {
    const group = await this.groupsService.findById(groupId);
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const senderObjectId = new Types.ObjectId(senderId);

    const isMember = group.membersId.some(
      (memberId) => memberId.equals(senderObjectId),
    );
    
    if (!isMember) {
      throw new NotFoundException(
        'Você não é membro deste grupo e não pode enviar mensagens',
      );
    }

    const message = new this.messageModel({
      content,
      senderId: senderObjectId,
      groupId: new Types.ObjectId(groupId),
    });

    return message.save();
  }

  async getGroupMessages(groupId: string) {
    return this.messageModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatar')
      .exec();
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

  async getAllConversations(userId: string): Promise<ConversationItem[]> {
    const p2pConversations =
      await this.messageModel.aggregate<ConversationItem>([
        {
          $match: {
            $or: [
              { senderId: new Types.ObjectId(userId) },
              { receiverId: new Types.ObjectId(userId) },
            ],
            groupId: { $exists: false }, // Apenas P2P
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', new Types.ObjectId(userId)] },
                '$receiverId',
                '$senderId',
              ],
            },
            lastMessage: { $first: '$content' },
            lastMessageTimestamp: { $first: '$createdAt' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$receiverId', new Types.ObjectId(userId)] },
                      { $eq: ['$isRead', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            _id: '$_id',
            name: '$user.username',
            avatar: '$user.avatar',
            lastMessage: 1,
            lastMessageTimestamp: 1,
            unreadCount: 1,
            isGroup: { $literal: false },
          },
        },
      ]);

    const groups = await this.groupsService.findUserGroups(userId);

    const groupConversations: ConversationItem[] = await Promise.all(
      groups.map(async (group): Promise<ConversationItem> => {
        const lastMessage = await this.messageModel
          .findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          avatar: null,
          lastMessage: lastMessage?.content || null,
          lastMessageTimestamp: lastMessage?.createdAt || group.createdAt,
          unreadCount: 0,
          isGroup: true,
          membersId: group.membersId,
          creatorId: group.creatorId,
        };
      }),
    );

    const allConversations: ConversationItem[] = [
      ...p2pConversations,
      ...groupConversations,
    ].sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp).getTime() -
        new Date(a.lastMessageTimestamp).getTime(),
    );

    return allConversations;
  }

  async markConversationAsRead(userId: string, otherUserId: string) {
    const result = await this.messageModel.updateMany(
      {
        senderId: new Types.ObjectId(otherUserId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true, readAt: new Date() },
    );

    return this.getConversation(userId, otherUserId);
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
