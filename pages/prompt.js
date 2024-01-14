import React, { useState, useEffect } from 'react';
import { withLocaleRequired } from '@gasket/react-intl';

import Logo from '../components/logo';



export const PromptPage = () => (
    <>
        <Logo />
    </>
)
export default withLocaleRequired('/locales', { initialProps: true })(PromptPage);
