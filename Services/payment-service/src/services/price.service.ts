import { PriceDTO, PriceListDTO } from "../mappers/stripe.mapper";
import { stripe } from "../config/stripe.config";
import { UpdatePriceDTO } from "../types/stripe.types";
import Stripe from "stripe";

export class PriceService {
  async createPrice(data: {
    productId: string;
    currency: string;
    unitAmount: number;
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      intervalCount?: number;
      trialPeriodDays?: number;
    };
    active?: boolean;
    nickname?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Price> {
    const priceData: Stripe.PriceCreateParams = {
      product: data.productId,
      currency: data.currency,
      unit_amount: data.unitAmount,
      active: data.active ?? true,
      nickname: data.nickname,
      metadata: data.metadata,
    };

    if (data.recurring) {
      priceData.recurring = {
        interval: data.recurring.interval,
        interval_count: data.recurring.intervalCount,
        trial_period_days: data.recurring.trialPeriodDays,
      };
    }

    const price = await stripe.prices.create(priceData);
    return price;
  }

  async getPrice(priceId: string): Promise<Stripe.Price> {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
    return price;
  }

  async updatePrice(
    priceId: string,
    data: UpdatePriceDTO,
  ): Promise<Stripe.Price> {
    const price = await stripe.prices.update(priceId, data);
    return price;
  }

  async listPrices(
    productId?: string,
    active?: boolean,
    limit: number = 10,
  ): Promise<Stripe.ApiList<Stripe.Price>> {
    const params: Stripe.PriceListParams = {
      limit,
      expand: ["data.product"],
    };

    if (productId) {
      params.product = productId;
    }

    if (active !== undefined) {
      params.active = active;
    }

    const prices = await stripe.prices.list(params);
    return prices;
  }

  async searchPrices(
    query: string,
  ): Promise<Stripe.ApiSearchResult<Stripe.Price>> {
    const prices = await stripe.prices.search({
      query,
      expand: ["data.product"],
    });
    return prices;
  }

  mapPriceToDTO(
    price: Stripe.Price,
    options?: { isDefault?: boolean },
  ): PriceDTO {
    let productId: string;
    if (typeof price.product === "string") {
      productId = price.product;
    } else if (price.product && "id" in price.product) {
      productId = price.product.id;
    } else {
      productId = "unknown";
    }
    return {
      id: price.id,
      productId,
      nickname: price.nickname,
      amount: price.unit_amount! / 100,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count ?? null,
      active: price.active,
      isDefault: options?.isDefault ?? false,
    };
  }

  mapPriceListToDTO(
    apiList: Stripe.ApiList<Stripe.Price>,
    options?: {
      defaultPriceId?: string;
    },
  ): PriceListDTO {
    return {
      data: apiList.data.map((price) =>
        this.mapPriceToDTO(price, {
          isDefault: options?.defaultPriceId === price.id,
        }),
      ),
      hasMore: apiList.has_more,
    };
  }
}
