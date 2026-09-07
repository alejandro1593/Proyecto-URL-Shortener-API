export class ApiResponse {
  static success<T>(res: any, data: T, message = 'Success', status = 200) {
    return res.status(status).json({
      status: 'success',
      message,
      data,
    });
  }

  static created<T>(res: any, data: T, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: any) {
    return res.status(204).send();
  }

  static error(
    res: any,
    message = 'Error',
    status = 500,
    errors?: any
  ) {
    return res.status(status).json({
      status: 'error',
      message,
      ...(errors && { errors }),
    });
  }
}

export const paginate = (data: any[], page = 1, limit = 10) => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: endIndex < total,
      hasPrev: startIndex > 0,
    },
  };
};
