import React from "react";
import { act, create, ReactTestInstance } from "react-test-renderer";
import { Text } from "react-native";
import BacktestCoverage from "./backtestCoverage";
import { DataWindowFormat } from "../classes/Backtest";

const window = (overrides: Partial<DataWindowFormat> = {}): DataWindowFormat => ({
  requested_start: "2025-11-17T05:00:00Z",
  requested_end: "2026-11-16T05:00:00Z",
  covered_start: "2025-11-18T00:00:00+00:00",
  covered_end: "2026-11-13T00:00:00+00:00",
  candles: 249,
  requests: 1,
  truncated: false,
  reason: null,
  ...overrides,
});

const textOf = (node: ReactTestInstance | string): string =>
  typeof node === "string" ? node : node.children.map(textOf).join("");

const shown = (data: DataWindowFormat) => {
  let tree!: ReturnType<typeof create>;
  act(() => { tree = create(<BacktestCoverage window={data} />); });
  return tree.root.findAllByType(Text).map(textOf);
};

describe("the period covered", () => {
  // A daily candle is stamped midnight UTC. Read in a time zone west of Greenwich it would be the evening before,
  // so the dates are formatted in UTC (run this file with TZ=America/New_York to see the difference).
  it("shows the candle dates as they are in UTC, whatever the phone's time zone", () => {
    expect(shown(window())).toContain("Nov 18, 2025 to Nov 13, 2026 (249 candles)");
  });

  it("says when the period is shorter than asked for", () => {
    const lines = shown(window({ truncated: true, reason: "history_ends" })).join(" ");
    expect(lines).toMatch(/Shorter than requested/);
  });
});
