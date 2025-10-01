import { notion } from "../db/notion.js";
import { getPageBlocks } from "./block.js";

export const insertBlocksBefore = async (
  pageId: string,
  beforeBlockId: string | null,
  blocks: any[]
) => {
  if (blocks.length === 0) return;

  // If no "To do" heading found, append to the end of the page
  if (!beforeBlockId) {
    for (const block of blocks) {
      await notion.blocks.children.append({
        block_id: pageId,
        children: [cloneBlockForInsertion(block)],
      });
    }
    return;
  }

  // Insert blocks before the "To do" heading
  const allBlocks = await getPageBlocks(pageId);
  const targetIndex = allBlocks.findIndex((b) => b.id === beforeBlockId);

  if (targetIndex === 0) {
    // If "To do" is the first block, we need to append to page and reorder
    for (const block of blocks) {
      await notion.blocks.children.append({
        block_id: pageId,
        children: [cloneBlockForInsertion(block)],
      });
    }
  } else if (targetIndex > 0) {
    // Insert after the block before "To do" heading
    const previousBlock = allBlocks[targetIndex - 1];
    if (previousBlock) {
      const previousBlockId = previousBlock.id;
      for (const block of blocks.reverse()) {
        await notion.blocks.children.append({
          block_id: previousBlockId,
          children: [cloneBlockForInsertion(block)],
        });
      }
    }
  }
};

const cloneBlockForInsertion = (block: any): any => {
  const cloned: any = {
    type: block.type,
  };

  // Copy the block content based on type
  if (block[block.type]) {
    cloned[block.type] = JSON.parse(JSON.stringify(block[block.type]));
  }

  return cloned;
};
