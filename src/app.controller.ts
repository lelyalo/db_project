import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) { }

  @Get('/gyms')
  @Render('gyms.hbs')
  async getGyms() {
    const res = await this.prismaService.$queryRaw`     
      select g.id, g.description  from "Gym" g 
`;
    return { render: true, res };
  }

  @Get('/coaches')
  @Render('coaches.hbs')
  async getCoaches() {
    const res = await this.prismaService.$queryRaw`     
      SELECT c.name, c.phone, c.email, count(*) as count FROM "Coach" c
      LEFT JOIN "Training" t  ON t."coachName" =c.name
      GROUP BY c.name
      ORDER BY count desc`;
    return { render: true, res };
  }

  @Get('/reservations')
  @Render('reservations.hbs')
  async getReservations() {
    const res = await this.prismaService.$queryRaw`     
      select r."clientName", t."name", t."startingTime" , t."coachName", c.phone  from "Reservations" r 
      join "Training" t ON t.id = r."trainingId" 
      join "Coach" c on c."name" = t."coachName" 
`;
    return { render: true, res };
  }

  @Get('/gym_stats')
  @Render('gym_stats.hbs')
  async getGymStats(@Query('gym') gym: string) {
    const g = gym ? Number(gym) : 0;
    if (!g) return { render: false };

    const res = await this.prismaService.$queryRaw`     
      select g.id, g.description, count(*)  from "Gym" g 
      join "Training" t ON t."gymId" = g.id
      group by g.id 
      having g.id = ${g}`;
    return { render: true, res };
  }

  @Get('/coaches_stats')
  @Render('coaches_stats.hbs')
  async getCoachesStats(@Query('count') count: string) {
    const c = count ? Number(count) : 0;
    if (!c) return { render: false };

    const res = await this.prismaService.$queryRaw`     
      select c."name", count(*) as count from "Coach" c 
      join "Training" t ON t."coachName" = c."name" 
      join "Reservations" r on t.id = r."trainingId" 
      group by c."name" 
      having count(*) >= ${c}`;
    return { render: true, res };
  }

  @Get('/reservations/new')
  @Render('create_reservation.hbs')
  async createReservation() {
    return { render: true };
  }

  @Post('/reservations/new')
  @Redirect('/reservations')
  async receiveReservation(@Body() body: any) {
    const client: string = body.client;
    const training: string = body.training;

    if (client == null) return { render: true };
    const tr = Number(training);

    const res = await this.prismaService.$executeRaw`     
      INSERT INTO "Reservations" ("trainingId", "clientName", "paymentId") VALUES (${tr}, ${client}, 1);`;

    return { render: true, res };
  }
}
