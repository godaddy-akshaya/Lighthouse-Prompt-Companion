import '../styles/global.scss';
import '@ux/select-input/styles';
import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';
import '@ux/text-input/styles';
import '@ux/card/styles';
import '@ux/button/styles';
import '@ux/icon/home/index.css';
import '@ux/icon/add/index.css';
import '@ux/icon/copy/index.css';
import '@ux/checkbox/styles';
import '@ux/date-input/styles';
import '@ux/menu/styles';
import '@ux/button/styles';
import '@ux/filter/styles';
import '@ux/file-upload/styles';
import '@ux/icon/checkbox-list/index.css';
import '@ux/select-input/styles';
import '@ux/icon/checkmark/index.css';
import '@ux/icon/remove/index.css';
import '@ux/icon/create-form/index.css';
import '@ux/collapsible/styles';
import '@ux/select-input/styles';
import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';
import '@ux/alert/styles';
import '@ux/tag/styles';
import '@ux/icon/upload/index.css';
import '@ux/flyout/styles';
import '@ux/modal/styles';
import '@ux/menu/styles';
import '@ux/icon/download/index.css';
import '@ux/icon/create-form/index.css';
import '@ux/flyout/styles';
import '@ux/message-overlay/styles';
import '@ux/tooltip/styles';
import { withLocaleRequired } from '@gasket/react-intl';
import { withPageEnhancers } from '@godaddy/gasket-next';
import { withAuthRequired } from '@godaddy/gasket-auth';
import { App, reportWebVitals } from '@godaddy/gasket-next';
export { reportWebVitals };
const options = {
    realm: 'jomax',
    groups: ['lighthouse-ui-group'],
};
export default withPageEnhancers([
    withLocaleRequired('/locales', { initialProps: true }), withAuthRequired(options)
])(App);
