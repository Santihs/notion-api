POC: Notion Automation Script in TypeScript
We are building a **TypeScript automation script** using the Notion API.
The script should **copy unfinished TODO blocks** from one page in a database to the next one, with the following rules and requirements.
Requirements

---

1. **Source and Target Pages**
   - Input: database ID, source page ID, and target page ID are already available.
   - The script should fetch blocks from the source page.
2. **Block Selection Rules**
   - Copy only blocks under the section titled **"To do"**.
   - Stop copying once a block titled **"Notes"** is reached (exclude "Notes" and anything after).
   - Copy all block types related to unfinished TODOs:
     - TODO checkboxes not marked as completed.
     - Preserve and copy all **associated blocks** (text, bullet lists, code, images, etc.) that belong to the TODO section.
   - Skip completed TODOs or TODOs marked with strikethrough.
3. **Copying Rules**
   - Maintain **block order**.
   - Insert copied blocks into the **target page** just before its **"To do"** heading.
4. **Page State Update**
   - After copying, update the source page’s state property (`Status`) to `"Done"`.
5. **Commenting**

   - Add a comment to the source page with this format:

     ```
     Copied by Claude automation at [HH:mm UTC-04]

     ```
