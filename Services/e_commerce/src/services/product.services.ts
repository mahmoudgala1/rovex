import { AppError } from "../utils/AppError";
import { productModel } from "../models/product.models";
import { CreateProductInput, UpdateProductInput} from "../types/products.types";
import { QueryBuilder } from "../utils/queryBuilder";
import { IQueryString } from "../types";


export const CreateProductService = async(ProdctBody:CreateProductInput,company:string,images_URL:string[]) =>
{

    const {title, price, description, discount, stock} = ProdctBody;

    const NewProduct = await productModel.create(
        {
            title,
            price,
            description,
            discount,
            images_URL: images_URL,
            stock,
            company

        }
    )
    
    return NewProduct

}

export const getAllProductsService = async(queryString:IQueryString,company:string) =>
{
    const features = new QueryBuilder(productModel.find({ is_active: true, company: company }), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();

   
    const allProducts = await features.modelQuery;
    
    return allProducts

}
// export const getProductByIdService = async(id:string) =>
// {
    
//     const product = await ProductModel.findById(id)
    
//     return product

// }

export const updateProductService = async (
  id: string,
  company: string,
  updateBody: UpdateProductInput
) => {
  const updatedProduct = await productModel.findOneAndUpdate(
        { _id: id,
          company: company
         },
    { $set: updateBody },
    { new: true }
  )
  return updatedProduct;
};
