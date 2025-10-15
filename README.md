# Notion API - TODO Task Automation

A TypeScript-based automation tool that manages TODO tasks across Notion pages. This tool automatically copies unfinished TODO items from a source page to a target page, updates page statuses, and adds tracking comments.

## Overview

This automation tool is designed to help manage daily TODO workflows in Notion. It:

1. **Extracts unfinished TODOs** from a source page
2. **Copies them** to a target page's "To do" section
3. **Updates statuses** automatically:
   - Target page → "In Progress"
   - Source page → "Done"
4. **Adds a timestamp comment** to the source page for audit tracking

## Use Case

Perfect for daily task management workflows where you:
- Have a daily page template with TODO sections
- Want to carry over incomplete tasks to the next day
- Need automatic status updates when tasks are migrated
- Require audit trails of when tasks were moved

## Features

- **Smart TODO Detection**: Only copies uncompleted and non-strikethrough tasks
- **Nested Block Support**: Recursively handles TODO items with nested children
- **Section-Based Extraction**: Extracts tasks between "To do" and "Notes" headings
- **Status Management**: Works with Notion's native status property (grouped: To-do, In Progress, Complete)
- **Error Handling**: Comprehensive error handling for Notion API operations
- **Type Safety**: Fully typed with TypeScript

## Project Structure

```
notion-api/
├── src/
│   ├── blocks/
│   │   ├── block.ts         # Block retrieval and TODO extraction logic
│   │   └── create.ts        # Block insertion operations
│   ├── db/
│   │   ├── notion.ts        # Notion client initialization
│   │   └── retrieveData.ts  # Database and datasource queries
│   ├── error/
│   │   └── handleError.ts   # Centralized error handling
│   ├── page/
│   │   ├── comment.ts       # Comment creation for audit trails
│   │   ├── header.ts        # Header/heading detection utilities
│   │   └── page.ts          # Page status update operations
│   ├── types.ts             # TypeScript type definitions
│   └── index.ts             # Main orchestration logic
├── .env                     # Environment variables (not in repo)
├── .env.example            # Environment variables template
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Notion integration token with appropriate permissions
- A Notion database configured with a Status property

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notion-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
NOTION_KEY=your_notion_integration_token_here
DATABASE_ID=your_database_id_here
```

## Configuration

### Notion Setup

1. **Create a Notion Integration**:
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the "Internal Integration Token"

2. **Configure Database**:
   - Create or use an existing Notion database
   - Add a **Status** property with type `status` (grouped):
     - **To-do group**: "Not Started", "Blocked"
     - **In Progress group**: "In Progress"
     - **Complete group**: "Done", "Archived"
   - Share the database with your integration

3. **Page Template**:
   Your pages should follow this structure:
   ```
   # To do
   - [ ] Task 1
   - [ ] Task 2
     - Sub-task 2.1

   # Notes
   - Note content here
   ```

### Environment Variables

- `NOTION_KEY`: Your Notion integration token
- `DATABASE_ID`: The ID of your Notion database

## Usage

### Development Mode

Run the script in development mode with hot-reload:
```bash
npm run dev
```

### Production Build

Build and run the optimized production bundle:
```bash
npm run build
npm start
```

### Testing

Run the test suite:
```bash
npm test            # Run tests
npm run test:ui     # Run tests with UI
npm run test:coverage  # Run tests with coverage report
```

## How It Works

### Main Workflow

1. **Fetch Database**: Retrieves the configured Notion database
2. **Query Pages**: Gets the 2 most recent pages (sorted by creation time)
   - `pages[0]` → Target page (newer)
   - `pages[1]` → Source page (older)
3. **Extract TODOs**: Finds all unfinished TODO items from source page
4. **Find Target Section**: Locates the "To do" heading in target page
5. **Insert Blocks**: Copies TODO items to target page
6. **Update Statuses**:
   - Target page status → "In Progress"
   - Source page status → "Done"
7. **Add Comment**: Adds timestamp comment to source page

### TODO Extraction Logic

The tool extracts TODOs using these rules:

- ✅ **Includes**:
  - Unchecked TODO items (`- [ ]`)
  - TODOs between "To do" and "Notes" headings
  - Nested children of TODO blocks

- ❌ **Excludes**:
  - Checked/completed TODOs (`- [x]`)
  - TODOs with strikethrough text
  - Content after "Notes" heading

### Status Property

The automation expects a Notion **status** property (not select or multi_select) with these configurations:

- **Property Name**: `Status`
- **Property Type**: `status`
- **Groups**:
  - To-do: Contains "Not Started", "Blocked", etc.
  - In Progress: Contains "In Progress"
  - Complete: Contains "Done", "Archived"

## API Reference

### Core Functions

#### `copyUnfinishedTodos(sourcePageId: string, targetPageId: string)`
Main orchestration function that coordinates the entire workflow.

#### `getPageBlocks(pageId: string): Promise<Block[]>`
Retrieves all blocks from a Notion page.

#### `extractTodoBlocks(blocks: Block[]): Promise<TodoAndChildren[]>`
Extracts unfinished TODO blocks with their nested children.

#### `findTodoHeadingId(pageId: string): Promise<string>`
Finds the ID of the "To do" heading block in the target page.

#### `insertBlocksBefore(pageId: string, headingId: string, blocks: TodoAndChildren[])`
Inserts blocks before a specified heading.

#### `updatePageStatus(pageId: string, status: string)`
Updates the Status property of a Notion page.

#### `addCommentToPage(pageId: string)`
Adds a timestamped comment to a page for audit tracking.

## Error Handling

The application includes centralized error handling via `handleNotionError()`:

- Catches and logs Notion API errors
- Provides meaningful error messages
- Prevents application crashes on API failures

## Development

### Tech Stack

- **TypeScript**: Type-safe JavaScript
- **@notionhq/client**: Official Notion API client
- **dotenv**: Environment variable management
- **Vitest**: Fast unit testing framework
- **esbuild**: Lightning-fast bundler for production

### Code Style

- ES Modules (`"type": "module"`)
- Async/await for asynchronous operations
- Strong typing with TypeScript interfaces
- Modular architecture with separation of concerns

## Troubleshooting

### Common Issues

**Error: "Status is expected to be status"**
- Ensure your Status property is of type `status`, not `select` or `multi_select`

**Error: "Tags is expected to be multi_select"**
- Check that you're updating the correct property name (`Status`, not `Tags`)

**No TODOs copied**
- Verify your page has a "To do" heading
- Check that TODOs are not completed or strikethrough
- Ensure page structure matches the expected format

**Authentication Error**
- Verify your `NOTION_KEY` is correct
- Ensure the integration has access to your database
- Check that the database is shared with your integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Submit a pull request

## License

ISC

## Author

@santihs

## Changelog

### Recent Updates
- ✨ Added support for Notion's native `status` property type
- ✨ Implemented automatic target page status update to "In Progress"
- 🐛 Fixed property type handling for status updates
- 🧪 Added unit tests for block methods and headers
- 🏗️  Refactored code to use appropriate types and interfaces
- ⚡ Added esbuild for production builds
- 🔄 Added GitHub Actions for automated task execution
