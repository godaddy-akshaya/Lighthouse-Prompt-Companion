export default async function handler(req, res) {
  // This is a simple health check endpoint
  // It returns a 200 OK status with a message
  res.status(200).json({ status: 'Ok' });
}