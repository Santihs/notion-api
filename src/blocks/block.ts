import { notion } from "../db/notion.js";
import { handleNotionError } from "../error/handleError.js";
import type { Block, NotionDatasource, TodoAndChildren } from "../types.js";

export const getPageBlocks = async (pageId: string) => {
  try {
    const blocks = (await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })) as unknown as NotionDatasource;
    return blocks.results;
  } catch (error) {
    handleNotionError(error);
    return [];
  }
};

export const isHeadingBlock = (block: Block) => {
  return (
    block.type === "heading_1" ||
    block.type === "heading_2" ||
    block.type === "heading_3"
  );
};

export const isTodoBlock = (block: Block) => {
  return block.type === "to_do";
};

export const extractTodoBlocks = async (
  blocks: Block[]
): Promise<TodoAndChildren[]> => {
  const todos: TodoAndChildren[] = [];
  let inTodoSection = false;

  for (const block of blocks) {
    // Check if we've reached the "To do" heading
    if (isHeadingBlock(block)) {
      let headingText = "";
      headingText = block[block.type].rich_text?.[0]?.plain_text || "";

      if (headingText.toLowerCase().includes("to do")) {
        inTodoSection = true;
        continue; // Don't include the heading itself
      }

      if (headingText.toLowerCase().includes("notes")) {
        break; // Stop when we reach "Notes"
      }
    }

    // Collect blocks in the TODO section
    if (inTodoSection) {
      // Skip completed TODOs
      if (isTodoBlock(block) && block.to_do?.checked) {
        continue;
      }

      // Skip strikethrough TODOs
      if (isTodoBlock(block)) {
        const hasStrikethrough = block.to_do?.rich_text?.some(
          (text: any) => text.annotations?.strikethrough
        );
        if (hasStrikethrough) {
          continue;
        }
      }

      // Fetch all children recursively for this block
      if (block.has_children) {
        const children = await getBlockChildren(block.id);
        todos.push({ todos: block, children });
        continue;
      }

      todos.push({ todos: block, children: [] });
    }
  }

  return todos;
};

// Recursively get all children blocks
const getBlockChildren = async (
  blockId: string
): Promise<TodoAndChildren[]> => {
  try {
    const response = (await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    })) as unknown as NotionDatasource;

    const children: TodoAndChildren[] = [];
    for (const block of response.results) {
      // If block has children, recursively fetch them
      if (block.has_children) {
        const nestedChildren = await getBlockChildren(block.id);
        children.push({ todos: block, children: nestedChildren });
      }

      children.push({ todos: block, children: [] });
    }

    return children;
  } catch (error) {
    handleNotionError(error);
    return [];
  }
};
