export function success(res, data, message = 'Operation completed successfully', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

export function noContent(res) {
  return res.status(204).json({ success: true, data: null, message: 'Operation completed successfully' });
}