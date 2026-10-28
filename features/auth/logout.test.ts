import { AuthService } from "./AuthService";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));

describe("AuthService.logout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends the refresh token so the server can revoke it", async () => {
    (networkRequest as jest.Mock).mockResolvedValue({ data: {} });
    await AuthService.logout("access-1", "refresh-1");
    const [url, method, headers, body] = (networkRequest as jest.Mock).mock.calls[0];
    expect(url).toBe("logout/");
    expect(method).toBe(RequestMethod.POST);
    expect(headers).toEqual(expect.objectContaining({ Authorization: expect.stringContaining("access-1") }));
    expect(JSON.parse(body)).toEqual({ refresh: "refresh-1" });
  });

  it("still raises when the server refuses, so the caller can log it", async () => {
    (networkRequest as jest.Mock).mockRejectedValue(new Error("400"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(AuthService.logout("access-1", "refresh-1")).rejects.toThrow("400");
  });
});
