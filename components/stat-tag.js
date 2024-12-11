import React from 'react';
import Box from '@ux/box';
import Card, { spaceOptions } from '@ux/card';
import text from '@ux/text';
import Tag from '@ux/tag';

const StatTag = ({ title, count, total, percentage }) => {
    return (
        <Box orientation='horizontal' blockAlignChildren='start' inlineAlignChildren='start'>
            <Card id={title} space={{ inline: 'sm', block: 'sm' }}>
                <text.label as='label' text={`${title} ${percentage}`} />
                <Box gap={'sm'}>
                    <text.span as='caption' text={`${count} of ${total}`} />
                </Box>
            </Card>
        </Box>
    )
}
export default StatTag;
