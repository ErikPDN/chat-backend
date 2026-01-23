import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private groupsService: GroupsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  create(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.create(createGroupDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups of the authenticated user' })
  findUserGroups(@CurrentUser() user: RequestUser) {
    return this.groupsService.findUserGroups(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  findById(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') groupId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.addMember(groupId, addMemberDto, user.userId);
  }

  @Post(':id/members/:userId/remove')
  async removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.removeMember(groupId, userId, user.userId);
  }

  @Post(':id/delete')
  async deleteGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.deleteGroup(groupId, user.userId);
  }
}
