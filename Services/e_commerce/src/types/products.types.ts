export interface CreateProductInput {
  title: string;
  price: number;
  description?: string;
  discount?: number;
    stock: number;
  is_active: boolean;
}
export type UpdateProductInput = Partial<CreateProductInput>;

export interface GetPtoductParams{
    id:string
}
