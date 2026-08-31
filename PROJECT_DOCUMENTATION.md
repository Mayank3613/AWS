# Smart Customer Report & Insight System Documentation

## 1. Project Overview
This project is a **Smart Customer Report & Insight System** built using the **MERN Stack** (MongoDB, Express.js, React, Node.js). It is designed to manage customer data, generate reports, and provide smart risk insights using a custom algorithm.

---

## 2. Technology Stack & Justification

### **Node.js**
**Role:** Runtime Environment
**Why use it?**
- **Non-blocking I/O:** Node.js uses an event-driven, non-blocking I/O model, making it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.
- **JavaScript Everywhere:** Allows using JavaScript on both the client (frontend) and server (backend), unifying development and allowing code reuse.
- **NPM Ecosystem:** Access to the world's largest library of open-source packages (npm), accelerating development.

### **Express.js**
**Role:** Backend Framework
**Why use it?**
- **Minimalist & Flexible:** It provides a thin layer of fundamental web application features, without obscuring Node.js features that you know and love.
- **Middleware Support:** Excellent support for middleware (like `cors`, `body-parser`, custom authentication), which allows you to handle requests in a modular way.
- **Routing:** Simplifies the definition of routes (endpoints) for your API (e.g., `GET /api/customers`, `POST /api/login`).

### **MongoDB**
**Role:** Database
**Why use it?**
- **NoSQL / Schema-less:** Stores data in flexible, JSON-like documents. This maps directly to objects in your application code, making it easier to work with than rigid SQL tables.
- **Scalability:** Built for horizontal scalability (sharding), handling large volumes of data efficiently.
- **Performance:** High performance for simple queries and real-time analytics.

### **React.js**
**Role:** Frontend Library
**Why use it?**
- **Component-Based:** Breaks the UI into independent, reusable pieces (Components), which can be thought about in isolation.
- **Virtual DOM:** Efficiently updates and renders just the right components when data changes, leading to a smooth user experience.
- **Ecosystem:** Huge community, excellent tooling (Create React App, DevTools), and vast library of third-party components (like Material UI).

---

## 3. Backend Documentation

### **Project Structure Overview**
The backend is structured using the **MVC (Model-View-Controller)** pattern:
- **Models**: Database schemas (Data layer).
- **Controllers**: Business logic (Logic layer).
- **Routes**: API endpoints (Network layer).

### **Entry Point & Configuration**

#### **`server.js`**
**Role:** The main entry point of the backend application.
- **Connects to Database:** Calls `connectDB()` to connect to MongoDB.
- **Middleware Scaffolding:** Sets up `cors` (for cross-origin requests) and `express.json()` (to parse JSON request bodies).
- **Route Definitions:** Binds API routes (e.g., `/api/auth`, `/api/customers`) to their respective route files.
- **Server Start:** Listens on the defined `PORT` (default 5000).

#### **`config/db.js`**
**Role:** Database connection utility.
- Uses `mongoose.connect()` to establish a connection to the MongoDB database using the URI stored in `.env`.
- Handles connection errors gracefully by logging them and exiting the process if necessary.
- **Note:** Exits process with code 1 on connection failure to prevent the app from running without a database.

---

### **Models (Data Layer)**
*Located in `/models`. Defines the structure of data in MongoDB.*

#### **`User.js`**
**Description:** Schema for system users (Admin, Manager, and Staff).
- `name`, `email`: Basic identity.
- `phone`: Mobile contact (Default: empty).
- `notifications`: Toggle for email alerts (Default: true).
- `password`: Hashed using `bcryptjs` for security.
- `role`: Can be `'admin'`, `'manager'`, or `'staff'`, used for access control.
- `resetPasswordToken` & `Expire`: Used for the secure "Forgot Password" flow.
- **Methods:**
    - `matchPassword()`: Compares entered password with stored hash.
    - `getResetPasswordToken()`: Generates a secure hex token, hashes it for DB storage, and sets a 10-minute expiration.

#### **`Customer.js`**
**Description:** Schema for the clients being managed.
- `name`, `email`, `contact`: Core client identity.
- `status`: Active, Inactive, Banned, or On Hold.
- `segment`: Regular, VIP, Standard, or Premium.
- `riskScore`: Low, Medium, High (Calculated by the system).
- `healthScore`: 0-100 metric indicating customer relationship health.
- `ltv`: Lifetime Value (Revenue generated to date).
- `mrr`: Monthly Recurring Revenue.
- `clv`: Customer Lifetime Value (Estimated total value).
- `pendingPayments`: Outstanding revenue.
- `assignedTo`: Reference to the Staff member managing the account.
- `lastActivity`: Timestamp of last interaction (Automatically updated).

#### **`Report.js`**
**Description:** Schema for complaints, issues, or activity reports.
- `customerId`: Links the report to a specific Customer.
- `customerName`: Denormalized name for faster dashboard rendering.
- `title` & `description`: Details of the issue.
- `status`: Open, In Progress, Resolved.
- `priority`: Critical, High, Medium, Low.
- `assignedTo`: Reference to the Staff/Manager handling the ticket.
- `staffName`: Name of the assigned agent for visual display.

#### **`Insight.js`**
**Description:** Stores the generated "Smart Insights" and risk scores.
- `riskScore`: The calculated risk level.
- `recommendation`: The AI-generated advice.
- `riskFactors`: Array of specific triggers (e.g., "Critical Health Score").
- `generatedAt`: Timestamp of analysis.

#### `AuditLog.js`
**Description:** System-wide trail for tracking administrative actions.
- `userId`: Reference to the User who performed the action.
- `action`: Type of action (e.g., "Update Report").
- `details`: Descriptive string of the event.

#### `InteractionLog.js`
**Description:** Detailed records of customer touchpoints.
- `customerId`: Link to the Customer.
- `userId`: Reference to the staff/admin.
- `type`: Call, Email, Complaint, Meeting, or Note.
- `notes`: Content of the interaction.
- `rating`: 1-5 satisfaction or health metric.
- `resolvedAt`: Optional date if the interaction was a ticket-closer.

---

### **Controllers (Business Logic Layer)**
*Located in `/controllers`. Handles logic when an API endpoint is hit.*

#### **`authController.js`**
- `registerUser`: Creates a new user and returns a JWT token.
- `loginUser`: Authenticates user credentials and returns a JWT token.
- `updateProfile`: Updates current user's profile settings (name, email, phone, notifications).
- `forgotPassword` & `resetPassword`: Handles the secure password reset flow using SHA-256 hashed email tokens.
- `getMe`: Returns current user's profile based on the JWT token.

#### **`customerController.js`**
- **CRUD Operations:** `getCustomers`, `createCustomer`, `updateCustomer`, `deleteCustomer`.
- Validates input data before saving to the database.

#### `reportController.js`
- `getReports`: Fetches reports with advanced filtering (date, status, priority).
- `createReport`: Creates a new report and logs an audit event.
- `updateReport`: Updates report status/details and logs an audit event.
- **`generateInsights`**: 
  - Iterates through all customers.
  - Calculates **Risk Score** based on Health Score, Unresolved Critical Reports, and Inactivity.
  - Generates clear text **Recommendations** and **Risk Factors**.

#### `auditController.js`
- `getAuditLogs`: Retrieves recent system-wide administrative actions (Limit 200).
- `logAudit`: Internal helper to create new audit entries.

#### `interactionController.js`
- `getInteractions`: Fetches all touchpoints for a specific customer.
- `createInteraction`: Logs a new communication event (Call, Note, etc.).

#### `dashboardController.js`
- `getDashboardStats`: Aggregates data for the Admin Dashboard.
- Counts total customers, active complaints, elevated-risk accounts.
- **Financial Intelligence**: Sums up `totalMRR` and `totalPendingPayments`.
- **Growth Analysis**: Generates `monthlySalesTrend` data (revenue and customer growth over time).
- Prepares distribution data for Charts (Risk Distribution, Report Statuses).

---

### **Routes (API Layer)**
*Located in `/routes`. Maps URLs to Controller functions.*

- **`authRoutes.js`**: `POST /register`, `POST /login`, `GET /me`.
- **`customerRoutes.js`**: Protected routes for managing customers. Supports role-based access for Admin, Manager, and Staff.
- **`reportRoutes.js`**: Routes for creating/viewing reports. Includes `POST /insights/generate` for the risk algorithm.
- **`auditRoutes.js`**: `GET /` - Fetches system audit trail (Admin only).
- **`interactionRoutes.js`**: `GET /:customerId`, `POST /:customerId` - Manage customer touchpoints.
- **`dashboardRoutes.js`**: `GET /stats` for fetching dashboard analytics.

### **Middleware**
#### **`middleware/authMiddleware.js`**
- **`protect`**: Verifies the JWT token and attaches the `user` object to the request.
- **`admin`**: Restricts access to users with the `'admin'` role.
- **`adminOrManager`**: Allows access to both `'admin'` and `'manager'` roles, used for oversight tasks.

---

## 4. Frontend Documentation

### **Structure Overview**
Built with **React**, utilizing `react-router-dom` for navigation and `axios` for API calls.

### **Key Files**

#### **`App.js` & `index.js`**
**Role:** App Shell.
- Sets up the `Router` to handle navigation.
- Wraps the app in `AuthProvider` for global state.
- Defines **Protected Routes** to restrict access based on user roles.

#### **`components/ProtectedRoute.js`**
**Role:** Access Control Guard.
- Wraps sensitive routes to ensure only authenticated users with correct roles (Admin/Staff) can access them.
- Redirects unauthorized users to the login page or their respective dashboard.

#### **`components/Sidebar.js`**
**Role:** Main Navigation.
- A collapsible side menu that displays different links based on the user's role.
- Stores its collapsed state in `localStorage` for a consistent UI experience.

#### **`components/Topbar.js`**
**Role:** Header & Global Actions.
- Displays the current page title.
- Includes a **Global Search** bar for quick customer lookup.
- Features a **Notifications** dropdown for SLA alerts and task reminders.

#### **`components/ExportButtons.js`**
**Role:** Data Portability.
- Provides "Export PDF" and "Export Excel" functionality for tables and reports.
- Uses `jspdf` and `xlsx` libraries for client-side file generation.

#### **`context/AuthContext.js`**
**Role:** Global State Management for Authentication.
- Stores `user` object and `token`.
- Provides methods: `login()`, `register()`, `logout()`.
- Supports role-based redirects (Admin, Manager, Staff).

#### **`pages/Landing.js`**
**Role:** Public Landing Page.
- A visually engaging entry page with animations and glassmorphism design.

#### **`pages/admin/AdminDashboard.js`**
**Role:** Command Center for Admins.
- **Data Visualization:** Displays KPIs (Customers, High-Risk, MRR) and charts (Risk Distribution, Report Status).
- **Automation:** Includes calls to logic aggregates for real-time performance tracking.

#### **`pages/admin/SmartInsight.js`**
**Role:** AI Risk Engine UI.
- **Button:** "Run Risk Analysis Model" triggers the backend algorithm.
- **Display:** Renders color-coded "Insight Cards" with AI recommendations and risk factor tags.

#### **`pages/admin/AuditLogs.js`**
**Role:** Compliance & Oversight.
- Displays a searchable trail of all system-wide administrative actions.
- Features advanced filtering by agent role, action type, and date range.

#### **`pages/admin/Reports.js`**
**Role:** Central Ticket Tracker.
- Displays all customer issues with advanced filtering (Priority, Status, Date).
- **Bulk Actions**: Multiselect to resolve or export tickets via CSV/Excel.
- **SLA Urgency Tracking**: Highlights **SLA Violations** for tickets older than 48 hours with a visual "SLA Overdue" marker.

#### **`pages/admin/CustomerManagement.js`**
**Role:** Master Directory Control.
- Allows admins to register new clients or edit existing profiles.
- Features real-time validation and automatic **CLV (Customer Lifetime Value)** estimation.

#### **`pages/CustomerProfile.js`**
**Role:** 360-Degree Customer View.
- Displays Health Score, LTV, and Personal Info.
- **Interaction History**: Integrated form to log calls, emails, and notes.
- **Customer Audit Trail**: Filtered view of administrative changes related to this specific customer.

#### **`pages/staff/StaffDashboard.js`**
**Role:** Simplified Workspace for Staff.
- Focuses on "Assigned Customers" and "Pending Reports" for daily tasks.

#### **`pages/staff/CustomerList.js`**
**Role:** Personal Workspace for Staff.
- Displays assigned client portfolios in either **Grid** or **Table** view.
- Provides shortcuts for creating reports or scheduled follow-ups.

#### **`pages/staff/StaffReports.js`**
**Role:** Task Management UI.
- Includes a **Kanban Board** for visual workflow (Open -> In Progress -> Resolved).
- Allows staff to track their personal resolution metrics.

#### **`pages/staff/Profile.js`**
**Role:** Personal Accountability.
- Displays user access levels and profile completion stats.
- Shows a timeline of the user's recent administrative actions.

#### **`pages/Login.js` / `Register.js`**
- Standard authentication forms linked to `AuthContext`.
- Handles secure redirects upon successful login based on user role.

#### **`pages/ForgotPassword.js` / `ResetPassword.js`**
- Self-service recovery flow for forgotten passwords.
- Secure token-based reset utility.

---

## 5. Script & Utility Files

These standalone scripts help with database management, seeding, and verification. They should be run from the root directory using `node`.

#### **`seed.js`**
**Role:** Database Seeder & Reset Tool.
- **Command:** `node seed.js`
- **Functionality:**
  - **Clears Database:** Deletes all existing `Customer`, `Report`, and `Insight` documents to start fresh.
  - **Seeds Customers:** Inserts a curated list of Indian companies (e.g., Infosys, TCS, Reliance, Paytm) with varying risk profiles (Low, Medium, High).
  - **Seeds Reports:** Creates realistic issue reports linked to these customers with different priorities and statuses.
  - **Randomized History:** Generates `createdAt` dates over the last 12-24 months to simulate a real history timeline.

#### **`check_user.js`**
**Role:** User Verification Tool.
- **Command:** `node check_user.js`
- **Functionality:**
  - Connects to MongoDB immediately.
  - Queries the `User` collection for a specific email (`test1@gmail.com`).
  - Logs "User found" with details or "User not found" to the console.
  - Useful for debugging registration or seeding issues.

#### `drop-index.js`
**Role:** Database Maintenance Tool.
- **Command:** `node drop-index.js`
- **Functionality:** Drops deprecated unique indexes to prevent registration errors.

#### `utils/cronJobs.js`
**Role:** Background Automation & Scheduled Tasks.
- **Daily (8 AM)**: Scans for overdue payments and health score anomalies, logging system alerts.
- **Weekly (Friday 5 PM)**: Aggregates system metrics and revenue growth, generating a management summary for administrators.

#### `utils/sendEmail.js`
**Role:** SMTP Delivery Engine.
- Uses `nodemailer` to dispatch secure system emails (Password Reset, SLA Alerts).
- **Fallback Logic**: Logs the email content and reset link to the server console if no SMTP credentials are provided in `.env`.

---

## 6. Project Configuration

#### **`package.json`**
- Lists dependencies: `express`, `mongoose`, `react`, `axios`, etc.
- Scripts: `start` (backend), `client` (frontend), `dev` (concurrent).

#### **`.env`**
- Secrets: `MONGO_URI`, `JWT_SECRET`, `PORT`, `SMTP_HOST` (optional).

---

## 7. Controller Function Reference

### **Auth Controller (`controllers/authController.js`)**

#### `registerUser`
- **Route:** `POST /api/auth/register`
- **Access:** Public
- **Description:** Registers a new user (Admin or Staff). Validates that all fields are present and that the user does not already exist. Returns a JWT token upon success.

#### `loginUser`
- **Route:** `POST /api/auth/login`
- **Access:** Public
- **Description:** Authenticates a user by checking email and password. Returns a JWT token if credentials are valid.

#### `getMe`
- **Route:** `GET /api/auth/me`
- **Access:** Private
- **Description:** Retrieves the current logged-in user's data (ID, name, email, role) using the JWT token from the request.

#### `forgotPassword`
- **Route:** `POST /api/auth/forgotpassword`
- **Access:** Public
- **Description:** Initiates the password reset process. Generates a reset token, saves it to the user document, and sends a reset link via email (simulated or real if SMTP is configured).

#### `resetPassword`
- **Route:** `PUT /api/auth/resetpassword/:resetToken`
- **Access:** Public
- **Description:** Resets the user's password using a valid token. Hashes the new password and clears the reset token fields.

### **Customer Controller (`controllers/customerController.js`)**

#### `getCustomers`
- **Route:** `GET /api/customers`
- **Access:** Private (Admin/Staff)
- **Description:** Retrieves a list of all customers from the database.

#### `createCustomer`
- **Route:** `POST /api/customers`
- **Access:** Private (Admin/Staff)
- **Description:** Creates a new customer record. Validates required fields (Name, Email, Contact).

#### `updateCustomer`
- **Route:** `PUT /api/customers/:id`
- **Access:** Private (Admin)
- **Description:** Updates an existing customer's details by ID. Only Admins can perform this action.

#### `deleteCustomer`
- **Route:** `DELETE /api/customers/:id`
- **Access:** Private (Admin)
- **Description:** Permanently removes a customer from the database by ID. Restricted to Admin users.

### **Report Controller (`controllers/reportController.js`)**

#### `getReports`
- **Route:** `GET /api/reports`
- **Access:** Private
- **Description:** Retrieves all reports. Populates the `customerId` field with the customer's name and email.

#### `createReport`
- **Route:** `POST /api/reports`
- **Access:** Private (Admin/Manager/Staff)
- **Description:** Creates a new report. Automatically logs an audit event and updates customer `lastActivity`.

#### `updateReport`
- **Route:** `PUT /api/reports/:id`
- **Access:** Private
- **Description:** Updates report status. Logs an audit event if the status changes (e.g., 'Open' to 'Resolved').

#### `generateInsights`
- **Route:** `POST /api/insights/generate`
- **Access:** Private (Admin/Manager)
- **Description:** The core "AI" logic. Iterates through all customers and calculates a **Risk Score**.
    - **Logic:**
        - **High Risk**: Health Score < 50 OR >= 1 Critical Report (Unresolved).
        - **Elevated Risk**: Health Score < 70 OR >= 3 Open Reports. (Categorized as 'High' in DB).
        - **Medium Risk**: Inactivity > 30 days OR >= 1 Open Report (Pending follow-up).
        - **Low Risk**: Stable patterns with active engagement.
    - **Outcome**: Updates `Customer.riskScore` and populates `Insight` with recommendations and `riskFactors`.

#### `getInsights`
- **Route:** `GET /api/insights`
- **Access:** Private (Admin)
- **Description:** Retrieves all generated insights, including the calculated risk scores and recommendations. Populates customer details.

### **Dashboard Controller (`controllers/dashboardController.js`)**

#### `getDashboardStats`
- **Route:** `GET /api/dashboard/stats`
- **Access:** Private (Admin)
- **Description:** Aggregates real-time statistics for the Admin Dashboard.
    - **Metrics Returned:**
        - `totalCustomers`: Count of all customers.
        - `activeComplaints`: Count of reports with status 'Open' or 'In Progress'.
        - `highRiskCustomers`: Count of customers with 'High' risk score.
        - `totalMRR`: Total monthly recurring revenue across all segments.
        - `totalPendingPayments`: Total outstanding revenue awaiting collection.
        - `monthlySalesTrend`: Time-series growth data for revenue and new accounts.
        - `riskDistribution`: Aggregated count of customers by risk level (Pie chart).
        - `reportStatusDistribution`: Current status of all tickets (Bar chart).

---

## 8. Design System & Global Styles

The system uses a modern **Glassmorphism** design language with a focus on deep colors and sleek transparency.

#### **`theme.css`**
- **Token System:** Defines the core color palette (`--bg-primary`, `--accent-primary`, etc.) and typography across the app.
- Ensures a consistent "Premium Dark Mode" look.

#### **`App.css`**
- **Layout Logic:** Manages the main dashboard shell, sidebar transitions, and responsive grid layouts.
- **Glass Effects:** Contains reusable CSS classes for the translucent "Glass Card" effect used in dashboards.

#### **`index.css`**
- **Base Styles:** Standardizes font rendering (Inter/Outfit), scrollbars, and core reset properties.

