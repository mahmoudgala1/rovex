export interface CreateProductInput {
  title: string;
  price: number;
  description?: string;
  discount?: number;
  stock: number;
}
export type UpdateProductInput = Partial<CreateProductInput>;

export interface GetPtoductParams{
    id:string
}
