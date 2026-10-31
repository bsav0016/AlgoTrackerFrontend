import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { AuthResponseDTO } from "@/features/auth/dtos/AuthResponseDTO";
import {
  BoardData, boardFromData, formatEdge, formatWeek, nameProblem, neighbourWeek, serverNameProblem,
} from "./Leaderboard";
import { LeaderboardService } from "./LeaderboardService";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));

const request = networkRequest as jest.Mock;

const DATA: BoardData = {
  kind: "week",
  group: "daily_or_longer",
  period_start: "2026-09-07",
  total: 3,
  entries: [
    { rank: 1, display_name: "Amy Top", score: 1.2, strategy_return: 1.2, asset_return: 1.0, is_me: false },
    { rank: 2, display_name: "Bob Mid", score: 1.1, strategy_return: 1.1, asset_return: 1.0, is_me: true },
  ],
  on_board: true,
  me: { rank: 2, score: 1.1, strategy_return: 1.1, asset_return: 1.0 },
  weeks: ["2026-09-07", "2026-08-31"],
};

beforeEach(() => jest.clearAllMocks());

describe("boardFromData", () => {
  it("turns the API's board into the app's shape", () => {
    const board = boardFromData(DATA);
    expect(board.periodStart).toBe("2026-09-07");
    expect(board.entries[1]).toEqual({ rank: 2, displayName: "Bob Mid", score: 1.1, strategyReturn: 1.1, assetReturn: 1, isMe: true });
    expect(board.me).toEqual({ rank: 2, score: 1.1, strategyReturn: 1.1, assetReturn: 1 });
    expect(board.onBoard).toBe(true);
    expect(board.weeks).toHaveLength(2);
  });

  it("copes with no place, no period and no week list (the all-time board)", () => {
    const board = boardFromData({ ...DATA, kind: "all_time", period_start: null, me: null, on_board: false, weeks: undefined });
    expect(board.me).toBeNull();
    expect(board.periodStart).toBeNull();
    expect(board.weeks).toEqual([]);
  });
});

describe("formatting", () => {
  it("shows a score as a signed percentage over holding", () => {
    expect(formatEdge(1.1)).toBe("+10.0%");
    expect(formatEdge(1)).toBe("+0.0%");
    expect(formatEdge(0.875)).toBe("-12.5%");
  });

  it("names a week by its Monday, read as the UTC date", () => {
    expect(formatWeek("2026-09-07")).toBe("Week of Sep 7");
    expect(formatWeek("not a date")).toBe("not a date");
  });
});

describe("nameProblem", () => {
  it("accepts ordinary names, tidying extra spaces first", () => {
    for (const name of ["Quiet Trader", "abc", "a".repeat(20), "Dip_buyer-9", "  Spaced   Out  "]) {
      expect(nameProblem(name)).toBeNull();
    }
  });

  it("refuses names that are too short or too long", () => {
    for (const name of ["", "  ", "ab", "a".repeat(21)]) {
      expect(nameProblem(name)).toMatch(/3 to 20/);
    }
  });

  it("refuses emails, links, symbols and look-alike letters", () => {
    for (const name of ["me@example.com", "see example.com", "a/b/c", "<b>x</b>", "café owner", "аdmin", "-leading"]) {
      expect(nameProblem(name)).toMatch(/only letters/);
    }
  });
});

describe("serverNameProblem", () => {
  it("reads the reason the server gave", () => {
    expect(serverNameProblem({ display_name: ["That name is taken"] })).toBe("That name is taken");
  });

  it("is null for anything else", () => {
    for (const details of [null, undefined, {}, { display_name: [] }, { display_name: "x" }, { detail: "x" }]) {
      expect(serverNameProblem(details)).toBeNull();
    }
  });
});

describe("neighbourWeek", () => {
  const weeks = ["2026-09-14", "2026-09-07", "2026-08-31"];

  it("finds the older and newer published weeks", () => {
    expect(neighbourWeek(weeks, "2026-09-07", "older")).toBe("2026-08-31");
    expect(neighbourWeek(weeks, "2026-09-07", "newer")).toBe("2026-09-14");
  });

  it("stops at either end and when the week is unknown", () => {
    expect(neighbourWeek(weeks, "2026-08-31", "older")).toBeNull();
    expect(neighbourWeek(weeks, "2026-09-14", "newer")).toBeNull();
    expect(neighbourWeek(weeks, "2020-01-06", "older")).toBeNull();
    expect(neighbourWeek(weeks, null, "older")).toBeNull();
  });
});

describe("LeaderboardService", () => {
  it("asks for a board with the user's token", async () => {
    request.mockResolvedValue({ data: DATA, status: 200 });
    const board = await LeaderboardService.getBoard({ kind: "all_time", group: "intraday", limit: 10 }, "tok");
    expect(board.entries).toHaveLength(2);
    expect(request).toHaveBeenCalledWith("leaderboard/?kind=all_time&group=intraday&limit=10", RequestMethod.GET, { Authorization: "Bearer tok" });
  });

  it("asks for a chosen week only on the weekly board", async () => {
    request.mockResolvedValue({ data: DATA, status: 200 });
    await LeaderboardService.getBoard({ kind: "week", group: "daily_or_longer", week: "2026-08-31" }, "tok");
    expect(request.mock.calls[0][0]).toBe("leaderboard/?kind=week&group=daily_or_longer&week=2026-08-31");
    await LeaderboardService.getBoard({ kind: "all_time", group: "daily_or_longer", week: "2026-08-31" }, "tok");
    expect(request.mock.calls[1][0]).toBe("leaderboard/?kind=all_time&group=daily_or_longer");
  });

  it("joins with the chosen name and returns the stored one", async () => {
    request.mockResolvedValue({ data: { display_name: "Quiet Trader" }, status: 200 });
    expect(await LeaderboardService.join("Quiet  Trader", "tok")).toBe("Quiet Trader");
    expect(request).toHaveBeenCalledWith(
      "leaderboard/profile/", RequestMethod.PUT,
      { "Content-Type": "application/json", Authorization: "Bearer tok" },
      JSON.stringify({ display_name: "Quiet  Trader" }),
    );
  });

  it("leaves the board", async () => {
    request.mockResolvedValue({ data: null, status: 204 });
    await LeaderboardService.leave("tok");
    expect(request).toHaveBeenCalledWith("leaderboard/profile/", RequestMethod.DELETE, { Authorization: "Bearer tok" });
  });

  it("passes errors on so the screen can show the server's reason", async () => {
    request.mockRejectedValue(new Error("refused"));
    await expect(LeaderboardService.join("x", "tok")).rejects.toThrow("refused");
  });
});

describe("the account details", () => {
  const details = {
    username: "amy", first_name: "Amy", last_name: "Smith", email: "amy@example.com", account_created: "2026-01-01T00:00:00Z",
    strategies: [], account_credits: 1, monthly_credits: 2, reset_monthly_credits: "2026-02-01T00:00:00Z",
  };

  it("carry the leaderboard name", () => {
    expect(new AuthResponseDTO({ ...details, leaderboard_name: "Quiet Trader" }).user.leaderboardName).toBe("Quiet Trader");
  });

  it("treat a missing or null name as not on the board (an older server sends none)", () => {
    expect(new AuthResponseDTO(details).user.leaderboardName).toBeNull();
    expect(new AuthResponseDTO({ ...details, leaderboard_name: null }).user.leaderboardName).toBeNull();
  });
});
