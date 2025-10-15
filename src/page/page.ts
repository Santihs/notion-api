import { notion } from "../db/notion.js";
import { handleNotionError } from "../error/handleError.js";

export const updatePageStatus = async (pageId: string, status: string) => {
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
