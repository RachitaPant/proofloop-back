// Mirrors com.proofloop.exception.GlobalExceptionHandler response shapes.
function errorHandler(err, _req, res, _next) {
  if (err.status && err.error) {
    return res.status(err.status).json({
      timestamp: new Date().toISOString(),
      status: err.status,
      error: err.error,
      message: err.message,
    });
  }

  console.error(err);
  return res.status(500).json({
    timestamp: new Date().toISOString(),
    status: 500,
    error: 'Internal Server Error',
    message: err.message,
  });
}

module.exports = errorHandler;
