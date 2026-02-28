# FlashCard Learning Management System - Complete Application Documentation

## Executive Summary

This is a comprehensive web-based Learning Management System (LMS) focused on flashcard-based learning with advanced features including mind mapping visualization, detailed analytics, and adaptive learning algorithms. The application is designed to help students optimize their learning through spaced repetition, progress tracking, and visual knowledge organization.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [User Interface Components](#user-interface-components)
5. [Functionality Details](#functionality-details)
6. [Data Models](#data-models)
7. [API Integration](#api-integration)
8. [User Workflows](#user-workflows)
9. [Analytics and Reporting](#analytics-and-reporting)
10. [Technical Implementation](#technical-implementation)

---

## 1. System Overview

### 1.1 Purpose
The application provides an intelligent flashcard learning platform that helps users:
- Organize knowledge into hierarchical collections
- Learn through adaptive spaced repetition
- Track learning progress with detailed analytics
- Visualize knowledge connections through mind maps
- Make data-driven decisions about study priorities

### 1.2 Target Users
- Students preparing for exams
- Language learners
- Professionals studying for certifications
- Anyone engaged in self-directed learning

### 1.3 Key Benefits
- **Adaptive Learning**: Score-based system adapts to user performance
- **Hierarchical Organization**: Nested collections for structured knowledge management
- **Visual Learning**: Mind map interface for spatial learners
- **Progress Tracking**: Comprehensive analytics dashboard
- **Efficient Workflow**: Bulk operations and keyboard shortcuts

---

## 2. Architecture

### 2.1 Technology Stack

#### Frontend
- **React 19.2.0**: Core UI framework
- **TypeScript 5.9.3**: Type safety and better development experience
- **Vite 7.2.4**: Fast build tool and development server
- **React Router v7.9.6**: Client-side routing
- **Zustand 5.0.9**: Lightweight state management
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Axios 1.13.2**: HTTP client with interceptors

#### Development Tools
- **ESLint**: Code quality and consistency
- **TypeScript ESLint**: TypeScript-specific linting
- **Babel React Compiler**: Performance optimization
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS compatibility

### 2.2 Project Structure

```
client/
├── public/                      # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── common/            # Shared UI components
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── layout/            # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── MainLayout.tsx
│   ├── pages/                 # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── CollectionPage.tsx
│   │   ├── FlashCardEditPage.tsx
│   │   ├── FlashCardLearnSession.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── MindMapListPage.tsx
│   │   ├── MindMapCanvasPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── ReportsPage.tsx
│   ├── services/              # API service layer
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── flashCardService.ts
│   │   ├── mindMapService.ts
│   │   └── analyticsService.ts
│   ├── store/                 # State management
│   │   └── authStore.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── formatters.ts
│   │   └── storage.ts
│   ├── constants/             # Application constants
│   │   └── animations.ts
│   ├── App.tsx               # Root component
│   └── main.tsx              # Application entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 2.3 Design Patterns

#### Component Architecture
- **Container/Presentation Pattern**: Pages handle logic, components handle presentation
- **Custom Hooks**: Reusable state logic
- **Higher-Order Components**: Protected routes for authentication

#### State Management
- **Zustand Store**: Global authentication state
- **Local State**: Component-specific state with useState
- **Server State**: API data managed in components

#### API Communication
- **Service Layer Pattern**: Abstracted API calls in service files
- **Interceptor Pattern**: Centralized request/response handling
- **Error Handling**: Consistent error processing across services

---

## 3. Core Features

### 3.1 Authentication System

#### Login/Register
- JWT-based authentication
- Secure token storage
- Automatic token refresh
- Session persistence
- Protected route access control

**Capabilities:**
- User registration with email validation
- Secure login with credentials
- Automatic session management
- Token-based API authorization
- Logout with token cleanup

### 3.2 FlashCard Collection Management

#### Hierarchical Organization
- **Nested Collections**: Create parent-child relationships
- **Unlimited Depth**: No limit on collection hierarchy
- **Visual Tree Structure**: Expandable/collapsible folder views
- **Drag-and-Drop**: (Prepared for implementation)

**Collection Operations:**
- Create new collections
- Edit collection details (name, description)
- Delete collections (with child handling)
- Move collections between parents
- Add subfolders to any collection
- View card and subfolder counts

#### Collection Features
- **Card Counting**: Automatic count of flashcards
- **Children Counting**: Track number of subfolders
- **Parent Navigation**: Easy navigation through hierarchy
- **Bulk Operations**: Operate on multiple collections

### 3.3 FlashCard Management

#### Card Creation and Editing
- **Bulk Creation**: Add multiple cards at once
- **Inline Editing**: Edit cards directly in the list
- **Rich Content**: Support for term and definition pairs
- **Score Tracking**: Automatic score calculation

#### Advanced Features
- **Pagination**: Handle large card sets efficiently
- **Search**: Find cards by term or definition
- **Flip Function**: Swap term and definition
- **Bulk Flip**: Flip all cards at once
- **Bulk Selection**: Select multiple cards for operations
- **Bulk Delete**: Remove multiple cards simultaneously

#### Card Properties
- **Term**: The question or prompt
- **Definition**: The answer or explanation
- **Score**: Performance metric (-5 to +5 range)
- **Collection Assignment**: Linked to specific collection

### 3.4 Learning System

#### Adaptive Learning Session
The learning system implements an intelligent spaced repetition algorithm:

**Session Configuration:**
- Configurable cards per session (default: 10)
- Automatic shuffling for randomization
- Progress tracking throughout session
- Score-based filtering

**Learning Algorithm:**
1. **Card Selection**: Retrieve cards based on scores (prioritizes low scores)
2. **Randomization**: Shuffle cards for variety
3. **Sequential Presentation**: One card at a time
4. **Score Range**: -5 to +5 (excluding 0)
   - Negative scores: Don't know/forgot
   - Positive scores: Remember/mastered
5. **Memory Tracking**: Last two scores determine mastery
6. **Auto-removal**: Cards marked as remembered after two consecutive positive scores
7. **Continuous Loop**: Unmastered cards repeat until learned

**Scoring System:**
- **-5 to -1**: Varying degrees of "don't know"
- **+1 to +5**: Varying degrees of "remember"
- Cumulative scoring affects future card selection
- Historical tracking for analytics

**Session Features:**
- Card flipping animation
- Score button interface (-5 to +5)
- Progress indicators
- Session review screen
- Relearning options
- Transition animations
- Exit confirmation

**Session Review:**
- View all practiced cards
- See score modifications
- Toggle cards for relearning
- Continue with unmastered cards
- Submit final scores to backend

### 3.5 Analytics Dashboard

#### Overview Statistics
Display key metrics at a glance:
- **Total Collections**: Number of collection folders
- **Total FlashCards**: Across all collections
- **Cards Learned**: Cards with practice sessions
- **Average Score**: Overall performance percentage

#### Learning Progress Metrics
- **Cards to Review**: Need practice (score < 3)
- **Cards Mastered**: High performance (score ≥ 3)
- **Cards in Progress**: Moderate performance (0 < score < 3)
- **Cards Need Work**: Poor performance (score < 0)
- **Completion Rate**: Percentage of mastered cards

#### Score Distribution Analysis
Visual breakdown of cards by score ranges:
- -5 to -3: Needs significant work
- -3 to -1: Needs improvement
- -1 to 1: In progress
- 1 to 3: Good performance
- 3 to 5: Mastered

#### Top Collections
Ranked list showing:
- Collection name
- Total card count
- Cards learned
- Times learned (cumulative)
- Average score
- Completion rate
- Clickable for detailed analytics

#### Collection-Specific Analytics
Detailed view for individual collections:
- Collection metadata
- Total and learned card counts
- Average score and completion rate
- Score distribution within collection
- **Top Performing Cards**: Best 5 cards
- **Cards Needing Review**: Bottom 5 cards
- Individual card statistics (score, times learned, average)

### 3.6 Mind Map Visualization

#### Concept
Visual representation of flashcards and their relationships in a spatial canvas, enabling users to:
- Create knowledge graphs
- Visualize connections between concepts
- Navigate through related topics
- Learn through spatial memory

#### Mind Map Creation
- **Named Mind Maps**: Create multiple mind maps
- **Description**: Add context for each mind map
- **User-Specific**: Personal mind map library
- **Metadata Tracking**: Creation and update timestamps

#### Node Management
**Node Properties:**
- Linked to specific flashcards
- Position (x, y coordinates)
- Custom colors (8 preset options)
- Parent-child relationships
- Visibility toggle for children
- Embedded flashcard data (term, definition, score, learn count)

**Node Operations:**
- **Add Node**: Select from existing flashcards
- **Position Nodes**: Drag and drop on canvas
- **Connect Nodes**: Define parent-child relationships
- **Change Color**: Visual categorization
- **Hide/Show Children**: Collapse/expand branches
- **Delete Node**: Remove with relationship management
- **Add Child**: Link existing nodes as children
- **Batch Save**: Save multiple position changes

#### Canvas Interactions
**Viewing Features:**
- **Zoom In/Out**: Scale canvas view (0.3x to 2x)
- **Pan**: Move around large mind maps
- **Smooth Animations**: Transitions and transformations
- **Auto-connections**: Arrows showing relationships
- **Direction Indicators**: Arrowheads on connections

**Editing Features:**
- **Drag-and-Drop**: Reposition nodes freely
- **Right-click Menu**: Contextual operations
- **Node Selection**: View flashcard details
- **Color Picker**: Quick color changes
- **Unsaved Changes Indicator**: Visual feedback
- **Batch Save**: Efficient multi-node updates

**Visual Design:**
- **Colored Nodes**: Each node has customizable color
- **Connection Lines**: Colored arrows matching child nodes
- **Hover Effects**: Shadow enhancement on hover
- **Score Display**: Performance metrics on nodes
- **Learn Count**: Practice frequency on nodes
- **Responsive Layout**: Adapts to different screens

#### Mind Map Features
**Hierarchy Management:**
- Root nodes (no parent)
- Multi-level nesting
- Circular dependency prevention
- Orphan handling on deletion

**Flashcard Integration:**
- Browse collections
- Select flashcards to add
- View full flashcard data on node
- Score and practice data included

**Canvas Operations:**
- Mouse-based dragging
- Canvas panning
- Scroll wheel zoom (prepared)
- Keyboard shortcuts (prepared)
- Auto-save with indicator

### 3.7 User Profile Management

Features for user account management:
- View profile information
- Update user details
- Change password
- Manage preferences
- View account statistics

### 3.8 Settings

Configuration options:
- Application preferences
- Display settings
- Learning algorithm parameters
- Notification preferences
- Data management

---

## 4. User Interface Components

### 4.1 Layout Components

#### MainLayout
- **Sidebar Navigation**: Collapsible vertical menu
- **Header**: Horizontal navigation with user actions
- **Content Area**: Main application workspace
- **Responsive Design**: Adapts to screen sizes

#### Sidebar
Navigation menu with icons and labels:
- Dashboard (Collections)
- Mind Maps
- Analytics
- Reports
- Profile
- Settings
- Logout

#### Header
Top navigation bar:
- Application title/logo
- User information
- Quick actions
- Breadcrumbs

### 4.2 Common Components

#### Modal
Reusable modal dialogs:
- **ConfirmModal**: Confirmation dialogs with actions
- **AlertModal**: Information/success/error messages
- **Form Modals**: Input collection for various operations

#### Card
Styled container components:
- Consistent padding and shadows
- Hover effects
- Click handlers
- Icon support

#### ProtectedRoute
Authentication wrapper:
- Checks user authentication status
- Redirects to login if unauthenticated
- Preserves intended destination
- Nested route support

### 4.3 Page-Specific Components

#### Collection Page
- Collection tree view
- Expand/collapse controls
- Action buttons (Edit, Delete, Add Subfolder)
- Quick statistics (card count, subfolder count)
- Empty state messaging

#### FlashCard Edit Page
- Paginated card list
- Inline editing fields
- Add/Remove card buttons
- Bulk selection checkboxes
- Search bar
- Page size selector
- Save changes button

#### Learn Session Page
- Card display with flip animation
- Score buttons (-5 to +5)
- Progress indicator
- Session review screen
- Exit confirmation

#### Analytics Page
- Statistic cards
- Progress charts
- Distribution graphs
- Collection table
- Detail modals

#### Mind Map Canvas
- Draggable nodes
- Connection lines
- Zoom controls
- Color palette
- Node context menu
- Flashcard selector

---

## 5. Functionality Details

### 5.1 Collection Management Functions

#### Create Collection
**Process:**
1. User clicks "New Collection" button
2. Modal appears with form fields
3. User enters title and description
4. Optionally selects parent collection
5. System validates input
6. API creates collection
7. UI refreshes with new collection

**Validation:**
- Title is required
- Description is optional
- Parent ID must be valid (if provided)

#### Update Collection
**Process:**
1. User clicks edit button on collection
2. Modal pre-fills with current data
3. User modifies fields
4. System validates changes
5. API updates collection
6. UI reflects changes immediately

#### Delete Collection
**Process:**
1. User clicks delete button
2. Confirmation modal appears
3. User confirms action
4. System checks for flashcards and children
5. API deletes collection
6. Child collections handled (become orphans or deleted)
7. UI removes deleted collection

**Safety Features:**
- Confirmation required
- Warning about child collections
- Warning about flashcards
- Cannot be undone message

#### Navigate Hierarchy
**Process:**
1. User clicks expand/collapse icon
2. Animation shows/hides children
3. Icon rotates to indicate state
4. Children load on demand
5. Smooth transition effects

### 5.2 FlashCard Management Functions

#### Bulk Create/Update
**Process:**
1. User adds new cards with "Add Card" button
2. New empty card rows appear
3. User fills in term and definition
4. System marks cards as "new" or "modified"
5. User clicks "Save Changes"
6. System identifies changed cards
7. API processes all changes in single request
8. UI refreshes with saved cards

**Change Detection:**
- New cards marked with temporary IDs
- Modified cards tracked by comparison
- Only changed cards sent to API
- Optimistic UI updates

#### Search Cards
**Process:**
1. User types in search box
2. System debounces input
3. API filters cards by term or definition
4. Results replace current view
5. Pagination resets to page 1
6. Clear button restores full list

#### Flip Cards
**Process:**
1. User clicks flip button (single or all)
2. System swaps term and definition
3. Cards marked as modified
4. User can save or discard changes
5. Individual or bulk operation

#### Bulk Delete
**Process:**
1. User selects cards via checkboxes
2. "Delete Selected" button becomes active
3. User clicks delete button
4. Confirmation modal shows count
5. User confirms deletion
6. API deletes all selected cards
7. UI removes deleted cards
8. Selection cleared

### 5.3 Learning Session Functions

#### Start Session
**Process:**
1. User clicks "Learn" on collection
2. System requests session from API
3. API selects cards (low scores prioritized)
4. Cards are shuffled
5. First card displays (term side)
6. User studies the term

#### Study Card
**Process:**
1. Card shows term side
2. User recalls answer mentally
3. User clicks to flip card
4. Definition reveals with animation
5. User self-assesses knowledge
6. User clicks score button (-5 to +5)

#### Score Card
**Process:**
1. User clicks score button
2. System records score
3. Card's total modification updates
4. Last two scores tracked
5. If last two scores positive: mark as remembered
6. Slide-out animation plays
7. Next card appears

#### Loop Logic
**Process:**
1. Show all cards sequentially
2. After last card, check remaining cards
3. If cards remain un-remembered:
   - Shuffle remaining cards
   - Restart loop
4. If all remembered:
   - Show review screen

#### Session Review
**Process:**
1. Display all practiced cards
2. Show score modifications
3. Color-code by status (remembered/not)
4. Allow toggle for relearning
5. Options:
   - Continue learning (if cards remain)
   - End session
6. Submit scores to API

#### End Session
**Process:**
1. User chooses to end
2. System compiles score updates
3. API receives:
   - FlashCard IDs
   - Score modifications
   - Times learned
4. Backend updates card scores
5. User returns to collection view

### 5.4 Analytics Functions

#### Load User Analytics
**Process:**
1. Page loads
2. System requests user analytics from API
3. API aggregates data:
   - Collection counts
   - Card counts and scores
   - Learning progress metrics
   - Distribution calculations
   - Top collections
4. UI displays visualizations

#### View Collection Details
**Process:**
1. User clicks collection in table
2. Modal opens
3. System requests collection analytics
4. API provides:
   - Collection-specific metrics
   - Score distribution
   - Top/bottom performing cards
5. Modal displays detailed view

#### Refresh Analytics
**Process:**
1. User can trigger refresh
2. System re-requests all data
3. UI updates with latest statistics
4. Error handling for failed requests

### 5.5 Mind Map Functions

#### Create Mind Map
**Process:**
1. User clicks "Create New MindMap"
2. Modal appears
3. User enters name and description
4. System creates empty mind map
5. User redirected to canvas

#### Add Node
**Process:**
1. User clicks "Add Node"
2. Flashcard selector appears
3. User browses collections
4. User selects collection
5. Flashcards load
6. User selects flashcard
7. System creates node:
   - Links to flashcard
   - Assigns random position
   - Sets default color
   - No parent (root node)
8. Node appears on canvas

#### Drag Node
**Process:**
1. User presses mouse on node
2. System captures mouse offset
3. User moves mouse
4. Node follows cursor
5. Position updates in real-time
6. User releases mouse
7. System marks changes unsaved

#### Save Positions
**Process:**
1. User clicks "Save Changes"
2. System collects all nodes with changed positions
3. Batch update request to API
4. API updates all node positions
5. Success message appears
6. Changes marked as saved

#### Change Node Color
**Process:**
1. User right-clicks node
2. Context menu appears
3. Color palette displays
4. User selects color
5. Node color updates immediately
6. System marks changes unsaved

#### Add Child Node
**Process:**
1. User right-clicks parent node
2. Selects "Add Child Node"
3. Node selector appears
4. System filters available nodes:
   - Excludes self
   - Excludes descendants (prevent cycles)
   - Excludes current children
5. User selects node
6. System updates node's parent
7. Connection line appears
8. Hierarchy updates

#### Hide/Show Children
**Process:**
1. User right-clicks node
2. Selects "Hide/Show Children"
3. System toggles hideChildren property
4. Child nodes disappear/appear
5. Connection lines update
6. View refreshes

#### Delete Node
**Process:**
1. User right-clicks node
2. Selects "Delete Node"
3. Confirmation modal appears
4. User confirms
5. System:
   - Deletes node
   - Child nodes become orphans (no parent)
   - Connection lines update
6. Canvas refreshes

#### Pan and Zoom
**Process:**
- **Pan**: Click and drag on empty canvas
- **Zoom**: Click zoom buttons
  - Zoom in: Scale increases (up to 2x)
  - Zoom out: Scale decreases (down to 0.3x)
- All nodes and connections scale together
- Relative positions maintained

---

## 6. Data Models

### 6.1 User Model
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}
```

### 6.2 FlashCard Collection Model
```typescript
interface FlashCardCollection {
  id: number;
  userId: number;
  parentId: number | null;  // Null for root collections
  title: string;
  description: string;
  flashCardCount: number;   // Computed property
  childrenCount: number;     // Computed property
}
```

### 6.3 FlashCard Model
```typescript
interface FlashCard {
  id: number;
  term: string;
  definition: string;
  score: number;            // -5 to +5 range
  flashCardCollectionId: number;
}
```

### 6.4 Learn Session Model
```typescript
interface LearnSessionResponse {
  collectionId: number;
  count: number;
  flashCards: FlashCard[];
}

interface ScoreUpdate {
  flashCardId: number;
  scoreModification: number;
  TimesLearned: number;
}
```

### 6.5 Analytics Models
```typescript
interface OverviewStats {
  totalCollections: number;
  totalFlashCards: number;
  totalFlashCardsLearned: number;
  averageScore: number;
}

interface LearningProgress {
  cardsToReview: number;     // score < 3
  cardsMastered: number;      // score >= 3
  cardsInProgress: number;    // 0 < score < 3
  cardsNeedWork: number;      // score < 0
  completionRate: number;     // percentage
}

interface AverageScoreDistribution {
  scoreMinus5ToMinus3: number;
  scoreMinus3ToMinus1: number;
  scoreMinus1To1: number;
  score1To3: number;
  score3To5: number;
}

interface TopCollection {
  collectionId: number;
  collectionTitle: string;
  flashCardCount: number;
  cardsLearned: number;
  totalTimesLearned: number;
  averageScore: number;
  completionRate: number;
}

interface CollectionAnalytics {
  collectionId: number;
  collectionTitle: string;
  description: string;
  totalFlashCards: number;
  flashCardsLearned: number;
  averageScore: number;
  completionRate: number;
  averageScoreDistribution: AverageScoreDistribution;
  topPerformingCards: FlashCardDetail[];
  cardsNeedingReview: FlashCardDetail[];
}
```

### 6.6 Mind Map Models
```typescript
interface MindMap {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

interface MindMapNode {
  id: number;
  mindMapId: number;
  flashCardId: number;
  parentNodeId: number | null;
  positionX: number;
  positionY: number;
  color: string;
  hideChildren: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MindMapNodeWithFlashCard extends MindMapNode {
  flashCard: {
    id: number;
    term: string;
    definition: string;
    score: number;
    learnCount: number;
    flashCardCollectionId: number;
    collectionName: string;
  };
}

interface FullMindMapResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  nodes: MindMapNodeWithFlashCard[];
}
```

---

## 7. API Integration

### 7.1 API Client Configuration

**Base Configuration:**
```typescript
// Axios instance with base URL from environment
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor:**
- Adds JWT token to Authorization header
- Retrieves token from storage
- Applies to all authenticated requests

**Response Interceptor:**
- Handles token expiration
- Refreshes token automatically
- Retries failed requests
- Centralizes error handling

### 7.2 Authentication Service

**Endpoints:**
- `POST /auth/login`: User login
- `POST /auth/register`: User registration
- `GET /auth/me`: Get current user
- `POST /auth/refresh`: Refresh token

### 7.3 FlashCard Service

**Collection Endpoints:**
- `GET /FlashCardCollection/user/:userId`: Get user collections
- `POST /FlashCardCollection`: Create collection
- `PUT /FlashCardCollection/:id`: Update collection
- `DELETE /FlashCardCollection/:id`: Delete collection
- `GET /FlashCardCollection/:id`: Get single collection

**FlashCard Endpoints:**
- `GET /FlashCard/collection/:collectionId`: Get cards (paginated)
  - Query params: pageNumber, pageSize, searchText
- `POST /FlashCard/Bulk`: Bulk create/update cards
- `DELETE /FlashCard/Bulk`: Bulk delete cards

**Learn Session Endpoints:**
- `GET /LearnSession`: Get session cards
  - Query params: collectionId, count
- `PUT /LearnSession/scores`: Update scores

### 7.4 Analytics Service

**Endpoints:**
- `GET /analytics/:userId`: Get complete user analytics
- `GET /analytics/:userId/collection/:collectionId`: Get collection analytics
- `GET /analytics/:userId/overview`: Get overview stats
- `GET /analytics/:userId/progress`: Get learning progress

### 7.5 Mind Map Service

**Mind Map Endpoints:**
- `GET /mindmap`: Get all user mind maps
  - Query params: userId
- `GET /mindmap/:id`: Get mind map by ID
- `GET /mindmap/:id/full`: Get full mind map with nodes
- `POST /mindmap`: Create mind map
- `PUT /mindmap/:id`: Update mind map
- `DELETE /mindmap/:id`: Delete mind map

**Node Endpoints:**
- `GET /mindmap/nodes/:nodeId`: Get node by ID
- `POST /mindmap/:mindMapId/nodes`: Create node
- `PUT /mindmap/nodes/:nodeId`: Update node
- `DELETE /mindmap/nodes/:nodeId`: Delete node

---

## 8. User Workflows

### 8.1 New User Onboarding

1. **Registration**
   - Navigate to registration page
   - Enter username, email, password
   - Submit registration form
   - Receive JWT token
   - Automatically logged in

2. **First Collection**
   - Land on empty dashboard
   - Click "Create Collection"
   - Enter collection details
   - Create first collection

3. **Add FlashCards**
   - Click "Edit Cards" on collection
   - Click "Add Card" multiple times
   - Fill in terms and definitions
   - Click "Save Changes"

4. **First Learn Session**
   - Return to collections
   - Click "Learn" on collection
   - Study first flashcard
   - Rate knowledge with scores
   - Complete session

### 8.2 Regular Study Session

1. **Login**
   - Enter credentials
   - System retrieves user data
   - Navigate to dashboard

2. **Review Analytics**
   - Check analytics page
   - Identify collections needing work
   - View score distributions
   - Note cards to review

3. **Targeted Learning**
   - Select collection with low scores
   - Start learn session
   - Practice until mastery
   - Review session results
   - Submit scores

4. **Progress Tracking**
   - Return to analytics
   - Verify score improvements
   - Check completion rates
   - Plan next study session

### 8.3 Content Organization

1. **Create Hierarchy**
   - Create main topic collection
   - Add subtopic collections
   - Nest related concepts
   - Build knowledge tree

2. **Populate Collections**
   - Add cards to specific collections
   - Use bulk creation for efficiency
   - Search and organize cards
   - Cross-reference related topics

3. **Maintain Collections**
   - Periodically review and edit
   - Remove outdated cards
   - Update definitions
   - Reorganize hierarchy as needed

### 8.4 Visual Learning with Mind Maps

1. **Create Mind Map**
   - Navigate to Mind Maps
   - Click "Create New MindMap"
   - Name and describe mind map
   - Open canvas

2. **Build Knowledge Graph**
   - Add root concept nodes
   - Connect related concepts
   - Arrange spatially
   - Color-code by category

3. **Refine Visualization**
   - Drag nodes to optimal positions
   - Adjust colors for clarity
   - Hide/show branches as needed
   - Save layout

4. **Study from Mind Map**
   - Navigate hierarchy visually
   - Click nodes to review flashcards
   - Follow connections between concepts
   - Understand relationships

---

## 9. Analytics and Reporting

### 9.1 Metrics Collected

#### Performance Metrics
- **Individual Card Scores**: -5 to +5 range
- **Average Scores**: By collection and overall
- **Score Modifications**: Changes over time
- **Learn Count**: Practice frequency per card
- **Completion Rate**: Percentage of mastered cards

#### Usage Metrics
- **Total Collections**: Count of all collections
- **Total FlashCards**: Across all collections
- **Cards Learned**: Cards with at least one practice session
- **Session Frequency**: Not directly tracked (future enhancement)

#### Progress Metrics
- **Cards to Review**: Below mastery threshold
- **Cards Mastered**: Above mastery threshold
- **Cards in Progress**: Moderate performance
- **Cards Need Work**: Poor performance

### 9.2 Visualization Types

#### Overview Cards
- Large number displays
- Icon representations
- Color-coded by category
- Quick glance statistics

#### Progress Bars
- Completion rate visualization
- Color-coded performance levels
- Percentage displays
- Animated transitions

#### Distribution Bars
- Horizontal bar charts
- Score range breakdowns
- Relative size comparison
- Count and percentage labels

#### Data Tables
- Sortable columns (prepared)
- Clickable rows for details
- Multiple data points per row
- Responsive design

### 9.3 Insights Generated

#### Learning Efficiency
- Identify struggling areas (low scores)
- Find mastered content (high scores)
- Track improvement over time
- Optimize study priorities

#### Content Quality
- Top performing cards indicate good content
- Struggling cards may need revision
- Balance assessment across collections
- Identify gaps in knowledge

#### Study Patterns
- Collections with high engagement
- Cards practiced most frequently
- Progress rate analysis
- Learning velocity (prepared)

---

## 10. Technical Implementation

### 10.1 State Management

#### Global State (Zustand)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

**Usage:**
- Authentication status
- User profile data
- JWT token storage
- Login/logout actions

#### Local Component State
- Page-specific data
- Form inputs
- UI state (modals, loading, errors)
- Temporary selections

**Patterns:**
```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### 10.2 Routing Configuration

**Route Structure:**
```typescript
<Router>
  <Routes>
    // Public routes
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    // Protected routes
    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" />} />
      <Route path="dashboard" element={<CollectionPage />} />
      <Route path="flashcards/:collectionId" element={<FlashCardEditPage />} />
      <Route path="learn/:collectionId" element={<FlashCardLearnSession />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="mindmap" element={<MindMapListPage />} />
      <Route path="mindmap/:id" element={<MindMapCanvasPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="reports" element={<ReportsPage />} />
    </Route>
    
    // Fallback
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
</Router>
```

### 10.3 Authentication Flow

#### Login Process
1. User submits credentials
2. API validates and returns JWT
3. Token stored in local storage
4. User object stored in Zustand
5. API client configures Authorization header
6. Redirect to dashboard

#### Protected Route Logic
```typescript
if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}
return children;
```

#### Token Refresh
- Interceptor catches 401 errors
- Attempts token refresh
- Updates stored token
- Retries original request
- Logs out if refresh fails

### 10.4 Error Handling

#### API Errors
```typescript
try {
  const response = await apiCall();
  setData(response.data);
  setError(null);
} catch (err) {
  const error = err as { response?: { data?: { message?: string } } };
  setError(error.response?.data?.message || 'Operation failed');
}
```

#### UI Error Display
- Toast notifications (prepared)
- Inline error messages
- Modal error dialogs
- Form validation errors

### 10.5 Performance Optimizations

#### Pagination
- Reduces data transfer
- Improves load times
- Configurable page sizes
- Server-side pagination

#### Lazy Loading
- React.lazy for code splitting (prepared)
- Suspense boundaries (prepared)
- Route-based splitting

#### Memoization
- React.memo for expensive components (prepared)
- useMemo for computed values (prepared)
- useCallback for stable functions (prepared)

#### Debouncing
- Search input debouncing (prepared)
- Reduced API calls
- Better user experience

### 10.6 Styling Approach

#### Tailwind CSS Utility Classes
- Rapid development
- Consistent design system
- Responsive utilities
- State variants (hover, focus, active)

#### Component Styles
```typescript
className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
```

#### Responsive Design
- Mobile-first approach
- Breakpoint utilities (sm, md, lg, xl)
- Flexible layouts
- Touch-friendly interfaces

### 10.7 Build and Deployment

#### Development
```bash
npm run dev
```
- Vite dev server
- Hot module replacement
- Fast refresh

#### Production Build
```bash
npm run build
```
- TypeScript compilation
- Bundle optimization
- Asset minification
- Output to `dist/`

#### Preview
```bash
npm run preview
```
- Test production build locally
- Verify optimizations

---

## 11. Future Enhancements

### 11.1 Planned Features
- **Spaced Repetition Algorithm**: Advanced scheduling
- **Collaborative Collections**: Share with other users
- **Import/Export**: CSV, JSON, Anki formats
- **Multimedia Cards**: Images, audio, video
- **Gamification**: Achievements, streaks, leaderboards
- **Mobile App**: Native iOS and Android
- **Offline Mode**: Service worker PWA
- **Study Reminders**: Notification system
- **Custom Themes**: Dark mode, color schemes

### 11.2 Technical Improvements
- **WebSocket Integration**: Real-time updates
- **GraphQL API**: Flexible data fetching
- **Optimistic Updates**: Instant UI feedback
- **Infinite Scroll**: Alternative to pagination
- **Virtual Scrolling**: Handle massive lists
- **Advanced Caching**: Redux or React Query
- **Comprehensive Testing**: Unit, integration, E2E
- **CI/CD Pipeline**: Automated deployment
- **Monitoring**: Error tracking, analytics
- **Accessibility**: WCAG compliance

---

## 12. Conclusion

This FlashCard Learning Management System represents a comprehensive solution for modern learners, combining proven learning science with intuitive user experience and powerful analytics. The application's architecture supports scalability, maintainability, and future enhancements while delivering immediate value through its core features.

### Key Strengths
1. **Adaptive Learning**: Score-based system optimizes study time
2. **Hierarchical Organization**: Flexible knowledge structuring
3. **Visual Learning**: Mind maps for spatial understanding
4. **Data-Driven**: Comprehensive analytics guide decisions
5. **Modern Stack**: Built with latest technologies
6. **Type Safety**: TypeScript prevents errors
7. **Responsive Design**: Works on all devices
8. **Extensible**: Clean architecture for growth

### Use Cases for Thesis
- **Educational Technology**: Modern e-learning platform
- **Learning Science**: Implementation of spaced repetition
- **Data Visualization**: Analytics and progress tracking
- **User Experience**: Intuitive interface design
- **Software Engineering**: Full-stack web application
- **Database Design**: Relational data modeling
- **API Design**: RESTful architecture

This documentation provides a comprehensive overview suitable for academic reporting, technical documentation, and future development planning.

---

## Appendix A: Glossary

- **FlashCard**: Digital card with term and definition
- **Collection**: Folder containing flashcards
- **Score**: Performance metric from -5 to +5
- **Learn Session**: Study session with multiple cards
- **Mind Map**: Visual graph of connected concepts
- **Node**: Single concept in mind map
- **Spaced Repetition**: Learning technique with timed reviews
- **Adaptive Learning**: System adjusts to performance
- **Hierarchical**: Tree-like nested structure
- **Bulk Operation**: Action on multiple items
- **JWT**: JSON Web Token for authentication
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **SPA**: Single Page Application

## Appendix B: API Reference Summary

All endpoints use base URL: `${VITE_API_URL}`

**Authentication:**
- POST /auth/login
- POST /auth/register
- GET /auth/me
- POST /auth/refresh

**Collections:**
- GET /FlashCardCollection/user/:userId
- POST /FlashCardCollection
- PUT /FlashCardCollection/:id
- DELETE /FlashCardCollection/:id

**FlashCards:**
- GET /FlashCard/collection/:collectionId
- POST /FlashCard/Bulk
- DELETE /FlashCard/Bulk

**Learning:**
- GET /LearnSession
- PUT /LearnSession/scores

**Analytics:**
- GET /analytics/:userId
- GET /analytics/:userId/collection/:collectionId

**Mind Maps:**
- GET /mindmap
- POST /mindmap
- PUT /mindmap/:id
- DELETE /mindmap/:id
- GET /mindmap/:id/full
- POST /mindmap/:mindMapId/nodes
- PUT /mindmap/nodes/:nodeId
- DELETE /mindmap/nodes/:nodeId

## Appendix C: Environment Configuration

Create `.env` file:
```
VITE_API_URL=http://localhost:3000/api
```

For production:
```
VITE_API_URL=https://api.yourdomain.com/api
```

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Author**: [Your Name]  
**Project**: FlashCard Learning Management System  
**Purpose**: Graduation Thesis Documentation
