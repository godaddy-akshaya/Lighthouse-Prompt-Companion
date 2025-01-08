import React from 'react';
import Box from '@ux/box';
import Card from '@ux/card';
import text from '@ux/text';

const StatTag = ({ title, tags }) => {
  const formatNumber = (number) => {
    // check if has decimal
    if (number % 1 !== 0) {
      return number.toFixed(2);
    } else {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // add comma to number
    }
  }
  return (
    <Card space={{ block: 'sm', inline: 'sm' }}>
      <text.label text={title?.toString().toUpperCase()} as='label' /><br />
      <Box>
        {tags.map((tag, index) => (
          <Box key={index}>
            {`${tag.name.split('_').join(' ')} ${formatNumber(tag.value)}`}
          </Box>
        ))} </Box>
    </Card>
  )
}
export default StatTag;
