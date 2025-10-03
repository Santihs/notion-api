import { describe, it, afterEach, expect } from "vitest";

vi.mock("../../src/db/notion.js", () => ({
  notion: {
    blocks: {
      children: {
        list: vi.fn(),
      },
    },
  },
}));

import { findTodoHeadingId } from "../../src/page/header.js";
import { notion } from "../../src/db/notion.js";
import { children, data } from "../data.js";

describe("Test for header validation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("Should filter correctly the heading block", async () => {
    vi.mocked(notion.blocks.children.list).mockResolvedValueOnce({
      results: data as any,
      has_more: false,
      next_cursor: null,
      block: {},
      object: "list",
      type: "block",
    });

    const value = await findTodoHeadingId("1");

    expect(value).not.toBeNull();
    expect(value).toBe("1");
  });

  it("Should return null when there is no heading block", async () => {
    vi.mocked(notion.blocks.children.list).mockResolvedValueOnce({
      results: children as any,
      has_more: false,
      next_cursor: null,
      block: {},
      object: "list",
      type: "block",
    });

    const value = await findTodoHeadingId("1");

    expect(value).toBeNull();
  });
});
