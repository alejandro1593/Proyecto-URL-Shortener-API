import { ApiResponse, paginate } from '../../src/utils/response';

describe('ApiResponse', () => {
  let res: any;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    res = { status: statusSpy };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('success returns 200 by default', () => {
    ApiResponse.success(res, { id: 1 });
    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'success',
      message: 'Success',
      data: { id: 1 },
    });
  });

  test('success accepts custom message and status', () => {
    ApiResponse.success(res, { id: 1 }, 'Custom message', 201);
    expect(statusSpy).toHaveBeenCalledWith(201);
    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'success',
      message: 'Custom message',
      data: { id: 1 },
    });
  });

  test('created returns 201', () => {
    ApiResponse.created(res, { id: 1 });
    expect(statusSpy).toHaveBeenCalledWith(201);
  });

  test('noContent returns 204 with send', () => {
    const sendSpy = jest.fn();
    const res204 = { status: jest.fn().mockReturnValue({ send: sendSpy }) };
    ApiResponse.noContent(res204);
    expect(res204.status).toHaveBeenCalledWith(204);
    expect(sendSpy).toHaveBeenCalled();
  });

  test('error returns error response', () => {
    ApiResponse.error(res, 'Something went wrong', 400);
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'error',
      message: 'Something went wrong',
    });
  });

  test('error includes errors when provided', () => {
    ApiResponse.error(res, 'Validation failed', 422, { field: 'email' });
    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      errors: { field: 'email' },
    });
  });
});

describe('paginate', () => {
  const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  test('returns first page with correct pagination', () => {
    const result = paginate(data, 1, 10);
    expect(result.data.length).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  test('returns last page', () => {
    const result = paginate(data, 3, 10);
    expect(result.data.length).toBe(5);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(true);
  });

  test('handles empty data', () => {
    const result = paginate([], 1, 10);
    expect(result.data.length).toBe(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });
});
