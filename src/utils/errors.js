class ResourceNotFoundException extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
    this.error = 'Not Found';
  }
}

class BadRequestException extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.error = 'Bad Request';
  }
}

class AccessDeniedException extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.status = 403;
    this.error = 'Forbidden';
  }
}

module.exports = { ResourceNotFoundException, BadRequestException, AccessDeniedException };
