import dotenv from "dotenv";
import { APIErrorCode, Client } from "@notionhq/client";
import type { NotionDatabase, NotionDatasource } from "./types.js";

dotenv.config();
const NOTION_KEY = process.env.NOTION_KEY || "";
const databaseId = process.env.DATABASE_ID || "";
const pageId = process.env.PAGE_ID || "";

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
  console.log("🚀 ~ getDatabase ~ datasource:", datasource);
};

const main = async () => {
  const database = await getDatabase();
  if (!database) return;

  await getDatasource(database);
};

main();
