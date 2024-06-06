import { Injectable } from '@nestjs/common'
import { NotificationGateway } from './gateway'
import { Prisma } from '@prisma/client'

export const donationNotificationSelect = Prisma.validator<Prisma.PaymentSelect>()({
  id: true,
  status: true,
  currency: true,
  amount: true,
  extPaymentMethodId: true,
  createdAt: true,

  donations: {
    select: {
      id: true,
      targetVaultId: true,
      person: {
        select: {
          firstName: true,
          lastName: true,
          picture: true,
        },
      },
    },
  },
})

@Injectable()
export class NotificationService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  sendNotification(eventName: string, notificationData: unknown) {
    this.notificationGateway.server.emit(eventName, notificationData)
  }
}
