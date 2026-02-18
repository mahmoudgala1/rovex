import { PriceDTO, ProductDTO } from "../mappers/stripe.mapper";
import { stripe } from "../config/stripe.config";
import {
  CreateProductDTO,
  UpdateProductDTO,
  UpdatePriceDTO,
} from "../types/stripe.types";
import Stripe from "stripe";

export class ProductService {
  async createProduct(data: CreateProductDTO): Promise<Stripe.Product> {
    const productData: Stripe.ProductCreateParams = {
      name: data.name,
      description: data.description,
      active: data.active ?? true,
      metadata: data.metadata,
      images: data.images,
    };

    if (data.defaultPriceData) {
      productData.default_price_data = {
        currency: data.defaultPriceData.currency,
        unit_amount: data.defaultPriceData.unitAmount,
        recurring: data.defaultPriceData.recurring,
      };
    }

    const product = await stripe.products.create(productData);
    return product;
  }

  async getProduct(productId: string): Promise<Stripe.Product> {
    const product = await stripe.products.retrieve(productId);
    return product;
  }

  async updateProduct(
    productId: string,
    data: UpdateProductDTO,
  ): Promise<Stripe.Product> {
    const product = await stripe.products.update(productId, data);
    return product;
  }

  async deleteProduct(productId: string): Promise<Stripe.DeletedProduct> {
    const product = await stripe.products.del(productId);
    return product;
  }

  async listProducts(
    active?: boolean,
    limit: number = 10,
    startingAfter?: string,
  ): Promise<Stripe.ApiList<Stripe.Product>> {
    const params: Stripe.ProductListParams = {
      limit,
      starting_after: startingAfter,
    };

    if (active !== undefined) {
      params.active = active;
    }

    const products = await stripe.products.list(params);
    return products;
  }

  async searchProducts(
    query: string,
  ): Promise<Stripe.ApiSearchResult<Stripe.Product>> {
    const products = await stripe.products.search({
      query,
    });
    return products;
  }

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

  async getProductWithPrices(productId: string): Promise<{
    product: Stripe.Product;
    prices: Stripe.ApiList<Stripe.Price>;
  }> {
    const [product, prices] = await Promise.all([
      this.getProduct(productId),
      this.listPrices(productId),
    ]);

    return { product, prices };
  }

  async createProductWithPrice(data: {
    name: string;
    description?: string;
    currency: string;
    unitAmount: number;
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      intervalCount?: number;
    };
    images?: string[];
    metadata?: Record<string, string>;
  }): Promise<{
    product: Stripe.Product;
    price: Stripe.Price;
  }> {
    const product = await this.createProduct({
      name: data.name,
      description: data.description,
      images: data.images,
      metadata: data.metadata,
    });

    const price = await this.createPrice({
      productId: product.id,
      currency: data.currency,
      unitAmount: data.unitAmount,
      recurring: data.recurring,
    });

    return { product, price };
  }

  mapProductToDTO(
    product: Stripe.Product,
    options?: { code?: string },
  ): ProductDTO {
    return {
      id: product.id,
      code: options?.code ?? (product.metadata?.code || undefined),
      name: product.name,
      description: product.description,
      image: product.images?.[0],
      active: product.active,
      metadata: product.metadata as Record<string, string>,
    };
  }

  mapPriceToDTO(
    price: Stripe.Price,
    options?: { isDefault?: boolean },
  ): PriceDTO {
    return {
      id: price.id,
      productId: price.product as string,
      nickname: price.nickname,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count ?? null,
      active: price.active,
      isDefault: options?.isDefault ?? false,
    };
  }

  mapProductWithPricesToDTO(
    product: Stripe.Product,
    prices: Stripe.Price[],
    options?: { code?: string; defaultPriceId?: string },
  ) {
    return {
      ...this.mapProductToDTO(product, options),
      prices: prices.map((price) =>
        this.mapPriceToDTO(price, {
          isDefault: options?.defaultPriceId
            ? options.defaultPriceId === price.id
            : price.id === product.default_price,
        }),
      ),
    };
  }
}
