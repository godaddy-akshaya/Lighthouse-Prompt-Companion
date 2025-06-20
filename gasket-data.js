// gasket-data.js

import local from './config/local.js';
import production from './config/production.js';

export default {
  environments: { 
    local: {
     ...local
    },
    production: { ...production },
  }
}

