module.exports = {
  "env": "local",
  "region": "us-west-2",
  "root": "https://local.c3.int.dev-gdcorp.tools:8443",
  "sso": {
    "root": "https://sso.dev-gdcorp.tools",
    "groups": ["lighthouse-ui-group"],
    "cookie": {
      "domain": ".dev-gdcorp.tools",
      "path": "/",
      "secure": true,
      "httpOnly": true
    }
  },
  "api": {
    "table-listing": {
      "method": "GET",
      "url": "https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev"
    },
    "view-status": {
      "method": "GET",
      "url": "https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/dev"
    },
    "table-filters": {
      "method": "GET",
      "url": "https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev"
    },
    "row-count": {
      "method": "POST",
      "url": "https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev"
    },
    "table-data-row-count": {
      "method": "POST",
      "url": "https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev"
    },
    "submit-job": {
      "method": "POST",
      "url": "https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev"
    },
    "cancel-job": {
      "method": "POST",
      "url": "https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev"
    },
    "view-results": {
      "method": "GET",
      "url": "https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev"
    },
    "view-summary": {
      "method": "GET",
      "url": "https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev"
    },
    "submit-summary-job": {
      "method": "POST",
      "url": "https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev"
    }
  }
}
