import React from 'react';
import Pivots from '@ux/pivot';
import { withLocaleRequired } from '@gasket/react-intl';
import { FormattedMessage } from 'react-intl';
import Head from '../components/head';

import Settings from '@ux/icon/settings';
import Wand from '@ux/icon/wand';
import Play from '@ux/icon/play';
import Help from '@ux/icon/help';

import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';

const pivotList = [
  {
    graphic: (<Settings />),
    href: 'http://gdl.ink/gasket',
    subtitle: <FormattedMessage id='learn_gasket_subtitle' />,
    title: <FormattedMessage id='learn_gasket' />
  },
  {
    graphic: (<Wand />),
    href: 'https://uxcore.uxp.gdcorp.tools/docs/getting-started/uxcore2/gasket',
    subtitle: <FormattedMessage id='learn_uxcore2_subtitle' />,
    title: <FormattedMessage id='learn_uxcore2' />
  },
  {
    graphic: (<Play />),
    href: 'https://nextjs.org/learn',
    subtitle: <FormattedMessage id='learn_nextjs_subtitle' />,
    title: <FormattedMessage id='learn_nextjs' />
  },
  {
    graphic: (<Help />),
    href: 'https://godaddy.slack.com/messages/CABCTNQ5P/',
    subtitle: <FormattedMessage id='gasket_support_subtitle' values={ ({
      gasket: (<code>@gasket</code>),
      gasketChannel: (<code>#gasket-support</code>)
    }) } />,
    title: <FormattedMessage id='gasket_support' />
  }
];

export const IndexPage = () => (
  <div className='container m-t-3'>
    <Head title='Home' />
    <div className='row'>
      <div className='card ux-card'>
        <div className='card-block'>
          <div className='card-title'>
            <h1 className='p-t-1'>Welcome to Gasket!</h1>
            <p className='description'>To get started, edit <code>pages/index.js</code> and save to reload.</p>
          </div>
          <div className='card-title'>
            <p className='description'>Looking for more info about a Gasket package, plugin, or preset?<br />
          You can run <code>gasket docs</code> in your app to learn more.</p>
          </div>
          <div className='card-block'>
            <Pivots pivotList={ pivotList } grid={ ({ md: 6 }) } />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
