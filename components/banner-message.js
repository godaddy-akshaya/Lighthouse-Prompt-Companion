import React from 'react';
import { Block } from '@ux/layout';
import Alert from '@ux/alert';
import Button from '@ux/button';



export const BannerMessage = ({ showMessage, message, userMessageType, handleCloseError }) => {
    return (
        <Block>
            {showMessage &&
                <Alert
                    title={message}
                    id='critical-message'
                    emphasis={userMessageType === 'error' ? 'critical' : 'success'}
                    actions={<Button design="inline" onClick={handleCloseError} text="Close" />} />
            }
        </Block>
    )
}