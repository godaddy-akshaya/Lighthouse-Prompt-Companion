import React from 'react';
import { getMetricQueries } from '../lib/services/metric-query.service';

const useQueryList = () => {
  const [metricQueries, setMetricQueries] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchQueries = async () => {
      setLoading(true);
      try {
        const data = await getMetricQueries();
        setMetricQueries(data.queries);
      } catch (err) {
        setError(err.message || 'Failed to fetch queries');
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  });
  return { metricQueries, loading, error };
};
export default useQueryList;
