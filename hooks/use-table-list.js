import React from 'react';
import { getTables } from '../lib/data/data.service';

const useTableList = () => {
  const [tables, setTables] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const data = await getTables();
        setTables(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  return { tables, loading, error };
};

export default useTableList;
