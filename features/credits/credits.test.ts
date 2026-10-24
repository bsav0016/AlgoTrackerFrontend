import { CreditEntry, CreditHistoryPage, appendPage, bucketName, formatCreditAmount } from "./CreditEntry";
import { CreditService } from "./CreditService";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));

const row = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  created_at: "2026-10-23T12:30:00Z",
  bucket: "account" as const,
  amount: 1000,
  balance_after: 1500,
  kind: "purchase",
  label: "Credit purchase",
  ...overrides,
});

describe("CreditHistoryPage.fromData", () => {
  it("maps the server's snake_case rows and keeps the paging cursor", () => {
    const page = CreditHistoryPage.fromData({ results: [row(9), row(8, { bucket: "monthly", amount: -3 })], next_before: 8 });
    expect(page.nextBefore).toBe(8);
    expect(page.entries).toHaveLength(2);
    const first = page.entries[0];
    expect(first).toBeInstanceOf(CreditEntry);
    expect(first.createdAt.toISOString()).toBe("2026-10-23T12:30:00.000Z");
    expect([first.id, first.bucket, first.amount, first.balanceAfter, first.kind, first.label]).toEqual([
      9, "account", 1000, 1500, "purchase", "Credit purchase",
    ]);
    expect(page.entries[1].bucket).toBe("monthly");
  });

  it("has no cursor on the last page", () => {
    expect(CreditHistoryPage.fromData({ results: [], next_before: null }).nextBefore).toBeNull();
  });
});

describe("formatCreditAmount", () => {
  it("always shows a sign and groups thousands", () => {
    expect(formatCreditAmount(1000)).toBe("+1,000");
    expect(formatCreditAmount(-3)).toBe("-3");
    expect(formatCreditAmount(0)).toBe("0");
    expect(formatCreditAmount(-12500)).toBe("-12,500");
  });
});

describe("bucketName", () => {
  it("uses the same words as the profile screen", () => {
    expect(bucketName("account")).toBe("Account credits");
    expect(bucketName("monthly")).toBe("Monthly credits");
  });
});

describe("appendPage", () => {
  const page = (ids: number[]) =>
    CreditHistoryPage.fromData({ results: ids.map((id) => row(id)), next_before: null });

  it("adds the next page after the rows already shown", () => {
    const shown = page([5, 4]).entries;
    expect(appendPage(shown, page([3, 2])).map((e) => e.id)).toEqual([5, 4, 3, 2]);
  });

  it("skips rows that are already shown, such as after a repeated tap", () => {
    const shown = page([5, 4]).entries;
    expect(appendPage(shown, page([4, 3])).map((e) => e.id)).toEqual([5, 4, 3]);
  });
});

describe("CreditService.fetchHistory", () => {
  const mocked = networkRequest as jest.Mock;
  beforeEach(() => mocked.mockReset());

  it("asks for the first page with the bearer token and a page size", async () => {
    mocked.mockResolvedValue({ status: 200, data: { results: [row(2), row(1)], next_before: null } });
    const page = await CreditService.fetchHistory("tok");
    expect(mocked).toHaveBeenCalledWith(
      "credits/history/?limit=50",
      RequestMethod.GET,
      { Authorization: "Bearer tok" }
    );
    expect(page.entries.map((e) => e.id)).toEqual([2, 1]);
  });

  it("sends the cursor for later pages", async () => {
    mocked.mockResolvedValue({ status: 200, data: { results: [row(1)], next_before: null } });
    await CreditService.fetchHistory("tok", 8, 20);
    expect(mocked.mock.calls[0][0]).toBe("credits/history/?limit=20&before=8");
  });

  it("lets network errors reach the caller", async () => {
    mocked.mockRejectedValue(new Error("offline"));
    await expect(CreditService.fetchHistory("tok")).rejects.toThrow("offline");
  });
});
