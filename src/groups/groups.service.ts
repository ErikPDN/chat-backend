import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from './schemas/group.schema';
import { AddMemberDto } from './dto/add-member.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    private usersService: UsersService,
  ) { }

  async create(createGroupDto: CreateGroupDto, creatorId: string) {
    const creator = await this.usersService.findOne(creatorId);
    if (!creator) {
      throw new NotFoundException('Criador não encontrado');
    }

    const creatorObjectId = new Types.ObjectId(creatorId);
    const memberIds = [creatorObjectId];

    if (createGroupDto.memberIds && createGroupDto.memberIds.length > 0) {
      for (const memberId of createGroupDto.memberIds) {
        const member = await this.usersService.findOne(memberId);
        if (!member) {
          throw new NotFoundException(`Usuário ${memberId} não encontrado`);
        }
        if (memberId !== creatorId) {
          memberIds.push(new Types.ObjectId(memberId));
        }
      }
    }

    const newGroup = new this.groupModel({
      name: createGroupDto.name,
      description: createGroupDto.description,
      creatorId: creatorObjectId,
      membersId: memberIds,
      adminsId: [creatorObjectId],
    });

    return await newGroup.save();
  }

  async findById(groupId: string) {
    const group = await this.groupModel
      .findById(groupId)
      .populate('membersId', 'username avatar email')
      .populate('creatorId', 'username avatar email')
      .populate('adminsId', 'username avatar email');

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    return group;
  }

  async findUserGroups(userId: string) {
    return await this.groupModel
      .find({ membersId: new Types.ObjectId(userId) })
      .populate('membersId', 'username avatar email')
      .populate('creatorId', 'username avatar email')
      .populate('adminsId', 'username avatar email')
      .sort({ createdAt: -1 });
  }

  async addMember(
    groupId: string,
    addMemberDto: AddMemberDto,
    requesterId: string,
  ) {
    const group = await this.findById(groupId);

    if (!group.adminsId.some((adminId) => adminId.toString() === requesterId)) {
      throw new BadRequestException(
        'Apenas administradores podem adicionar membros',
      );
    }

    const userToAdd = await this.usersService.findOne(addMemberDto.userId);
    if (!userToAdd) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (
      group.membersId.some(
        (memberId) => memberId.toString() === addMemberDto.userId,
      )
    ) {
      throw new BadRequestException('Usuário já é membro do grupo');
    }

    group.membersId.push(new Types.ObjectId(addMemberDto.userId));
    return await group.save();
  }

  async removeMember(groupId: string, userId: string, requesterId: string) {
    const group = await this.findById(groupId);

    const isAdmin = group.adminsId.some(
      (adminId) => adminId.toString() === requesterId,
    );
    const isSelf = userId === requesterId;

    if (!isAdmin && !isSelf) {
      throw new BadRequestException('Sem permissão para remover membro');
    }

    if (
      group.adminsId.some((adminId) => adminId.toString() === userId) &&
      group.adminsId.length === 1
    ) {
      throw new BadRequestException(
        'Não é possível remover o único administrador do grupo',
      );
    }

    group.membersId = group.membersId.filter(
      (memberId) => memberId.toString() !== userId,
    );

    if (group.adminsId.some((adminId) => adminId.toString() === userId)) {
      group.adminsId = group.adminsId.filter(
        (adminId) => adminId.toString() !== userId,
      );
    }

    return await group.save();
  }

  async deleteGroup(groupId: string, requesterId: string) {
    const group = await this.findById(groupId);

    const isAdmin = group.adminsId.some(
      (adminId) => adminId.toString() === requesterId,
    );

    if (!isAdmin) {
      throw new BadRequestException('Sem permissão para deletar o grupo');
    }

    return this.groupModel.findByIdAndDelete(groupId);
  }
}
