import React from 'react';
import Box from '@ux/box';
import Card, { spaceOptions } from '@ux/card';
import text from '@ux/text';


const StatCard = ({ title, subtitle, value }) => {

    return (
        <>
            <Card id={`${title}-id`} space={{ 'block': true, inline: true }}>
                <Box blockPadding='sm' inlinePadding='md' gap='md'>
                    <text.span as='caption' text={subtitle} />
                    <text.h3 text={title} as='title' />
                    <text.span as='caption' text={value} />
                </Box>
            </Card>
        </>
    )
}
export default StatCard;