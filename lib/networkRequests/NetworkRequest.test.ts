import { networkRequest } from "./NetworkRequest";
import { NetworkError } from "./NetworkError";
import { RequestMethod } from "./RequestMethod";
import { DB_URL, HEADERS, URL_EXT } from "./NetworkConstants";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

const mockFetch = jest.fn();

const respond = (status: number, body?: unknown, jsonFails = false) =>
  mockFetch.mockResolvedValueOnce({
    status,
    json: jsonFails ? () => Promise.reject(new SyntaxError("Unexpected token <")) : () => Promise.resolve(body),
  });

beforeEach(() => {
  mockFetch.mockReset();
  (global as any).fetch = mockFetch;
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("API URL", () => {
  it("is the configured API_URL plus the api/ prefix", () => {
    expect(DB_URL).toBe("http://api.test/api/");
  });

  it("builds bearer auth headers", () => {
    expect(HEADERS("abc").AUTH).toEqual({ Authorization: "Bearer abc" });
  });
});

describe("networkRequest", () => {
  it("sends the request to the configured API with method, headers and body", async () => {
    respond(200, { ok: true });
    const body = JSON.stringify({ username: "a" });

    await networkRequest(URL_EXT.LOGIN, RequestMethod.POST, HEADERS().JSON, body);

    expect(mockFetch).toHaveBeenCalledWith("http://api.test/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  });

  it.each([200, 201])("returns the parsed body and status for %i", async (status) => {
    respond(status, { id: 1 });
    await expect(networkRequest("strategy/", RequestMethod.GET)).resolves.toEqual({
      data: { id: 1 },
      status,
    });
  });

  it("raises a NetworkError carrying the server's `error` message", async () => {
    respond(417, { error: "Invalid or expired OTP" });
    const error = await networkRequest("x/", RequestMethod.POST).catch((e) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe("Invalid or expired OTP");
    expect(error.status).toBe(417);
    expect(error.details).toEqual({ error: "Invalid or expired OTP" });
  });

  it("uses a string `detail` as the message", async () => {
    respond(402, { detail: "Requires $3" });
    await expect(networkRequest("backtest/", RequestMethod.POST)).rejects.toMatchObject({
      message: "Requires $3",
      status: 402,
    });
  });

  it("stringifies structured `detail` (field validation errors)", async () => {
    const detail = { email: ["Email already taken"] };
    respond(409, { detail });
    await expect(networkRequest("register/", RequestMethod.POST)).rejects.toMatchObject({
      message: JSON.stringify(detail),
      status: 409,
    });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    respond(502, undefined, true);
    await expect(networkRequest("x/", RequestMethod.GET)).rejects.toMatchObject({
      message: "Unknown error occurred",
      status: 502,
    });
  });

  it("falls back to a generic message when the body has no error or detail", async () => {
    respond(400, { password: ["too short"] });
    await expect(networkRequest("x/", RequestMethod.POST)).rejects.toMatchObject({
      message: "Unknown error occurred",
      status: 400,
    });
  });

  it("rethrows connection failures unchanged", async () => {
    const failure = new TypeError("Network request failed");
    mockFetch.mockRejectedValueOnce(failure);
    await expect(networkRequest("x/", RequestMethod.GET)).rejects.toBe(failure);
  });

  it("treats other 2xx codes as errors, as the app only expects 200/201", async () => {
    respond(204, {});
    await expect(networkRequest("x/", RequestMethod.DELETE)).rejects.toBeInstanceOf(NetworkError);
  });
});
