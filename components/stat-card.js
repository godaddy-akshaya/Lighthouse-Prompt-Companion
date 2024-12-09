import React from 'react';
import Box from '@ux/box';
import Card, { spaceOptions } from '@ux/card';
import text from '@ux/text';
import Tag from '@ux/tag';

const StatCard = ({ stats }) => {
    // if End of text = 'hit_count' then display the hit count
    const _HIT_COUNT = 0;
    const _TOTAL_HIT_COUNT = 0;
    const _HIT_PERCENTAGE = 0;
    const _TITLE = 'Hit Count';
    return (
        <Box orientation='horizontal'>

            <Tag emphasis='neutral' size='sm'>
                {_TITLE}
                {_HIT_COUNT} / {_TOTAL_HIT_COUNT} {_HIT_PERCENTAGE}
            </Tag>
        </Box>
    )
}
export default StatCard;