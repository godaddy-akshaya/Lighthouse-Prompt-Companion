module.exports = {
  env: 'development',
  region: 'us-west-2',
  root: 'https://lighthouse.c3.int.dev-gdcorp.tools',
  groups: ['lighthouse-ui-devs'],
  opensearch: 'https://opensearch.org/docs/latest/',
  api: {
    'table-listing': {
      method: 'GET',
      url: 'https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev'
    },
    'view-status': {
      method: 'GET',
      url: 'https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/dev'
    },
    'table-filters': {
      method: 'GET',
      url: 'https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev'
    },
    'row-count-2': {
      method: 'POST',
      url: 'https://0nc6ejrszd.execute-api.us-west-2.amazonaws.com/gddeploy'
    },
    'submit-job': {
      method: 'POST',
      url: 'https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev'
    },
    'cancel-job': {
      method: 'POST',
      url: 'https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev'
    },
    'row-count': {
      method: 'POST',
      url: 'https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev'
    },
    'view-results': {
      method: 'GET',
      url: 'https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev'
    },
    'view-summary': {
      method: 'GET',
      url: 'https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev'
    },
    'submit-summary-job': {
      method: 'POST',
      url: 'https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev'
    },
    'gdlh_get_interaction_ids': {
      method: 'GET',
      url: 'https://km6yahk783.execute-api.us-west-2.amazonaws.com/dev'
    },
    'gdlh_save_interaction_ids': {
      method: 'POST',
      url: 'https://byq18tmxu0.execute-api.us-west-2.amazonaws.com/dev'
    },
    'validate-lexical-query': {
      method: 'POST',
      url: 'https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev'
    },
    'submit-lexical-query': {
      method: 'POST',
      url: 'https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev'
    },
    'get-all-lexical-queries': {
      method: 'POST',
      url: 'https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev'
    },
    'delete-lexical-query': {
      method: 'POST',
      url: 'https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev'
    },
    'dynamic-model-list': {
      method: 'GET',
      url: 'https://2yw3f4076j.execute-api.us-west-2.amazonaws.com/default/get_gdlh_model_list'
    },
    'get-lexical-query-hits': {
      method: 'POST',
      url: 'https://fo4s1ll5eg.execute-api.us-west-2.amazonaws.com/gddeploy'
    }
  }
};



