import { ApiTags } from '@nestjs/swagger'
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Inject,
  forwardRef,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CreateCampaignNewsDto } from './dto/create-campaign-news.dto'
import { CampaignNewsService } from './campaign-news.service'
import { UpdateCampaignNewsDto } from './dto/update-campaign-news.dto'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { CampaignNewsState } from '@prisma/client'

@ApiTags('campaign-news')
@Controller('campaign-news')
export class CampaignNewsController {
  constructor(
    private readonly campaignNewsService: CampaignNewsService,
    @Inject(forwardRef(() => PersonService)) private personService: PersonService,
  ) {}

  @Post()
  @Roles({
    roles: [],
    mode: RoleMatchingMode.ANY,
  })
  async create(
    @Body() createCampaignNewsDto: CreateCampaignNewsDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {

    const isCampaignOrganizer = await this.campaignNewsService.canCreateArticle(createCampaignNewsDto.campaignId, user.sub);

    if(!isCampaignOrganizer && !isAdmin(user)) {
      throw new ForbiddenException('The user is not coordinator,organizer or beneficiery to the requested campaign')
    }

    const person = await this.personService.findOneByKeycloakId(user.sub)

    if (!person) {
      throw new NotFoundException('User has not been found')
    }

    return await this.campaignNewsService.createDraft({
      ...createCampaignNewsDto,
      publisherId: person.id,
    })
  }

  @Get('list-all')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async getAdminList() {
    return await this.campaignNewsService.listAllArticles()
  }

  @Get(':slug')
  @Public()
  async findOne(@Param('slug') slug: string) {
    return await this.campaignNewsService.findArticleBySlug(slug)
  }

  @Get('byId/:id')
  @Public()
  async findById(@Param('id') id: string) {
    return await this.campaignNewsService.findArticleByID(id)
  }

  @Put(':id')
  @Roles({
    roles: [],
    mode: RoleMatchingMode.ANY,
  })
  async editArticle(
    @Param('id') articleId: string,
    @Body() updateCampaignNewsDto: UpdateCampaignNewsDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const article = await this.campaignNewsService.findArticleByID(articleId)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    const publisher = await this.personService.findOneByKeycloakId(user.sub);
    if(!publisher) {
      throw new NotFoundException('Author was not found')
    };

    if((article.state === CampaignNewsState.draft && publisher.id !== article.publisherId) && !isAdmin(user)){
      throw new ForbiddenException('The user has no access to delete this article')
    }

    if(article.state === CampaignNewsState.published && !isAdmin(user)){
      throw new ForbiddenException("User has no access to edit this article")
    }

    return await this.campaignNewsService.editArticle(
      articleId,
      article.state,
      updateCampaignNewsDto,
    )
  }

  @Delete(':id')
  @Roles({
    roles: [],
    mode: RoleMatchingMode.ANY,
  })
  async delete(@Param('id') articleId: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    const article = await this.campaignNewsService.findArticleByID(articleId);
    if(!article) throw new NotFoundException('Article not found')

    const publisher = await this.personService.findOneByKeycloakId(user.sub);

    if(!publisher) {
      throw new NotFoundException('Author was not found')
    };

    if((article.state === CampaignNewsState.draft && publisher.id !== article.publisherId) && !isAdmin(user)){
      throw new ForbiddenException('The user has no access to delete this article')
    }

    if (article.state === CampaignNewsState.published && !isAdmin(user)) {
      throw new ForbiddenException('The user has no access to delete this article')
    }

    return await this.campaignNewsService.deleteArticle(articleId)
  }
}
