import { getDatabase, getDatasource } from "./db/retrieveData.js";
import { extractTodoBlocks, getPageBlocks } from "./blocks/block.js";
import { updatePageStatus } from "./page/page.js";
import { addCommentToPage } from "./page/comment.js";
import { insertBlocksBefore } from "./blocks/create.js";
import { findTodoHeadingId } from "./page/header.js";

const copyUnfinishedTodos = async (
  sourcePageId: string,
  targetPageId: string
) => {
  console.log("Fetching blocks from source page...");
  const sourceBlocks = await getPageBlocks(sourcePageId);

  console.log("Extracting unfinished TODO blocks...");
  const todoBlocks = await extractTodoBlocks(sourceBlocks);

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

  const pages = await getDatasource(database);

  let sourcePageId = "";
  let targetPageId = "";
  if (pages[0] !== undefined && pages[1] !== undefined) {
    targetPageId = pages[0].id;
    sourcePageId = pages[1].id;
  }
  console.log("🚀 ~ main ~ sourcePageId:", sourcePageId);
  console.log("🚀 ~ main ~ targetPageId:", targetPageId);

  await copyUnfinishedTodos(sourcePageId, targetPageId);
};

main();
