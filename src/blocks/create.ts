import { notion } from "../db/notion.js";
import { handleNotionError } from "../error/handleError.js";
import type { TodoAndChildren } from "../types.js";

export const insertBlocksBefore = async (
  pageId: string,
  beforeBlockId: string | null,
  blocks: TodoAndChildren[]
) => {
  if (blocks.length === 0) return;

  if (!beforeBlockId) {
    await insertBlocks(blocks, pageId);
    return;
  }

  await insertBlocksAfter(blocks, beforeBlockId, pageId);
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

const insertBlocksAfter = async (
  blocks: TodoAndChildren[],
  afterBlockId: string,
  pageId: string
) => {
  try {
    let previousBlockId = afterBlockId;

    for (const { children, todos } of blocks) {
      const result = await notion.blocks.children.append({
        block_id: pageId,
        children: [cloneBlockForInsertion(todos)],
        after: previousBlockId,
      });

      const newBlockId = result.results[0]?.id;
      if (newBlockId) {
        await insertChildrenBlocks(newBlockId, children);
        previousBlockId = newBlockId;
      }
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
  blocks: TodoAndChildren[]
) => {
  if (!parentBlockId) return;
  if (blocks.length === 0) return;

  for (const { todos, children } of blocks) {
    // Skip unsupported block types
    if (isUnsupportedBlockType((todos as any).type)) {
      console.log(`Skipping unsupported block type: ${(todos as any).type}`);
      continue;
    }

    const result = await notion.blocks.children.append({
      block_id: parentBlockId,
      children: [cloneBlockForInsertion(todos)],
    });

    const newBlockId = result.results[0]?.id;
    if (newBlockId) {
      await insertChildrenBlocks(newBlockId, children);
    }
  }
};

const isUnsupportedBlockType = (type: string): boolean => {
  const unsupportedTypes = ["image", "file", "video", "pdf", "audio"];
  return unsupportedTypes.includes(type);
};
