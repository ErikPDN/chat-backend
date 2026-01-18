import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { AddContactDto } from './dto/add-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona um novo contato' })
  addContact(
    @Body() addContactDto: AddContactDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contactsService.addContact(user.userId, addContactDto);
  }

  @Patch(':contactId')
  updateContact(
    @CurrentUser() user: RequestUser,
    @Param('contactId') contactId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(
      user.userId,
      contactId,
      updateContactDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os contatos do usuário' })
  getContacts(@CurrentUser() user: RequestUser) {
    return this.contactsService.getContacts(user.userId);
  }

  @Get(':contactId')
  @ApiOperation({ summary: 'Obter detalhes de um contato específico' })
  getContact(
    @CurrentUser() user: RequestUser,
    @Param('contactId') contactId: string,
  ) {
    return this.contactsService.getContactById(user.userId, contactId);
  }

  @Delete(':contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover contato' })
  removeContact(
    @Param('contactId') contactId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contactsService.removeContact(user.userId, contactId);
  }

  @Patch(':contactId/block')
  @ApiOperation({ summary: 'Bloquear contato' })
  blockContact(
    @Param('contactId') contactId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contactsService.blockContact(user.userId, contactId);
  }

  @Patch(':contactId/unblock')
  @ApiOperation({ summary: 'Desbloquear contato' })
  unblockContact(
    @Param('contactId') contactId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contactsService.unblockContact(user.userId, contactId);
  }
}
