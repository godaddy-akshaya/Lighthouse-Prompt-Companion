import React from 'react';
import PropTypes from 'prop-types';

function FourOFour({ statusCode }) {
    return (
        <p>
            {statusCode
                ? `A ${statusCode} error occurred on server`
                : 'An error occurred on client'}
        </p>
    );
}


FourOFour.propTypes = {
    statusCode: PropTypes.number
};

export default FourOFour;