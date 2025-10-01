import { notion } from "../db/notion.js";
import { handleNotionError } from "../error/handleError.js";

export const addCommentToPage = async (pageId: string) => {
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
