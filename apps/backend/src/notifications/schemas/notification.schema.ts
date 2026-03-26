import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import { uuidSchema, optionalStringSchema } from '../../common/schemas';

/**
 * Create notification schema
 */
export const CreateNotificationSchema = z.object({
  userId: uuidSchema,
  type: z.nativeEnum(NotificationType).optional(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  link: optionalStringSchema,
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
