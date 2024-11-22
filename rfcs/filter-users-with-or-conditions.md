# Filter users with or confition

Provides an ability to get a list of users with different search parameters

## Why

For some tasks, we need to implement a search for users by id, name, etc. concurrent search by id and name will be carried out with the condition "and", which will return incomplete data.

### Solution

update redis-filtered-sort library

make https://github.com/makeomatic/redis-filtered-sort  possible to accept the parameter "or"

add 'or' value for opType enum

if filter contains 'or' field recursively get result fot all filters



for ms-users service add additional property or for filter

schemas/common.json

```
"filter": {
  ...
  "additionalProperties": {
    "oneOf": [
        ...
      {
        "type": "object",
        "minProperties": 1,
        "maxProperties": 2,
        "patternProperties": {
          ...
          "or": {
            "type": "array",
            "items": {
              "$ref": "common.json#/definitions/filter"
            },
          }
        }
      }
    ]
  }
},
```
then we will be able to get users by different filters and merge them


#### advantages

it can be used in other projects

it won't break backward compatibility

#### disadvantages

we need more time to develop

