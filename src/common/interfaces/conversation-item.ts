import { Types } from "mongoose";

export interface ConversationItem {
  _id: Types.ObjectId;
  name: string;
  avatar?: string | null;
  description?: string;
  lastMessage: string | null;
  lastMessageTimestamp: Date;
  unreadCount: number;
  isGroup: boolean;
  membersId?: Types.ObjectId[];
  creatorId?: Types.ObjectId;
}