import { getPageBlocks, isHeadingBlock } from "../blocks/block.js";

export const findTodoHeadingId = async (pageId: string) => {
  const blocks = await getPageBlocks(pageId);

  for (const block of blocks) {
    const blockType = (block as any).type;
    if (isHeadingBlock(block)) {
      const headingText = block[blockType]?.rich_text?.[0]?.plain_text || "";
      if (headingText.toLowerCase().includes("to do")) {
        return block.id;
      }
    }
  }

  return null;
};
