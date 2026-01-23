import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type GroupDocument = Group & Document; 

@Schema({ timestamps: true })
export class Group { 
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  membersId: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  adminsId: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);