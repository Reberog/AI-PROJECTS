from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from .services import (
    get_stock_data, analyze_stock, lookup_ticker, 
    fetch_all_nse_stocks, search_nse_stocks, get_nifty50_stocks, enhanced_lookup_ticker,
    get_financial_statements, get_quota_status
)

app = FastAPI(title="Financial Analysis Tool")

from typing import Optional, List

class StockRequest(BaseModel):
    query: str
    comparison_query: Optional[str] = None
    indicators: Optional[List[str]] = ["RSI", "MACD", "SMA", "Bollinger Bands", "EMA", "ATR", "Stochastic"]

class StockResponse(BaseModel):
    ticker: str
    data: dict
    comparison_ticker: Optional[str] = None
    comparison_data: Optional[dict] = None
    analysis: str

class NSESearchResponse(BaseModel):
    matches: List[dict]
    total_found: int

@app.get("/nse/stocks")
async def get_all_nse_stocks():
    """Get complete list of NSE stocks"""
    try:
        nse_stocks = fetch_all_nse_stocks()
        return {
            "total_stocks": len(nse_stocks),
            "stocks": nse_stocks.to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NSE stocks: {str(e)}")

@app.get("/nse/search", response_model=NSESearchResponse)
async def search_nse_stocks_endpoint(
    query: str = Query(..., description="Search term for company name or symbol"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results")
):
    """Search NSE stocks by company name or symbol"""
    try:
        matches = search_nse_stocks(query, limit)
        return {
            "matches": matches,
            "total_found": len(matches)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching NSE stocks: {str(e)}")

@app.get("/nse/nifty50")
async def get_nifty50():
    """Get NIFTY 50 stocks list"""
    try:
        nifty50 = get_nifty50_stocks()
        return {
            "total_stocks": len(nifty50),
            "stocks": nifty50
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NIFTY 50: {str(e)}")

@app.post("/analyze", response_model=StockResponse)
async def analyze_endpoint(request: StockRequest):
    # 1. Resolve Primary Ticker (now using enhanced lookup)
    ticker = enhanced_lookup_ticker(request.query)
    data = get_stock_data(ticker)
    if not data:
        raise HTTPException(status_code=404, detail=f"Could not fetch data for query '{request.query}' (Resolved to: {ticker})")
    
    # 2. Resolve Comparison Ticker (if provided)
    comparison_ticker = None
    comparison_data = None
    if request.comparison_query:
        comparison_ticker = enhanced_lookup_ticker(request.comparison_query)
        comparison_data = get_stock_data(comparison_ticker)
        # Note: We don't fail hard if comparison fails, we just proceed without it or could warn.
        # For now, if comparison data fails, we just treat it as no comparison.
    
    # 3. Analyze
    analysis = analyze_stock(data, comparison_data, request.indicators)
    
    return {
        "ticker": ticker, 
        "data": data, 
        "comparison_ticker": comparison_ticker,
        "comparison_data": comparison_data,
        "analysis": analysis
    }

@app.get("/financial-statements/{ticker}")
async def get_financial_statements_endpoint(ticker: str):
    """
    Get financial statements for a given ticker.
    Returns Income Statement, Balance Sheet, Cash Flow Statement, and key metrics.
    """
    try:
        # Convert ticker if needed
        if not ('.' in ticker):
            # If no exchange specified, try to find the best match
            ticker = enhanced_lookup_ticker(ticker)
        
        financial_data = get_financial_statements(ticker)
        
        if "error" in financial_data:
            raise HTTPException(status_code=404, detail=financial_data["error"])
        
        return financial_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching financial statements: {str(e)}")

@app.get("/quota-status")
async def get_gemini_quota_status():
    """
    Get the current Gemini API quota status.
    """
    try:
        quota_info = get_quota_status()
        return quota_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quota status: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Financial Analysis API is running"}
