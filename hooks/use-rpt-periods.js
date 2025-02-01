import { useState, useEffect } from 'react';
import { getPeriods } from '../lib/services/metric-hub.service';

const useRptPeriods = () => {
  const [periods, setPeriods] = useState(null);
  const [metricDate, setMetricDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRptPeriods = async () => {
      setLoading(true);
      try {
        const data = await getPeriods();
        setPeriods(data.periods);
        const currentPeriod = data?.periods?.filter(period => Number(period.IsActive) === 1);
        if (currentPeriod) setMetricDate(currentPeriod[0].DateIntervalString);
      } catch (err) {
        setError(err.message || 'Failed to fetch reporting periods');
      } finally {
        setLoading(false);
      }
    };
    fetchRptPeriods();
  }, []);

  return { periods, metricDate, loading, error };
};

export default useRptPeriods;
