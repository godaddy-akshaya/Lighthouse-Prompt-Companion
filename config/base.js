module.exports = {
  "env": "development",
  "region": "us-west-2",
  "root": "https://lighthouse.c3.int.dev-gdcorp.tools",
  "sso": {
    "root": "https://sso.dev-gdcorp.tools",
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
    "table_filters": {
      "method": "GET",
      "url": "https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev"
    },
    "table_data_row_count": {
      "method": "POST",
      "url": "https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev"
    },
    "submit_job": {
      "method": "POST",
      "url": "https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev"
    },
    "cancel_job": {
      "method": "POST",
      "url": "https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev"
    },
    "view_results": {
      "method": "GET",
      "url": "https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev"
    },
    "view_summary": {
      "method": "GET",
      "url": "https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev"
    },
    "submit_summary_job": {
      "method": "POST",
      "url": "https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev"
    }
  }
}
