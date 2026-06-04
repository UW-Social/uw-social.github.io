export type NotificationType = 'like' | 'reply' | 'follow' | 'invite';

export type NotificationTargetType = 'discussionPost' | 'discussionReply' | 'experiencePost' | 'event' | 'user';

export interface UserNotification {
  id: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  receiverUid: string;
  actorUid: string;
  actorName: string;
  actorAvatarUrl?: string | null;
  message: string;
  subject?: string;
  quote?: string;
  eventId?: string;
  postId?: string;
  replyId?: string;
  read: boolean;
  createdAt?: unknown;
}

export type NewUserNotification = Omit<UserNotification, 'id' | 'createdAt'>;
