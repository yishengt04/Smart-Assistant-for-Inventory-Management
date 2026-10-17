# Smart Inventory Management Assistant

An inventory management system built with React 19, Vite, TypeScript, Neon Serverless PostgreSQL, Firebase Authentication, and Google Gemini AI.

## Features

### Analytics & Dashboard

* Tracks total SKUs, low stock alerts, and active stock counts.


* Uses Recharts for stock level analysis with filters for All, Low Stock, and High Stock.


* Includes donut and pie charts for inventory health and category breakdown.


* Displays leaderboards for highest-stock and lowest-stock assets.


* Provides a modal for immediate restocking actions linked to filtered inventory.



### Master Inventory & Stock Operations

* Custom category management uses customizable SKU prefixes, such as MON-001 or LAP-002.


* Transaction logging for stock in and out workflows includes reference numbers, remarks, timestamps, and staff attribution.


* Stock adjustments can be made directly from the inventory table.


* High-priority assets can be flagged for AI prioritization.


* Master inventory data can be exported to CSV.



### Role-Based Access Control (RBAC) & Staff Management

* New staff accounts authenticating via Firebase receive auto-assigned sequential staff IDs.


* The system uses a three-tier security model:


* `full_access`: Grants permissions to create items, categories, adjust stock levels, and view transaction history.


* `read_only`: A view-only mode that hides navigation for Stock In/Out and History, and disables buttons for Create Item, Edit, and Stock In/Out.


* `blocked`: Suspended accounts are instantly signed out via Firebase and shown an administrator contact notice.





### Admin Portal & User Management

* Admin authentication is verified against `VITE_ADMIN_ID` and `VITE_ADMIN_PASSWORD`.


* The admin session token is stored in browser `sessionStorage`.


* A staff directory is searchable by Name, Staff ID, or Firebase UID.


* The user management modal provides a staff profile overview, a toggle for access levels, and an individual transaction audit trail.


* Administrators can block, unblock, or delete user records.



### AI Inventory Assistant

* Automated audits examine stock thresholds, predict demand spikes, and generate reorder recommendations.


* Features a floating AI chat powered by Google Gemini 3 Flash Preview.


* Injects live inventory balances and recent stock transactions into prompts for real-time context.



## Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion


* **Charts**: Recharts


* **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)


* **Authentication**: Firebase Authentication + Custom Admin Portal


* **AI**: `@google/genai`


## Database Schema

The system automatically performs database migrations on boot via `dbService.runMigrations()`.

### `users`

* `firebase_uid` (TEXT): PRIMARY KEY


* `staff_id` (TEXT): UNIQUE NOT NULL


* `name` (TEXT): NOT NULL


* `status` (TEXT): DEFAULT 'active'


* `access_level` (TEXT): DEFAULT 'full_access'


* `created_at` (TIMESTAMPTZ): CURRENT_TIMESTAMP



### `items`

* `id` (SERIAL): PRIMARY KEY


* `user_id` (TEXT): NOT NULL


* `name` (TEXT): NOT NULL


* `sku` (TEXT): UNIQUE NOT NULL


* `category` (TEXT): NOT NULL


* `reorder_point` (INTEGER): DEFAULT 5


* `current_stock` (INTEGER): DEFAULT 0


* `is_hot` (BOOLEAN): DEFAULT FALSE



### `transactions`

* `id` (SERIAL PRIMARY KEY)


* `item_id` (INTEGER)


* `type` (VARCHAR(10))


* `quantity` (INTEGER)


* `ref_no` (TEXT)


* `remarks` (TEXT)


* `timestamp` (TIMESTAMPTZ)


* `user_id` (TEXT)


* `user_email` (TEXT)


* `staff_name` (TEXT)


* `staff_id` (TEXT)



### `categories`

* `id` (SERIAL PRIMARY KEY)


* `name` (TEXT UNIQUE)


* `prefix` (TEXT UNIQUE)



## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_NEON_DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require
VITE_ADMIN_ID=AD001
VITE_ADMIN_PASSWORD=ADMIN123
VITE_GEMINI_API_KEY=your_gemini_api_key_here

```

Note: If `VITE_NEON_DATABASE_URL` is omitted, the app supports falling back to a configured URL in `neonClient.ts` or manual entry in the UI.

## Setup Instructions

1. Clone the repository and run `npm install`.


2. Run `npm run dev` to start the local server, available at `http://localhost:3000` or `5173`.


3. Run `npm run lint` for type checking, `npm run build` to compile, and `npm run preview` to preview the build.



## Admin Portal Access

1. Navigate to `/admin` or click the Admin Panel link in the sidebar.


2. Log in using the `VITE_ADMIN_ID` and `VITE_ADMIN_PASSWORD` credentials.


3. Use the dashboard to manage staff access, view transaction history, and block or delete user records.



## License

This project is licensed under the MIT License.
