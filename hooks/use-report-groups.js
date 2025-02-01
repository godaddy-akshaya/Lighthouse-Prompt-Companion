import { useState, useEffect } from 'react';
import { getReportGroups } from '../lib/services/metric-hub.service';

const useReportGroups = () => {
  const [reportGroups, setReportGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportGroups = async () => {
      setLoading(true);
      try {
        const data = await getReportGroups();
        setReportGroups(data.reportGroups);
      } catch (err) {
        setError(err.message || 'Failed to fetch report groups');
      } finally {
        setLoading(false);
      }
    };
    fetchReportGroups();
  }, []);

  return { reportGroups, loading, error };
};

export default useReportGroups;
