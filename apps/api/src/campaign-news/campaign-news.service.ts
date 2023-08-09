import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateCampaignNewsDto } from './dto/create-campaign-news.dto'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateCampaignNewsDto } from './dto/update-campaign-news.dto'
import { CampaignNewsState } from '@prisma/client'
import { CampaignNews } from '../domain/generated/campaignNews/entities'
import { SendGridParams } from '../notifications/providers/notifications.sendgrid.types'
import { DateTime } from 'luxon'
import { ConfigService } from '@nestjs/config'
import { MarketingNotificationsService } from '../notifications/notifications.service'

@Injectable()
export class CampaignNewsService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly marketingNotificationsService: MarketingNotificationsService,
  ) {}
  private RECORDS_PER_PAGE = 4

  async createDraft(campaignNewsDto: CreateCampaignNewsDto) {
    const notify = campaignNewsDto.notify
    delete campaignNewsDto.notify
    try {
      const campaignNews = await this.prisma.campaignNews.create({ data: campaignNewsDto })
      if (campaignNews.state === 'published' && notify)
        //Don't await --> send to background
        this.sendArticleNotification(campaignNews).catch((e) => console.log(e))
      return campaignNews
    } catch (error) {
      const message = 'Creating article about campaign failed'
      Logger.warn(error)
      throw new BadRequestException(message)
    }
  }

  async sendArticleNotification(news: CampaignNews) {
    const template = await this.prisma.marketingTemplates.findFirst({
      where: {
        name: `Campaign News`,
      },
    })

    const campaign = await this.prisma.campaign.findFirst({
      where: { id: news.campaignId },
      include: { notificationLists: true, vaults: true },
    })

    if (!campaign) return

    const emailLists = campaign.notificationLists

    if (template && emailLists?.length) {
      const data: SendGridParams['SendNotificationParams'] = {
        template_id: template.id,
        list_ids: [emailLists[0].id],
        subject: news.title,
        // Allow user to un-subscribe only from this campaign notifications
        campaignid: campaign.id,
        template_data: {
          'campaign.name': campaign?.title,
          'campaign.target-amount': campaign?.targetAmount || 0,
          'campaign.raised-amount':
            campaign.vaults?.map((vault) => vault.amount).reduce((a, b) => a + b, 0) || 0,
          'campaign.start-date': campaign.startDate
            ? DateTime.fromJSDate(campaign.startDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.end-date': campaign.endDate
            ? DateTime.fromJSDate(campaign.endDate).toFormat('dd-MM-yyyy')
            : '',
          'campaign.news-title': news.title,
          'campaign.news-desc': news.slug,
          'campaign.news-link': (
            this.config.get<string>('APP_URL') + `/campaigns/${campaign.slug}/news`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
          'general-unsubscribe': (
            this.config.get<string>('APP_URL') +
            `/notifications/unsubscribe?email={{ insert email }}`
          ).replace(/(http:\/\/|https:\/\/)/gi, ''),
        },
      }

      await this.marketingNotificationsService.provider.sendNotification(data)
    }
  }

  async canCreateArticle(campaignId: string, keycloakId: string) {
    const canEdit = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizer: { person: { keycloakId } } },
    })
    return !!canEdit
  }

  async listPublishedNewsWithPagination(currentPage: number) {
    const [articles, totalRecords] = await this.prisma.$transaction([
      this.prisma.campaignNews.findMany({
        where: { state: CampaignNewsState.published },
        orderBy: { publishedAt: 'desc' },
        take: this.RECORDS_PER_PAGE,
        skip: Number((currentPage - 1) * this.RECORDS_PER_PAGE),
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          publishedAt: true,
          description: true,
          newsFiles: true,
          campaign: {
            select: {
              title: true,
              state: true,
            },
          },
        },
      }),
      this.prisma.campaignNews.count({
        where: { state: CampaignNewsState.published },
      }),
    ])

    const totalPages = Math.ceil(totalRecords / this.RECORDS_PER_PAGE)

    return {
      campaign: {
        campaignNews: articles,
      },
      pagination: {
        currentPage: currentPage,
        nextPage: currentPage === totalPages ? currentPage : currentPage + 1,
        prevPage: currentPage > 1 ? currentPage - 1 : 1,
        totalPages: totalPages,
      },
    }
  }

  async findArticleByID(articleId: string) {
    const article = await this.prisma.campaignNews
      .findFirst({
        where: { id: articleId },
        include: {
          newsFiles: true,
        },
      })
      .catch((error) => Logger.warn(error))
    return article
  }

  async findArticlesByCampaignSlugWithPagination(slug: string, currentPage: number) {
    const [campaign, totalRecords] = await this.prisma.$transaction([
      this.prisma.campaign.findFirst({
        where: { slug },
        select: {
          title: true,
          slug: true,
          campaignNews: {
            where: { state: CampaignNewsState.published },
            orderBy: { publishedAt: 'desc' },
            take: this.RECORDS_PER_PAGE,
            skip: Number((currentPage - 1) * this.RECORDS_PER_PAGE),
            select: {
              id: true,
              title: true,
              slug: true,
              publishedAt: true,
              author: true,
              description: true,
              newsFiles: true,
            },
          },
        },
      }),
      this.prisma.campaignNews.count({
        where: { campaign: { slug: slug }, state: CampaignNewsState.published },
      }),
    ])

    if (!campaign) throw new NotFoundException('No news were found for the selected campaign')

    const totalPages = Math.ceil(totalRecords / this.RECORDS_PER_PAGE)

    return {
      campaign,
      pagination: {
        currentPage: currentPage,
        nextPage: currentPage === totalPages ? currentPage : currentPage + 1,
        prevPage: currentPage > 1 ? currentPage - 1 : 1,
        totalPages: totalPages ?? 1,
      },
    }
  }

  async findArticleBySlug(slug: string) {
    return await this.prisma.campaignNews
      .findFirst({ where: { slug: slug }, include: { newsFiles: true } })
      .catch((error) => Logger.warn(error))
  }

  async listAdminArticles(campaignSlug: string) {
    return await this.prisma.campaign.findFirst({
      where: { slug: campaignSlug },
      select: {
        id: true,
        title: true,
        campaignNews: {
          select: {
            id: true,
            title: true,
            author: true,
            slug: true,
            createdAt: true,
            publishedAt: true,
            editedAt: true,
            state: true,
          },
        },
      },
    })
  }

  async editArticle(id: string, state: CampaignNewsState, editArticleDto: UpdateCampaignNewsDto) {
    const notify = editArticleDto.notify
    delete editArticleDto.notify

    try {
      const updated = await this.prisma.campaignNews.update({
        where: { id },
        data: {
          ...editArticleDto,
          editedAt: new Date(),
          publishedAt:
            editArticleDto.state === CampaignNewsState.published &&
            state === CampaignNewsState.draft
              ? new Date()
              : editArticleDto.state === CampaignNewsState.draft
              ? null
              : undefined,
        },
      })

      if (
        state === CampaignNewsState.draft &&
        updated.state === CampaignNewsState.published &&
        notify
      )
        //Don't await --> send to background
        this.sendArticleNotification(updated).catch((e) => console.log(e))

      return updated
    } catch (error) {
      const message = 'Updating news article has failed!'
      Logger.warn(error)
      throw new BadRequestException(message)
    }
  }

  async listAllArticles() {
    const fetch = await this.prisma.campaignNews.findMany({
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
    })
    return fetch
  }

  async deleteArticle(articleId: string) {
    try {
      const test = await this.prisma.campaignNews.delete({ where: { id: articleId } })
      return test
    } catch (error) {
      const message = 'Deleting news article has failed!'
      Logger.warn(error)
      throw new BadRequestException(message)
    }
  }
}
