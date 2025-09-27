# ViteaOrderbook Design Document

## 1. Goals and Out-of-Scope Areas

### Goals
- Create a full-stack application for managing an orderbook system
- Allow users to place bid and ask orders for items
- Implement automatic trade matching when compatible orders exist
- Provide real-time market price calculation based on the orderbook
- Display trade history and statistics for each item
- Create a responsive and intuitive user interface

### Out-of-Scope Areas
- User authentication and authorization
- Payment processing
- Advanced order types (limit orders, stop orders, etc.)
- Order cancellation or modification
- User portfolios or balances
- Historical data analysis or charting
- High-frequency trading capabilities
- Regulatory compliance features

## 2. Assumptions Made

- The application will be used in a trusted environment where user authentication is not required
- Users will have basic knowledge of trading concepts (bids, asks, market price)
- The system will handle a moderate volume of orders and trades
- The application will run on a single server with a single database
- Real-time updates are not critical; users can refresh to see the latest data
- The database will be SQLite for simplicity, but could be migrated to a more robust solution if needed
- The frontend and backend will be deployed separately
- The application will be accessed primarily from desktop browsers

## 3. Architecture Diagram

```
┌─────────────────┐     HTTP     ┌─────────────────┐     SQL      ┌──────────────────┐
│                 │    Requests  │                 │    Queries   │                  │
│  React Frontend │ ────────────►│ FastAPI Backend │ ────────────►│  SQLite Database │
│  (Next.js)      │ ◄────────────│                 │ ◄────────────│                  │
│                 │     JSON     │                 │     Data     │                  │
└─────────────────┘   Responses  └─────────────────┘              └──────────────────┘
```

### Frontend Architecture
- Next.js React application
- Component-based UI structure
- Client-side state management with React hooks
- HTTP requests to backend API using fetch
- Responsive design with Tailwind CSS

### Backend Architecture
- FastAPI Python application
- RESTful API endpoints
- SQLAlchemy ORM for database interactions
- Pydantic models for request/response validation
- Business logic for order matching and trade execution

### Data Flow
1. User interacts with the frontend UI
2. Frontend makes HTTP requests to the backend API
3. Backend processes requests, interacts with the database, and executes business logic
4. Backend returns JSON responses to the frontend
5. Frontend updates the UI based on the responses

## 4. Data Model

### Entity-Relationship Diagram
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  ItemOrder  │       │    Item     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │◄──────┤ user_id (FK)│       │ name        │
└─────────────┘       │ item_id (FK)├──────►│ description │
      ▲  ▲            │ type        │       └─────────────┘
      │  │            │ price       │             ▲
      │  │            └─────────────┘             │
      │  │                                        │
      │  │            ┌─────────────┐             │
      │  └────────────┤ buyer_id(FK)│             │
      │               │             │             │
      └───────────────┤ seller_id(FK)             │
                      │ Trade       │             │
                      ├─────────────┤             │
                      │ id (PK)     │             │
                      │ item_id (FK)├─────────────┘
                      │ price       │
                      └─────────────┘
```

### Schema with Relationships and Constraints

#### User
- **id**: Integer, Primary Key, Auto-increment
- **name**: String, Unique, Not Null
- **Relationships**:
  - One-to-Many with ItemOrder (as user)
  - One-to-Many with Trade (as buyer)
  - One-to-Many with Trade (as seller)

#### Item
- **id**: Integer, Primary Key, Auto-increment
- **name**: String, Not Null
- **description**: String, Nullable
- **Relationships**:
  - One-to-Many with ItemOrder
  - One-to-Many with Trade

#### ItemOrder
- **id**: Integer, Primary Key, Auto-increment
- **type**: Enum(OrderType), Not Null
- **price**: Float, Not Null
- **item_id**: Integer, Foreign Key (Item.id), Not Null
- **user_id**: Integer, Foreign Key (User.id), Not Null
- **Relationships**:
  - Many-to-One with Item
  - Many-to-One with User

#### Trade
- **id**: Integer, Primary Key, Auto-increment
- **buyer_id**: Integer, Foreign Key (User.id), Not Null
- **seller_id**: Integer, Foreign Key (User.id), Not Null
- **item_id**: Integer, Foreign Key (Item.id), Not Null
- **price**: Float, Not Null
- **Relationships**:
  - Many-to-One with Item
  - Many-to-One with User (as buyer)
  - Many-to-One with User (as seller)

### Constraints
- User names must be unique
- Trade prices must be positive
- Orders must be associated with existing users and items
- Trades must be associated with existing users and items
