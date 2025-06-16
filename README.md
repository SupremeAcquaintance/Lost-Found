# Lost-Found System
![image](https://github.com/user-attachments/assets/87486a1b-79ec-4ce0-9071-d0950628b291)
Lost & Found is a comprehensive web platform that connects people who have lost items with those who have found them. Its purpose is to provide a centralized system for reporting, searching, and reclaiming lost belongings. The system serves everyday users (students, commuters, travelers, etc.) who may misplace items and the staff, security or appointed authority (admins) who manage found items. The architecture follows a classic web application model: a React-based frontend communicates with a backend server (Node.js/Express, Python/Flask) and a database (Microsoft SQL). Key features include user authentication, item reporting, automated matching, chat between users, smart notifications, and administrative management of items, claims and users.

# High-Level Architecture
The application is divided into a frontend (React) and a backend (Node/Express, Python/Flask) with a Microsoft SQL Relational database. The frontend uses React Router for navigation and Context API for global state (such as authentication). The backend exposes RESTful APIs for all operations: user auth, item reports, claims, matches, chats, etc. 
# Data flows as follows:
Authentication: Users log in or register via the frontend, which calls the backend /login or /register endpoints. On success, a session token is stored in AuthContext and local storage. This token is attached to all future API calls.

# Item Reporting & Matching: 
Users report lost or found items by filling out a form. The frontend POSTs this data to the server (via an API call). The Node backend calls the Python Flask service for embedding generations, then stores the item plus the embeddings in the SQL database and runs a matching algorithm using cosine similarity (semantic matching) to find potential counterpart reports, notifying relevant users.

# Chat & Notifications: 
When there is a potential match or claim, the system notifies users. A real-time chat component (using WebSockets or polling) allows the finder and claimant to communicate. Notifications (toasts or in-app alerts) inform users of new messages, matches, or admin updates.

# Administration: 
Admin users have access to management pages (Claim Management, Item Management, User Management, Review Management). The frontend fetches data (like all claims or users) from the backend, and actions (approve/reject claim, deactivate user, etc.) are sent via API calls.

# Data Flow Example: 
Typical flow —> A user logs in, goes to the Report page, fills out a form for a found item, and submits. The frontend POSTs this data to the server (via an API call). The Node backend calls the Python Flask service for embedding generations, then stores the item plus the embeddings in the SQL database and runs a matching algorithm using cosine similarity (semantic matching) to find potential counterpart reports, notifying relevant users. The user can then go to the Match component to see details and possibly start a chat with the person who reported the matching lost item or claim the item directly from there.
 
![SECOND matches](https://github.com/user-attachments/assets/88402e92-ed83-40a0-ac40-f3774862b96e)

# Tech Stack
## Layer	Technology
Frontend	React (with React Router, Context API), Axios
Styling/UX	CSS (e.g. Tailwind or Material UI), React components
Backend	Node.js, Express.js (RESTful API)
NLP Python Sentence Transformer Flask
Real-time	Socket.IO or WebSocket (for chat)
Database	SQL Database
Authentication	JSON Web Tokens (JWT)
Other	Babel, Webpack (for frontend bundling), ESLint/Prettier (code quality)

# Installation (Manual)
Clone the repository...
git clone https://github.com/SupremeAcquaintance/Lost-Found.git

# Setup
![image](https://github.com/user-attachments/assets/888cc7bd-98ca-404e-8126-6054ea2fede6)

## Node Backend Setup
Navigate to the server directory: cd scr/backend/models
Install dependencies: npm install
Install extra dependencies: npm install bcrypt, mssql, cors, etc.
Start the server: node index.js. It will listen on the specified port.

## Flask Service Setup
Navigate to the server directory: cd scr/backend/nlp-embedding
Create environment: python -m venv nlpenv
Activate environment: nlpenv\Scripts\activate
Install dependencies: pip install Sentence-transformers, Flask
Start the server: python embedding_service.py. it will listen on the specified port, which in this case is http://localhost:3000

## Frontend Setup
In a new terminal, in project directory: Lost-Found
Install dependencies: npm install, npm install @fortawesome, react-slick, etc
Start the development server: npm start. This opens the React app (On http://localhost:3001).

## Database
Ensure SQL Server is running (locally or via a cloud service). The backend will connect using the config in cd src/backend/models/config.
The server code initializes a stable shared sql connection pool to allow the backend routes to connect without clossing or restarting sql connection.

# Using the App
Register a new user or log in.
## Explore pages: 
“Report” an item (lost/found), view your profile, check matches, send messages via chat, etc.
If you are an admin (role set in database), you can access ClaimManagement, ItemManagement, Announcements, SystemSettings, AdminReview and UserManagement pages.

# Frontend Components
Below is an overview of the key React components (pages) and their roles:

## Chat
![chat chat](https://github.com/user-attachments/assets/bf8e50e9-c939-4e57-a415-991db96c08cc)

### Purpose: 
Enables real-time messaging between users (e.g., between the person who found an item and the person who reported it lost).
### How It Works: 
On mount, it fetches the conversation history via an API (e.g., GET /api/chat/:conversationId). It also establishes a WebSocket connection (e.g., via Socket.IO) to listen for new messages. The user can send messages, which are emitted to the server (e.g., socket.emit('sendMessage', message)), and new incoming messages are received via a socket listener.
### What It Renders: 
A scrollable list of chat bubbles (showing sender and timestamp) and a text input field with a send button. It updates the view as messages arrive.
### Interactions:
Props/Params: It may receive a conversationId from route parameters or props, and the other user’s ID to fetch the correct chat.
### AuthContext: 
Uses AuthContext to get the current user’s ID/token for authorized API calls and to label outgoing messages.
### API Calls / Sockets: 
Fetches chat history through REST (axios/fetch) and uses WebSockets for live updates. On sending a message, it calls an API (e.g., POST /api/chat) or emits a socket event.

## Claim
![image](https://github.com/user-attachments/assets/f9f06cf6-3fc5-4e9d-8c26-4c6bf1eaa6c0)


# Purpose:
Allows a user to claim (or verify ownership of) a found item. For example, if User A reported an item found, User B (who lost the item) can claim it here.
# How It Works: 
It can accessed via an item modal or match modal. The component renders a form where the claimant enters details (description message or picture evidence). On submission, it sends a POST request to the backend (e.g., POST /api/claims) with the claim details (user ID from context, item ID).
# What It Renders:
A form or modal with fields like “Claim Message” and a submit button. It may also show item details for context.
Interactions:
# Props:
Will receive the itemId of the found item to claim (from route or parent).
# AuthContext: 
Uses the current user’s ID/token to attach to the claim.
# API Calls: 
On submit, calls an endpoint to create a new claim. Shows a success/failure notification afterward (using the notifications system).

## ClaimManagement
![image](https://github.com/user-attachments/assets/44662c5d-04df-418b-9ef6-31037c3b04d2)

### Purpose: 
An admin view to oversee all item claims made by users. Admins can approve or reject claims.
# How It Works: 
On mount, fetches a list of all pending claims via an API call (e.g., GET /api/claims). It displays each claim (item info, claimant info, date). Admin can click “Approve” or “Reject” for each.
# What It Renders: 
A table or list of claim entries. Each entry might show the item name, who claimed it, and action buttons. A search or filter interface may exist to find specific claims.
### Interactions:
### Context: 
This should only be accessible to admin (AuthContext’s user role is checked, via protected route).
### API Calls: 
Fetch all claims, and for actions it sends PUT/PATCH requests (e.g., PUT /api/claims/:claimId/approve) to update claim status. Upon success, it refreshes the list (or updates state) and triggers a notification (e.g., "Claim approved").

## Report
![image](https://github.com/user-attachments/assets/9fa62a7d-6fd7-434f-8e20-c8879b3c770d)

### Purpose: 
A form where users report a new lost or found item.
### How It Works: 
Presents fields for item description, category, location, date, and an image upload. On form submit, the data is sent to the backend (e.g., POST /api/items) to create the report in the database.
### What It Renders: 
Input fields (text, dropdowns, date picker, file upload) and a submit button. May also show current logged-in user’s info (from AuthContext).
# Interactions:
Props: None; this is usually a standalone page.
AuthContext: Attach the current user’s ID to the report (so items are linked to a reporter).
API Calls: After form validation, calls the API to save the item. On success, it shows a notification (“Report submitted!”) and possibly redirects to the Item Management or Profile page.

## Match![image](https://github.com/user-attachments/assets/dfe21baa-7e2a-4721-9195-947a8b583c71)

# Purpose: 
Displays potential matches between lost and found items, helping users or admins see likely pairings.
# How It Works: 
On access, the component may fetch matching results via an API (e.g., GET /api/matches) or compute them client-side by comparing reported lost and found items. Matches could be generated automatically by the server after each new report.
# What It Renders: 
A list or table of matches, each showing a lost item and a found item side by side with a match score or confidence. It may allow users to confirm if the match is correct.
# Interactions:
Props: % theshold input from the user via request params.
AuthContext: The user's role determines which matches they see (e.g., a user sees only their matches, an admin sees all).
API Calls: Post % match threshold abd Fetch match data from the server. Also notifies the users who posted the matching reports.

## Profile![image](https://github.com/user-attachments/assets/f785afe1-378b-4043-bbf9-d4a66f72e6f3)

# Purpose:
Shows the logged-in user’s profile and related data.
# How It Works: 
Fetches user data from backend (e.g., GET /api/users/:userId using AuthContext’s ID). Also fetches items and claims related to this user.
# What It Renders:
The user’s personal information (name, email), and user's activity log. It allows editing profile info.
# Interactions:
Props: Typically none (it infers the user from context).
AuthContext: Provides the current user ID and name to display.
API Calls: Retrieve and update user info, and get lists of items/claims via APIs.

## Registration
# Purpose:
Handles user sign-up
# How It Works: 
Renders a form where a new user enters details (username, email, password). On submit, sends these to the backend (e.g., POST /api/register). After successful registration, it automatically log the user in and redirects to home page.
# What It Renders: 
Input fields for username, email, password (and possibly confirm password), and a submit button.
# Interactions:
Props: None; this is a standalone page.
AuthContext: On successful registration or login, it will update the AuthContext with the new user’s info.
API Calls: Calls /api/register or /api/login. On success, sets authentication token in context and local storage. Also triggers navigation to the dashboard or home page.

## ItemManagement
![image](https://github.com/user-attachments/assets/e6f990f7-62d7-4168-b6bd-2996c3d00844)

# Purpose: 
Admin interface for managing all reported items (lost or found).
# How It Works: 
On mount, it fetches all items (GET /api/items) and displays them. Admins can edit item details, mark items as recovered, or delete reports.
# What It Renders: 
A table or list of items with columns like “Title”, “Status”, “Reporter”, and action buttons (Edit, Delete, Mark Recovered). Each item row may be expandable to view details or claims.
# Interactions:
Context: Only accessible to admin users (checked via AuthContext).
API Calls:
Fetch all items.
On “Delete” click, calls DELETE /api/items/:id.
On “Edit”, opens a form or inline edit and calls PUT /api/items/:id.
On “Mark Recovered”, calls PUT /api/items/:id/recover.
Props: Possibly none; the component manages its own state and calls APIs directly.
After any action, refreshes the list and shows a notification.

## UserManagement
![image](https://github.com/user-attachments/assets/35c0ce2e-3c9f-40b1-a099-f698cb259e96)

Purpose: Admin interface for viewing and managing user accounts.
How It Works: Fetches all users (GET /api/users) on mount. Displays user data and allows actions like changing roles or deactivating accounts.
What It Renders: A table of users with fields like “Username”, “Email”, “Role”, “Status” (active/disabled), and action buttons (Edit, Disable).
Interactions:
Context: Accessible only to admin (AuthContext check).
API Calls:
Fetch users list.
Change a user’s role or status (e.g., PUT /api/users/:id/role).
Delete or disable a user (DELETE /api/users/:id or PUT /api/users/:id/disable).
Displays notifications on success/failure of these actions.

## Notifications
![image](https://github.com/user-attachments/assets/f774cae4-49b0-45cc-bcf8-e299b32391d3)

Purpose: Provides an in-app notification system to alert users of important events (e.g., new chat messages, claim status updates, new matches).
How It Works: Typically implemented via a context or a global state that components can use to trigger alerts. For example, after any successful API call, the code might call notify.success("Saved!"). There might be a Notifications component mounted at a high level that listens for these events and displays toast messages.
What It Renders: Visual alerts (such as toast pop-ups or an alerts panel) that appear temporarily or persist until dismissed. Often uses a library (like react-toastify or a custom solution) to queue messages.
Interactions:
Context: There might be a NotificationContext or similar to provide notify methods.
Props: The Notifications component itself may not take props; it subscribes to an event emitter or context.
API Calls / Events: Notifies are triggered after API responses. For example, if an item report is saved successfully, the code calls notify("Item reported successfully!").

## Internal Data Flow
### AuthContext: 
The root of the React app wraps everything in AuthContext.Provider. This context stores the current user's information and authentication token. When components need to know the user (e.g., Profile, Chat), they use useContext(AuthContext) to get the user object and token. The token is included in all axios/fetch headers for protected API calls. Navigation guards check AuthContext to ensure only authenticated users access certain routes (e.g., redirecting to login if not authenticated).
### Navigation (React Router): 
The app uses react-router-dom to define routes for each main component (e.g., /chat, /profile, /admin/users). A central App.js might include a <BrowserRouter> with <Routes> and <Route> elements linking paths to components. After key actions (like login or submit), the code uses the useNavigate hook to redirect users (e.g., navigate('/profile') after login). The navigation bar (a shared header) likely uses <Link> or <NavLink> to allow users to switch between pages.
### Notifications System:
A notification mechanism (often a context or a reusable service) is integrated throughout the app. Whenever an API call finishes or an important event occurs, the code dispatches a notification (success or error). The notification component renders these messages. For example, after approving a claim, the ClaimManagement component might call notify("Claim approved"). These notifications give feedback and guide user interactions.
### Props and Context Interactions:
Many components use props (or router params) to know which item or claim they’re dealing with (e.g., Claim uses an itemId prop). Most components also tap into global AuthContext to get the user’s identity. Some components may also use a DataContext or similar if the app has one to share data like the current item or list of items without prop drilling.
### State Management:
Local component state (via useState) handles form inputs and UI state. For shared data, context or custom hooks (e.g., a useAuth or useDataFetch hook) encapsulate common logic. For example, a useAxios hook might automatically attach the auth token to requests.

## Contributors
Contributions to Lost & Found are welcome. For developers extending or modifying the codebase, please note:
Follow the Architecture: The code follows a separation between frontend and backend. Frontend features should interact with backend via the established REST API. When adding new features (e.g., a new data field or component), update the corresponding backend routes and database schema first, then adjust the frontend calls.

## Extending Components:
### Chat:
If adding features (e.g., emojis, file transfer), ensure the real-time protocol is updated both in the React component and on the backend. Keep the chat UI responsive.
### Claim/ClaimManagement: 
When modifying claim logic (like adding more statuses), update both the backend models and the React tables/forms. Use clear status labels and consider how these affect notifications.
### Report: 
For new item fields (e.g., “lost or found category”), add form inputs and extend the API accordingly. Reuse existing validation patterns.
### UserManagement/ItemManagement:
If new columns or filters are needed, update the backend query endpoints and then add UI controls. Avoid heavy operations on the client; delegate to the server where possible.
### Authentication & Authorization: Only modify AuthContext or route guards if you fully understand the impact. For example, if adding roles beyond “admin” and “user,” ensure checks in both frontend (protected routes) and backend (JWT token verification) are updated.
Code Quality: Adhere to existing code style. For React components, use functional components and hooks as in the project. If adding new third-party libraries (UI libraries, charts, etc.), document them in the README and ensure compatibility. Write descriptive commit messages and update this README if component responsibilities change.
Error Handling: Any new API interactions should handle errors gracefully. Use the notifications system to alert users. Avoid console-only error logging in production code.
Testing: If tests exist (unit or integration), add or update them when changing logic. If not, consider writing tests for critical functions (authentication, matching, form validation).
Documentation: When adding features, document their usage. For example, if introducing a new admin dashboard, update this README or add inline comments explaining component props and context usage.
By following these guidelines, contributors can safely evolve the Lost & Found system. The goal is to maintain a clean separation of concerns: components should focus on UI and calls, while business logic (matching algorithms, data validation) stays in the backend. Consistent naming and context usage throughout the codebase will help keep the system maintainable and scalable. Enjoy building and improving the Lost & Found platform!
