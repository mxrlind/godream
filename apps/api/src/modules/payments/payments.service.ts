import {
  Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@godream/database';
import Stripe from 'stripe';
import { DATABASE_SERVICE } from '../../common/database/database.module';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;
  private readonly PLATFORM_FEE_PERCENT: number;

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
    });
    this.PLATFORM_FEE_PERCENT = config.get<number>('STRIPE_PLATFORM_FEE_PERCENT', 15);
  }

  // ─── Create Stripe Checkout ───────────────────────────────
  async createStripeCheckout(userId: string, courseId: string, couponCode?: string) {
    const [user, course] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId } }),
      this.db.course.findUnique({ where: { id: courseId }, include: { creator: true } }),
    ]);

    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (!course) throw new NotFoundException('Curso não encontrado');
    if (course.isFree) throw new BadRequestException('Este curso é gratuito');

    // Check already purchased
    const alreadyPurchased = await this.db.paymentOrder.findFirst({
      where: { userId, courseId, status: 'PAID' },
    });
    if (alreadyPurchased) throw new BadRequestException('Você já possui este curso');

    let amount = Number(course.price) * 100; // cents
    let discountAmount = 0;
    let coupon = null;

    // Apply coupon
    if (couponCode) {
      // Find coupon and validate in code (simpler than complex Prisma cross-field conditions)
      const rawCoupon = await this.db.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          courseId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
      });
      // Validate usage limit
      coupon = rawCoupon && (rawCoupon.maxUses === null || rawCoupon.usedCount < rawCoupon.maxUses)
        ? rawCoupon
        : null;

      if (coupon) {
        if (coupon.discountPercent) discountAmount = Math.floor(amount * coupon.discountPercent / 100);
        if (coupon.discountFixed)   discountAmount = Math.min(amount, Number(coupon.discountFixed) * 100);
        amount -= discountAmount;
      }
    }

    const platformFee = Math.floor(amount * this.PLATFORM_FEE_PERCENT / 100);
    const creatorEarning = amount - platformFee;

    // Create pending order
    const order = await this.db.paymentOrder.create({
      data: {
        userId,
        courseId,
        couponId: coupon?.id,
        amount: amount / 100,
        originalAmount: Number(course.price),
        discountAmount: discountAmount / 100,
        platformFee: platformFee / 100,
        creatorEarning: creatorEarning / 100,
        currency: 'BRL',
        provider: 'STRIPE',
        status: 'PENDING',
      },
    });

    // Create Stripe session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: course.title,
            description: course.shortDesc || course.description.slice(0, 200),
            images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: order.id,
      success_url: `${this.config.get('APP_URL')}/payment/success?order=${order.id}`,
      cancel_url: `${this.config.get('APP_URL')}/courses/${course.slug}`,
      metadata: { orderId: order.id, userId, courseId },
    });

    await this.db.paymentOrder.update({
      where: { id: order.id },
      data: { providerOrderId: session.id, metadata: { sessionUrl: session.url } as any },
    });

    return { checkoutUrl: session.url, orderId: order.id };
  }

  // ─── Stripe Webhook ───────────────────────────────────────
  async handleStripeWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.get<string>('STRIPE_WEBHOOK_SECRET') || '',
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await this.db.paymentOrder.findUnique({
      where: { id: orderId },
      include: { coupon: true },
    });
    if (!order) return;

    await this.db.$transaction([
      this.db.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          providerPaymentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      }),
      this.db.paymentTransaction.create({
        data: {
          orderId,
          type: 'PURCHASE',
          amount: order.amount,
          currency: order.currency,
          description: 'Compra de curso via Stripe',
        },
      }),
    ]);

    // Update coupon usage
    if (order.couponId) {
      await this.db.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Enroll student
    await this.db.enrollment.upsert({
      where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
      update: {},
      create: { userId: order.userId, courseId: order.courseId },
    });

    // Update course stats
    await this.db.course.update({
      where: { id: order.courseId },
      data: {
        enrolledCount: { increment: 1 },
        revenueTotal: { increment: order.creatorEarning },
      },
    });

    this.logger.log(`Payment completed: order ${orderId}`);
  }

  private async handleRefund(charge: Stripe.Charge) {
    if (!charge.payment_intent) return;
    await this.db.paymentOrder.updateMany({
      where: { providerPaymentId: charge.payment_intent as string },
      data: { status: 'REFUNDED' },
    });
  }

  // ─── Order History ────────────────────────────────────────
  async getOrderHistory(userId: string) {
    return this.db.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, abbr: true, accentColor: true } },
      },
    });
  }

  // ─── Creator Revenue ──────────────────────────────────────
  async getCreatorRevenue(creatorId: string) {
    const orders = await this.db.paymentOrder.findMany({
      where: { course: { creatorId }, status: 'PAID' },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.creatorEarning), 0);
    const totalSales = orders.length;

    const byCourse = Object.values(
      orders.reduce<Record<string, any>>((acc, o) => {
        const cid = o.courseId;
        if (!acc[cid]) acc[cid] = { course: o.course, revenue: 0, sales: 0 };
        acc[cid].revenue += Number(o.creatorEarning);
        acc[cid].sales += 1;
        return acc;
      }, {}),
    );

    const payouts = await this.db.payoutRequest.findMany({
      where: { userId: creatorId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const paidOut = payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalRevenue,
      availableBalance: totalRevenue - paidOut,
      totalSales,
      byCourse,
      recentPayouts: payouts,
    };
  }

  // ─── Payout Request ───────────────────────────────────────
  async requestPayout(userId: string, amount: number, pixKey?: string, bankData?: any) {
    const revenue = await this.getCreatorRevenue(userId);
    if (amount > revenue.availableBalance) {
      throw new BadRequestException('Saldo insuficiente para saque');
    }
    if (amount < 50) {
      throw new BadRequestException('Valor mínimo de saque: R$ 50');
    }

    return this.db.payoutRequest.create({
      data: { userId, amount, pixKey, bankData: bankData as any, status: 'pending' },
    });
  }

  // ─── Get User Orders ──────────────────────────────────────
  async getUserOrders(userId: string) {
    return this.db.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true,
            abbr: true, accentColor: true, thumbnailUrl: true,
          },
        },
      },
    });
  }
}
