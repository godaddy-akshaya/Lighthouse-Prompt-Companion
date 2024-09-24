import React from 'react';
import { deleteLexicalQuery } from '../../lib/api';
import Button from '@ux/button';

function DeleteQuery({ queryId, onDelete }) {

  function handleDelete() {
    deleteLexicalQuery(queryId).then((data) => {
      if (data) {
        onDelete({ 'queryId': queryId });
      }

    });
  }

  return (<>
    {queryId && <Button size='sm' onClick={handleDelete} text={`Delete Query: ${queryId}`} design='inline' />}
  </>
  )
}

export default DeleteQuery;