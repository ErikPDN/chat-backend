export interface UserWithoutPassword {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  isActive: boolean;
  lastSeen?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
