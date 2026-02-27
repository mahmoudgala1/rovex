import { Query } from 'mongoose';
import { IQueryString } from '../types';
import parseQueryString from '../helper/parseQuery.helper';


export class QueryBuilder<T> {

    public modelQuery: Query<T[], T>;
    public queryString: IQueryString;
    private totalCount: number = 0;

  constructor(modelQuery: Query<T[], T>, queryString: IQueryString) {
    this.modelQuery = modelQuery;
    this.queryString = queryString;
  }

  filter() {
  const filteredQuery = parseQueryString(this.queryString);

  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete filteredQuery[el]);

  console.log('Query being sent to Mongo:', filteredQuery);

  this.modelQuery = this.modelQuery.find(filteredQuery);
  return this;
}


  sort() {
    if (this.queryString.sort) {
      
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.modelQuery = this.modelQuery.sort(sortBy);
    } else {
      
      this.modelQuery = this.modelQuery.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
     
      const fields = this.queryString.fields.split(',').join(' ');
      this.modelQuery = this.modelQuery.select(fields);
    } else {
      
      this.modelQuery = this.modelQuery.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10; 
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
    this.totalCount = await totalQueries;
    return this;
  }

  
  getPaginationMetadata() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const total_pages = Math.ceil(this.totalCount / limit);

    return {
      total: this.totalCount,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    };
  }
}