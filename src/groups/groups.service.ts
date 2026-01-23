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

@Injectable()
export class GroupsService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) { }

  async create(createGroupDto: CreateGroupDto, creatorId: string) {
    const newGroup = new this.groupModel({
      name: createGroupDto.name,
      description: createGroupDto.description,
      creatorId: new Types.ObjectId(creatorId),
      membersId: [new Types.ObjectId(creatorId)],
      adminsId: [new Types.ObjectId(creatorId)],
    });

    return newGroup.save();
  }

  async findById(groupId: string) {
    const group = await this.groupModel
      .findById(groupId)
      .populate('members')
      .populate('admins');

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async findUserGroups(userId: string) {
    return await this.groupModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('members')
      .populate('admins');
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

    if (
      group.membersId.some(
        (memberId) => memberId.toString() === addMemberDto.userId,
      )
    ) {
      throw new BadRequestException('Usuário já é membro do grupo');
    }

    group.membersId.push(new Types.ObjectId(addMemberDto.userId));
    return group.save();
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

    group.membersId = group.membersId.filter(
      (memberId) => memberId.toString() !== userId,
    );
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
