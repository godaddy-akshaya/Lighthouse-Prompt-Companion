module.exports = {
  "env": "production",
  "region": "us-west-2",
  "root": "https://lighthouse.c3.int.gdcorp.tools",
  "sso": {
    "root": "https://sso.gdcorp.tools",
    "cookie": {
      "domain": ".gdcorp.tools",
      "path": "/",
      "secure": true,
      "httpOnly": true
    }
  },
  "api": {
    "table_listing": {
      "method": "GET",
      "url": "https://lojoo506re.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "table_filters": {
      "method": "GET",
      "url": "https://xk89vym7gd.execute-api.us-west-2.amazonaws.com/gddeploy",
      "params": {
        "table_name": "string"
      }
    },
    "table_data_row_count": {
      "method": "POST",
      "url": "https://kby0c37h1j.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_status": {
      "method": "GET",
      "url": "https://x2x9swo6x5.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit_job": {
      "method": "POST",
      "url": "https://70bwwwm445.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "cancel_job": {
      "method": "POST",
      "url": "https://7y9v81tazb.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_results": {
      "method": "GET",
      "url": "https://nk7y0uidib.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_summary": {
      "method": "GET",
      "url": "https://jkb6iltdd7.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit_summary_job": {
      "method": "POST",
      "url": "https://o4aj4d6r36.execute-api.us-west-2.amazonaws.com/gddeploy"
    }
  }
}
