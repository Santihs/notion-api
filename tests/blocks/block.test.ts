import { describe, it, expect, vi, beforeEach } from "vitest";
import { children, data, dataWithChildren } from "../data.js";

vi.mock("../../src/db/notion.js", () => ({
  notion: {
    blocks: {
      children: {
        list: vi.fn().mockResolvedValue({ results: children }),
      },
    },
  },
}));

import { extractTodoBlocks } from "../../src/blocks/block.js";

describe("Test for 'extractTodoBlocks' method", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty when it is passed empty", async () => {
    const result = extractTodoBlocks([]);

    expect(await result).toEqual([]);
  });

  it("Should return the todo blocks only with no children", async () => {
    const result = await extractTodoBlocks(data);

    expect(result.length).toBe(4);
  });

  it("Should return the todo blocks with children", async () => {
    const result = await extractTodoBlocks(dataWithChildren);

    expect(result.length).toBe(4);
    result.forEach((block) => {
      expect(block.children.length).not.toBe(0);
    });
  });
});
