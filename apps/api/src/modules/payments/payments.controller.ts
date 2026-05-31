import {
  Controller, Get, Post, Body, Param, Headers, RawBodyRequest, Req,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout/stripe/:courseId')
  createStripeCheckout(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Body() body: { couponCode?: string },
  ) {
    return this.svc.createStripeCheckout(user.id, courseId, body.couponCode);
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.svc.handleStripeWebhook(req.rawBody!, sig);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getMyOrders(@CurrentUser() user: any) {
    return this.svc.getUserOrders(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('creator/revenue')
  getCreatorRevenue(@CurrentUser() user: any) {
    return this.svc.getCreatorRevenue(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('creator/payout')
  requestPayout(
    @CurrentUser() user: any,
    @Body() body: { amount: number; pixKey: string },
  ) {
    return this.svc.requestPayout(user.id, body.amount, body.pixKey);
  }
}
