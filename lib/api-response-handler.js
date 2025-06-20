export async function handleApiResponse(response) {
  try {
    const data = await response.json();
    if (!response.ok) {
      return { error: data?.errorMessage || data?.message || 'Unknown error', status: response.status };
    }
    return { data, status: response.status };
  } catch (error) {
    return { error: 'Failed to parse response', details: error.message, status: response.status || 500 };
  }
}