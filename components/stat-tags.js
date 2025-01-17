import React from 'react';
import Box from '@ux/box';
import Card from '@ux/card';
import text from '@ux/text';
import TextLockup from '@ux/text-lockup';

const StatTags = ({ stats }) => {
  console.log(stats);
  const formatNumber = (number) => {
    // check if has decimal
    if (number % 1 !== 0) {
      return number.toFixed(2).toString().concat('%');
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); // add comma to number

  };
  const toProperCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  return (<>
    <text.label as='label' text='Query Counts' />
    <Box stretch gap='lg' orientation='horizontal' blockAlignChildren='start' inlineAlignChildren='end'>

      {stats && stats.map((stat, index) => (
        <Card id='card-stat-tags' space={{ block: 'sm', inline: 'sm' }}>
          <Box key={index} space={{ block: 'sm' }}>
            <TextLockup
              eyebrow={`${toProperCase(stat?.name)}`}
              size="md"
              title={`${formatNumber(stat.percentage)}`}
            >
              <text.span as='caption' text={`${formatNumber(stat.count)} of ${formatNumber(stat.total)}`} />
            </TextLockup>

          </Box>    </Card>
      ))}
    </Box>
  </>
  );
};
export default StatTags;
