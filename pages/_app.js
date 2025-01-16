import '../styles/global.scss';

import { withLocaleRequired } from '@gasket/react-intl';
import { withPageEnhancers } from '@godaddy/gasket-next';
import { withAuthRequired } from '@godaddy/gasket-auth';
import { App, reportWebVitals } from '@godaddy/gasket-next';
export { reportWebVitals };

export default withPageEnhancers([
  withLocaleRequired('/locales', { initialProps: true }),
  withAuthRequired(
    {
      app: 'lighthouse',
      realm: 'jomax',
      groups: ['lighthouse-ui-devs', 'lighthouse-ui-group']
    })
])(App);
