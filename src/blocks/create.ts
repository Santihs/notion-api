import { notion } from "../db/notion.js";
import { handleNotionError } from "../error/handleError.js";
import type { TodoAndChildren } from "../types.js";
import { getPageBlocks } from "./block.js";

export const insertBlocksBefore = async (
  pageId: string,
  beforeBlockId: string | null,
  blocks: TodoAndChildren[]
) => {
  if (blocks.length === 0) return;

  // If no "To do" heading found, append to the end of the page
  if (!beforeBlockId) {
    await insertBlocks(blocks, pageId);
    return;
  }

  // Insert blocks before the "To do" heading
  const allBlocks = await getPageBlocks(pageId);
  const targetIndex = allBlocks.findIndex((b) => b.id === beforeBlockId);

  if (targetIndex === 0) {
    // If "To do" is the first block, we need to append to page and reorder
    await insertBlocks(blocks, pageId);
  } else if (targetIndex > 0) {
    const previousBlock = allBlocks[targetIndex - 1];
    if (previousBlock) {
      const previousBlockId = previousBlock.id;
      await insertBlocks(blocks.reverse(), previousBlockId);
    }
  }
};

const insertBlocks = async (blocks: TodoAndChildren[], pageId: string) => {
  try {
    for (const { children, todos } of blocks) {
      const result = await notion.blocks.children.append({
        block_id: pageId,
        children: [cloneBlockForInsertion(todos)],
      });
      await insertChildrenBlocks(result.results[0]?.id, children);
    }
  } catch (error) {
    handleNotionError(error);
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

const insertChildrenBlocks = async (
  parentBlockId: string | undefined,
  children: any[]
) => {
  if (!parentBlockId) return;
  if (children.length === 0) return;

  for (const child of children) {
    await notion.blocks.children.append({
      block_id: parentBlockId,
      children: [cloneBlockForInsertion(child)],
    });
  }
};
