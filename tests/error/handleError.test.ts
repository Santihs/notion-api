import { describe, expect, afterEach, it } from "vitest";
import { getPageBlocks } from "../../src/blocks/block.js";

vi.mock("../../src/db/notion.js", () => ({
  notion: {
    blocks: {
      children: {
        list: vi.fn(),
      },
    },
  },
}));

describe("Test for handleError", () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("Should throw an error in getPageBlocks method", async () => {
    await getPageBlocks("invalid-id");

    expect(consoleSpy).toHaveBeenCalledOnce();
  });
});
