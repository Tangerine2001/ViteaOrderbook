# ViteaOrderbook

A full-stack application for managing an orderbook system where users can place bids and asks for items, with automatic trade matching.

## Features

- **Item Management**: Create and view items available for trading
- **User Management**: Create and manage user accounts
- **Order Placement**: Place bid and ask orders for items
- **Order Cancellation**: Delete existing orders from the orderbook
- **Automatic Trade Matching**: Orders are automatically matched when possible
- **Trade History**: View the history of executed trades
- **Real-time Market Price**: Calculate and display the current market price based on order book
- **Trade Statistics**: View statistics about trades for each item

## Project Structure

```
ViteaOrderbook/
├── main.py              # FastAPI application entry point
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── database.py          # Database connection and session management
├── docs/                # Project documentation
│   └── design_document.md  # Detailed design specifications
├── tests/               # Backend tests
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utility functions and interfaces
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── requirements.txt         # Backend dependencies
├── dev_requirements.txt     # Development dependencies
└── Makefile                 # Commands for running the application
```

## Installation

### Backend

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ViteaOrderbook.git
   cd ViteaOrderbook
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Running the Backend

Start the FastAPI server:
```
make run
```
Or manually:
```
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000

### Running Tests

Run backend tests:
```
make test
```

## API Endpoints

- `GET /items/`: Get all items
- `POST /items/`: Create a new item
- `GET /users/`: Get all users
- `POST /users/`: Create a new user
- `GET /orders/?item_id=<id>`: Get all orders for an item
- `POST /orders/`: Create a new order
- `POST /orders/delete/`: Delete an existing order
- `GET /trades/?item_id=<id>`: Get all trades for an item
