import dotenv from "dotenv";
import { APIErrorCode, Client } from "@notionhq/client";
import type { NotionDatabase, NotionDatasource } from "./types.js";

dotenv.config();
const NOTION_KEY = process.env.NOTION_KEY || "";
const databaseId = process.env.DATABASE_ID || "";
const sourcePageId = process.env.SOURCE_PAGE_ID || "";
const targetPageId = process.env.TARGET_PAGE_ID || "";

const notion = new Client({ auth: NOTION_KEY });

const handleNotionError = (error: any) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === APIErrorCode.ObjectNotFound
  ) {
    console.error("The specified database was not found, code: ", error.code);
  } else {
    console.error(error);
  }
};

const getDatabase = async () => {
  try {
    const database = (await notion.databases.retrieve({
      database_id: databaseId,
    })) as NotionDatabase;
    if (database.object !== "database") return;

    return database;
  } catch (error) {
    handleNotionError(error);
  }
};

const getDatasource = async (database: NotionDatabase) => {
  const dataSourceId = database.data_sources[0]?.id;
  if (!dataSourceId) return;

  const datasource = (await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 2,
  })) as unknown as NotionDatasource;
  return datasource;
};

// Get all blocks from a page
const getPageBlocks = async (pageId: string) => {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });
    return blocks.results;
  } catch (error) {
    handleNotionError(error);
    return [];
  }
};

// Find blocks between "To do" and "Notes" sections
const extractTodoBlocks = (blocks: any[]) => {
  const todoBlocks: any[] = [];
  let inTodoSection = false;

  for (const block of blocks) {
    // Check if we've reached the "To do" heading
    if (
      block.type === "heading_1" ||
      block.type === "heading_2" ||
      block.type === "heading_3"
    ) {
      const headingText = block[block.type]?.rich_text?.[0]?.plain_text || "";

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
      if (block.type === "to_do" && block.to_do?.checked) {
        continue;
      }

      // Skip strikethrough TODOs
      if (block.type === "to_do") {
        const hasStrikethrough = block.to_do?.rich_text?.some(
          (text: any) => text.annotations?.strikethrough
        );
        if (hasStrikethrough) {
          continue;
        }
      }

      todoBlocks.push(block);
    }
  }

  return todoBlocks;
};

// Clone a block for insertion (remove id and other metadata)
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

// Find the "To do" heading in target page
const findTodoHeadingId = async (pageId: string) => {
  const blocks = await getPageBlocks(pageId);

  for (const block of blocks) {
    const blockType = (block as any).type;
    if (
      blockType === "heading_1" ||
      blockType === "heading_2" ||
      blockType === "heading_3"
    ) {
      const headingText =
        (block as any)[blockType]?.rich_text?.[0]?.plain_text || "";
      if (headingText.toLowerCase().includes("to do")) {
        return block.id;
      }
    }
  }

  return null;
};

// Insert blocks before a specific block
const insertBlocksBefore = async (
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

// Update page status property
const updatePageStatus = async (pageId: string, status: string) => {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          status: {
            name: status,
          },
        },
      },
    });
  } catch (error) {
    handleNotionError(error);
  }
};

// Add comment to page
const addCommentToPage = async (pageId: string) => {
  try {
    const now = new Date();
    const utcMinus4 = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const timeString = utcMinus4.toISOString().slice(11, 16);

    await notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [
        {
          text: {
            content: `Copied by Claude automation at [${timeString} UTC-04]`,
          },
        },
      ],
    });
  } catch (error) {
    handleNotionError(error);
  }
};

// Main automation function
const copyUnfinishedTodos = async (
  sourcePageId: string,
  targetPageId: string
) => {
  console.log("Fetching blocks from source page...");
  const sourceBlocks = await getPageBlocks(sourcePageId);

  console.log("Extracting unfinished TODO blocks...");
  const todoBlocks = extractTodoBlocks(sourceBlocks);

  if (todoBlocks.length === 0) {
    console.log("No unfinished TODOs found to copy.");
    return;
  }

  console.log(`Found ${todoBlocks.length} blocks to copy.`);

  console.log("Finding 'To do' heading in target page...");
  const todoHeadingId = await findTodoHeadingId(targetPageId);

  console.log("Inserting blocks into target page...");
  await insertBlocksBefore(targetPageId, todoHeadingId, todoBlocks);

  console.log("Updating source page status to 'Done'...");
  await updatePageStatus(sourcePageId, "Done");

  console.log("Adding comment to source page...");
  await addCommentToPage(sourcePageId);

  console.log("Automation completed successfully!");
};

const main = async () => {
  const database = await getDatabase();
  if (!database) return;

  await getDatasource(database);

  // Run the automation
  await copyUnfinishedTodos(sourcePageId, targetPageId);
};

main();
