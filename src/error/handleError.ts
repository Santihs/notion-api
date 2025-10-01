import { APIErrorCode } from "@notionhq/client";

export const handleNotionError = (error: any) => {
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
