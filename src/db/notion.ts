import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();
export const NOTION_KEY = process.env.NOTION_KEY || "";
export const databaseId = process.env.DATABASE_ID || "";
// const sourcePageId = process.env.SOURCE_PAGE_ID || "";
// const targetPageId = process.env.TARGET_PAGE_ID || "";

export const notion = new Client({ auth: NOTION_KEY });
