import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { CreateCampaignNewsDto } from './dto/create-campaign-news.dto'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateCampaignNewsDto } from './dto/update-campaign-news.dto'
import { CampaignNewsState } from '@prisma/client'

@Injectable()
export class CampaignNewsService {
  constructor(private prisma: PrismaService) {}
  private RECORDS_PER_PAGE = 4

  async createDraft(campaignNewsDto: CreateCampaignNewsDto) {
    try {
      return await this.prisma.campaignNews.create({ data: campaignNewsDto })
    } catch (error) {
      const message = 'Creating article about campaign failed'
      Logger.warn(error)
      throw new BadRequestException(message)
    }
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
          articleFiles: true,
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
      articles: articles,
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
          articleFiles: true
        }
      })
      .catch((error) => Logger.warn(error))
    return article
  }

  async findArticlesByCampaignSlug(slug: string, currentPage: number) {
    const [articles, totalRecords] = await this.prisma.$transaction([
      this.prisma.campaignNews.findMany({
        where: { campaign: { slug: slug }, state: CampaignNewsState.published },
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
          articleFiles: true,
          campaign: {
            select: {
              title: true,
              state: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.campaignNews.count({
        where: { campaign: { slug: slug }, state: CampaignNewsState.published },
      }),
    ])

    const totalPages = Math.ceil(totalRecords / this.RECORDS_PER_PAGE)

    return {
      articles: articles,
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
      .findFirst({ where: { slug: slug } })
      .catch((error) => Logger.warn(error))
  }

  async editArticle(id: string, state: CampaignNewsState, editArticleDto: UpdateCampaignNewsDto) {
    try {
      return await this.prisma.campaignNews.update({
        where: { id },
        data: {
          ...editArticleDto,
          editedAt: new Date(),
          publishedAt:
            editArticleDto.state === CampaignNewsState.published && state === CampaignNewsState.draft
              ? new Date()
              : editArticleDto.state === CampaignNewsState.draft
              ? null
              : undefined,
        },
      })
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
      console.log(test)
      return test
    } catch (error) {
      const message = 'Deleting news article has failed!'
      Logger.warn(error)
      throw new BadRequestException(message)
    }
  }
}
