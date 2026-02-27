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
      const queryObj = { ...queryString };

      if (queryObj.title && typeof queryObj.title === 'string') {
          queryObj.title = { $regex: queryObj.title, $options: 'i' };
      }
      const features = new QueryBuilder(productModel.find({ is_active: true, company: company }), queryObj)
            .filter()
            .sort()
            .limitFields()
            .paginate();
      
            await features.countTotal();
   
    const allProducts = await features.modelQuery;
    const pagination = features.getPaginationMetadata();
    
   return {
    data: allProducts,
    pagination,
  };

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
