export async function parseAwsApiResponse(response) {
  const contentType = response.headers.get('content-type');
  let data;

  try {
    if (contentType && contentType.includes('application/json')) {
      const reply = await response.json();
      data = reply;
      // at some point this needs to be checking the body instead of in data service it runs each fetch
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text); // Attempt to parse as JSON
      } catch {
        data = text; // Fallback to raw text
      }
    }
  } catch {
    return { error: 'Failed to parse response body', status: response.status };
  }

  return { data, status: response.status }; 
}