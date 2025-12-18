import { Query } from 'mongoose';
import { IQueryString } from '../types';
import parseQueryString from '../helper/parseQuery.helper';


export class QueryBuilder<T> {

    public modelQuery: Query<T[], T>;
    public queryString: IQueryString;

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
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }
}