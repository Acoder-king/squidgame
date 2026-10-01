export const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'online', service: 'INTELLETTO-26 API Gateway' }),
  };
};
