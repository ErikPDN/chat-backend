import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { AddContactDto } from './dto/add-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    private usersService: UsersService,
  ) {}

  async addContact(userId: string, addContactDto: AddContactDto) {
    // Não permitir que o usuário se adicione a si mesmo
    if (userId === addContactDto.contactId) {
      throw new BadRequestException(
        'Você não pode adicionar a si mesmo como contato',
      );
    }

    // Verificar se o usuário a ser adicionado existe
    const contactUser = await this.usersService.findOne(
      addContactDto.contactId,
    );
    if (!contactUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userObjectId = new Types.ObjectId(userId);
    const contactObjectId = new Types.ObjectId(addContactDto.contactId);

    const existingContact = await this.contactModel.findOne({
      userId: userObjectId,
      contactId: contactObjectId,
    });

    if (existingContact) {
      throw new ConflictException('Esse usuário já está em seus contatos');
    }

    const contact = new this.contactModel({
      userId: userObjectId,
      contactId: contactObjectId,
      nickname: addContactDto.nickname || null,
      blocked: false,
    });

    const savedContact = await contact.save();
    return savedContact.populate('contactId', 'username avatar email');
  }

  async updateContact(
    userId: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const userObjectId = new Types.ObjectId(userId);
    const contactObjectId = new Types.ObjectId(contactId);

    const contact = await this.contactModel.findOne({
      userId: userObjectId,
      contactId: contactObjectId,
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    if (updateContactDto.nickname !== undefined) {
      contact.nickname = updateContactDto.nickname;
    }

    if (updateContactDto.blocked !== undefined) {
      contact.blocked = updateContactDto.blocked;
    }

    const savedContact = await contact.save();
    return savedContact.populate('contactId', 'username avatar email');
  }

  async getContactById(userId: string, contactId: string) {
    const contact = await this.contactModel
      .findOne({
        contactId: new Types.ObjectId(contactId),
        userId: new Types.ObjectId(userId),
      })
      .populate('contactId', 'username avatar email')
      .exec();

    if (!contact) {
      throw new NotFoundException('Contato não encontrado para este usuário');
    }

    return contact;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return this.contactModel
      .find({ userId: new Types.ObjectId(userId), blocked: false })
      .populate('contactId', 'username avatar email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async removeContact(userId: string, contactId: string): Promise<void> {
    const result = await this.contactModel.deleteOne({
      userId: new Types.ObjectId(userId),
      contactId: new Types.ObjectId(contactId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Contato não encontrado');
    }
  }

  async blockContact(userId: string, contactId: string): Promise<Contact> {
    const contact = await this.contactModel.findOne({
      userId: new Types.ObjectId(userId),
      contactId: new Types.ObjectId(contactId),
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    contact.blocked = true;
    const savedContact = await contact.save();
    return savedContact.populate('contactId', 'username avatar email');
  }

  async unblockContact(userId: string, contactId: string): Promise<Contact> {
    const contact = await this.contactModel.findOne({
      userId: new Types.ObjectId(userId),
      contactId: new Types.ObjectId(contactId),
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    contact.blocked = false;
    const savedContact = await contact.save();
    return savedContact.populate('contactId', 'username avatar email');
  }

  async isContact(userId: string, contactId: string): Promise<boolean> {
    const contact = await this.contactModel.findOne({
      userId: new Types.ObjectId(userId),
      contactId: new Types.ObjectId(contactId),
      blocked: false,
    });

    return !!contact;
  }
}
