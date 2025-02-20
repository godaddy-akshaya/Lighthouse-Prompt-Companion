import React from 'react';
import { getModelList } from '../lib/data/data.service';

// const aiModelDefinition = {
//   model: '',
//   model_name: '',
//   provider: '',
//   input_token_rate: '',
//   output_token_rate: '',
//   max_tokens: '',
// };

const useAiModels = () => {
  const [aiModels, setAiModels] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [defaultValue, setDefaultValue] = React.useState(null);

  React.useEffect(() => {
    const fetchAiModels = async () => {
      setLoading(true);
      try {
        const data = await getModelList();
        setAiModels(data);
        if (data && data.length > 0) {
          setDefaultValue(data[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };
    fetchAiModels();
  }, []);

  return { aiModels, loading, error, defaultValue };

}

export default useAiModels;
