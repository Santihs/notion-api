import { handleNotionError } from "../error/handleError.js";
import type { NotionDatabase, NotionDatasource } from "../types.js";
import { databaseId, notion } from "./notion.js";

export const getDatabase = async () => {
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

export const getDatasource = async (database: NotionDatabase) => {
  const dataSourceId = database.data_sources[0]?.id;
  if (!dataSourceId) return [];

  const datasource = (await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 2,
    sorts: [{ direction: "descending", timestamp: "created_time" }],
  })) as unknown as NotionDatasource;
  return datasource.results;
};
