# Customer Report & Insight System: Architecture Guide

This documentation provides a deep dive into the technical structure of the project, explaining the tech stack, directory hierarchy, and the logic behind every file and function.

---

## 1. Libraries & Dependencies

### **Backend (Node.js/Express)**
| Library | Purpose & Rationale |
| :--- | :--- |
| **express** | The core framework for building the RESTful API and handling HTTP requests. |
| **mongoose** | An ODM (Object Data Modeling) library for MongoDB. It provides a schema-based solution to model application data. |
| **jsonwebtoken (JWT)** | Used for secure authentication. It creates tokens that allow users to remain logged in safely. |
| **bcryptjs** | A library for hashing passwords. It ensures that user passwords are never stored in plain text in the database. |
| **dotenv** | Manages environment variables (like API keys and DB strings) to keep them secure and separate from code. |
| **nodemailer** | Handles automated email delivery for features like "Forgot Password" or system alerts. |
| **node-cron** | Allows scheduling background tasks (cron jobs), such as weekly report generation or daily payment scans. |
| **cors** | Enables Cross-Origin Resource Sharing, allowing the React frontend (Port 3000) to communicate with the Backend (Port 5000). |

### **Frontend (React)**
| Library | Purpose & Rationale |
| :--- | :--- |
| **axios** | A promise-based HTTP client used to make requests from the React app to the Node.js API. |
| **chart.js / react-chartjs-2** | Used to create interactive, animated charts (Pie, Bar, Line) for the Admin Dashboard. |
| **jspdf / jspdf-autotable** | Enables client-side generation of PDF reports, allowing users to download data tables instantly. |
| **xlsx (SheetJS)** | Powers the "Export to Excel" feature, converting JSON data into downloadable spreadsheet files. |
| **react-router-dom** | The standard routing library for React, enabling navigation between different pages without refreshing the browser. |

---

## 2. Core Software Stack Features

### **Node.js (Runtime)**
*   **Asynchronous I/O**: Handles multiple requests simultaneously without blocking the server.
*   **V8 Engine**: High-performance JavaScript execution by Google.

### **MongoDB (Database)**
*   **NoSQL / Document-Oriented**: Stores data in JSON-like format, making it highly flexible for customer records.
*   **High Scalability**: Built to handle large volumes of data and easy horizontal scaling.

### **React.js (Frontend)**
*   **Virtual DOM**: Only updates parts of the page that change, leading to a fast, "flicker-free" experience.
*   **Component-Based**: UI is built from reusable pieces, making the code maintainable and organized.

---

## 3. Folder Structure & File Breakdown

### **Root Directory**
*   `server.js`: **[Entry Point]** Scaffolds the server, connects to DB, and mounts all routes.
*   `.env`: Stores secrets like `MONGO_URI` and `JWT_SECRET`.
*   `seed.js`: Script to populate the database with dummy data for testing.
*   `package.json`: Manifest of backend dependencies and start scripts.

### **Backend Folders (`/`)**
#### **`/models` (Data Schemas)**
*   `User.js`: Defines fields for Staff/Admin (Email, Password, Role).
*   `Customer.js`: Stores client data including financial metrics (MRR, LTV) and health scores.
*   `Report.js`: Schema for tickets/complaints linked to a customer.
*   `AuditLog.js`: Structure for tracking administrative actions.
*   `Insight.js`: Stores AI-generated risk factors and recommendations.

#### **`/controllers` (Business Logic)**
*   `authController.js`: Logic for registration, login, and profile updates.
*   `customerController.js`: CRUD operations for managing the client directory.
*   `reportController.js`: Logic for tickets and the **AI Risk Engine**.
*   `dashboardController.js`: Aggregates stats for the visual charts.
*   `auditController.js`: Logic for retrieving the system history trail.

#### **`/routes` (API Endpoints)**
*   Maps URLs (e.g., `/api/customers`) to the specific logical functions in controllers.

#### **`/middleware` (Security Guards)**
*   `authMiddleware.js`: Verifies JWT tokens and checks if a user is an 'Admin' before allowing access to sensitive pages.

---

### **Frontend Folders (`/client/src`)**
#### **`/pages` (View Layer)**
*   `Landing.js`: The animated entry page.
*   `admin/AdminDashboard.js`: Command center for managers with visual charts.
*   `admin/SmartInsight.js`: Visual interface for the AI risk prediction matrix.
*   `staff/Reports.js`: Work-area for staff to manage their assigned tickets.

#### **`/context` (State Management)**
*   `AuthContext.js`: Manages the global login state (User object, Token) across the entire application.

---

## 4. Important Functions Reference

### **Backend Functions**
| File | Function | Role |
| :--- | :--- | :--- |
| **authController.js** | `loginUser` | Authenticates credentials and returns a secure JWT. |
| **customerController.js** | `createCustomer` | Validates new client data and auto-calculates CLV (Customer Lifetime Value). |
| **reportController.js** | `generateInsights` | **[Core Logic]** Scans data for inactivity and low health to predict churn risk. |
| **dashboardController.js** | `getDashboardStats` | Uses MongoDB Aggregation to sum up total MRR and calculate risk distribution. |

### **Frontend Functions**
| File | Function | Role |
| :--- | :--- | :--- |
| **AuthContext.js** | `login` | Stores the user token in `localStorage` and redirects to the correct dashboard. |
| **ExportButtons.js** | `exportPDF` | Formats application state into a high-quality PDF table for physical records. |
| **SmartInsight.js** | `generateInsights` | Triggers the backend AI analysis engine and updates the UI cards. |
| **Reports.js** | `filteredReports` | Dynamically filters hundreds of tickets based on Status, Priority, or Date. |

---

> [!TIP]
> **Developer Note**: To add a new feature, follow the **Model -> Controller -> Route** flow in the backend, then create a new **Page** in the frontend and link it in `App.js`.
