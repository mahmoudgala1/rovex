function parseQueryString(query: Record<string, any>) {
  const queryObj: Record<string, any> = {};

  for (const key in query) {
    const match = key.match(/^(.+)\[(.+)\]$/); // matches "price[$gte]"
    if (match) {
      const field = match[1]; // "price"
      const operator = `$${match[2]}`; // "$gte"
      if (!queryObj[field]) queryObj[field] = {};
      queryObj[field][operator] = isNaN(Number(query[key])) ? query[key] : Number(query[key]);
    } else {
      queryObj[key] = isNaN(Number(query[key])) ? query[key] : Number(query[key]);
    }
  }

  return queryObj;
}
export default parseQueryString;