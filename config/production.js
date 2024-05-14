module.exports = {
  "env": "production",
  "region": "us-west-2",
  "root": "https://lighthouse.c3.int.gdcorp.tools",
  "groups": ['lighthouse-ui-group', 'lighthouse-ui-devs'],
  "api": {
    "table-listing": {
      "method": "GET",
      "url": "https://lojoo506re.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "table-filters": {
      "method": "GET",
      "url": "https://xk89vym7gd.execute-api.us-west-2.amazonaws.com/gddeploy",
      "params": {
        "table-name": "string"
      }
    },
    "row-count": {
      "method": "POST",
      "url": "https://0nc6ejrszd.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view-status": {
      "method": "GET",
      "url": "https://x2x9swo6x5.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit-job": {
      "method": "POST",
      "url": "https://70bwwwm445.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "cancel-job": {
      "method": "POST",
      "url": "https://7y9v81tazb.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view-results": {
      "method": "GET",
      "url": "https://nk7y0uidib.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view-summary": {
      "method": "GET",
      "url": "https://jkb6iltdd7.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit-summary-job": {
      "method": "POST",
      "url": "https://o4aj4d6r36.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    gdlh_get_interaction_ids: {
      "method": "GET",
      "url": "https://nnb0qzh6nc.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    gdlh_save_interaction_ids: {
      "method": "POST",
      "url": "https://udfi1nezze.execute-api.us-west-2.amazonaws.com/gddeploy"
    }
  }
}
