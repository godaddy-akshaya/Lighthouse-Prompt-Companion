import React from 'react';
import Button from '@ux/button';

function DeleteQuery({ queryId, onDelete }) {

  function handleDelete() {
    onDelete({ queryId });
  }

  return (<>
    {queryId && <Button size='sm' onClick={handleDelete} text={`Delete Query: ${queryId}`} design='critical' />}
  </>
  );
}

export default DeleteQuery;
