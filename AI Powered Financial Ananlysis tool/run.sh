#!/bin/bash
source venv/bin/activate

# Kill any existing processes on ports 8000 (FastAPI) and 8501 (Streamlit)
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8501 | xargs kill -9 2>/dev/null

echo "Starting Backend..."
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend..."
streamlit run frontend/app.py &
FRONTEND_PID=$!

echo "App is running!"
echo "Backend: http://127.0.0.1:8000"
echo "Frontend: http://localhost:8501"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

##
