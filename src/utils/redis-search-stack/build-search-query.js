const {
  expression,
  numericRange,
  paramRef,
  namedField,
  tag,
  negative,
  containsAny,
} = require('./expressions');

const EMPTY_VALUE = typeof null; // NOTE Using "" occures the parser error
const FIELD_PREFIX = 'f';

const ParamSuffix = {
  eq: 'eq',
  ne: 'ne',
  match: 'm',
};

const buildParamName = (...args) => args.join('_');
const normalizePropName = (prop) => prop.replace(/\|/g, '_');

const searchQueryBuilder = {
  // (prop, field, expr)
  gte: (_, field, expr) => expression(field, numericRange(expr.gte, expr.lte)),
  lte: (_, field, expr) => expression(field, numericRange(expr.gte, expr.lte)),
  exists: (_, field) => negative(expression((field), EMPTY_VALUE)),
  isempty: (_, field) => expression((field), EMPTY_VALUE),
  eq: (prop, field) => {
    const name = buildParamName(FIELD_PREFIX, prop, ParamSuffix.eq);
    return expression(field, tag(paramRef(name)));
  },
  ne: (prop, field) => {
    const name = buildParamName(FIELD_PREFIX, prop, ParamSuffix.ne);
    return negative(expression(field, tag(paramRef(name))));
  },
  match: (prop, field) => {
    const propName = normalizePropName(prop);
    const name = buildParamName(FIELD_PREFIX, propName, ParamSuffix.match);

    return expression(field, containsAny(paramRef(name)));
  },
};

const searchParamBuilder = {
  // (prop, expr)
  eq: (prop, expr) => {
    const name = buildParamName(FIELD_PREFIX, prop, ParamSuffix.eq);
    return [name, expr.eq];
  },
  ne: (prop, expr) => {
    const name = buildParamName(FIELD_PREFIX, prop, ParamSuffix.ne);
    return [name, expr.ne];
  },
  match: (prop, expr) => {
    const propName = normalizePropName(prop);
    const name = buildParamName(FIELD_PREFIX, propName, ParamSuffix.match);
    return [name, expr.match];
  },
};

const buildSearchQuery = (propName, valueOrExpr) => {
  const field = namedField(propName);

  // Process simple value
  if (typeof valueOrExpr === 'string') {
    const pName = buildParamName(FIELD_PREFIX, propName);
    const query = expression(field, paramRef(pName));

    const params = [pName, valueOrExpr];
    return [query, params];
  }
  // Omit 'fields' prop from  #multi statement if exists
  const { fields, ...expr } = valueOrExpr;

  // Process expression with action & value
  const action = Object.keys(expr)[0];

  const buildQuery = searchQueryBuilder[action];
  const buildParams = searchParamBuilder[action];

  if (buildQuery === undefined) {
    throw Error(`Not supported operation: ${valueOrExpr}`);
  }

  const query = buildQuery(propName, field);
  const params = (buildParams !== undefined) ? buildParams(propName, valueOrExpr) : [];

  return [query, params];
};

module.exports = buildSearchQuery;
