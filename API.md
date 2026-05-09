# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
No authentication required for local development. For production, consider implementing API key authentication.

---

## Endpoints

### 1. Analyze Stock
Perform AI-powered analysis on a stock with technical indicators.

**Endpoint:** `POST /analyze`

**Request Body:**
```json
{
  "ticker": "RELIANCE.NS",
  "analysis_type": "technical",
  "indicators": ["RSI", "MACD", "SMA", "Bollinger Bands"],
  "comparison_ticker": null
}
```

**Parameters:**
- `ticker` (string, required): Stock ticker symbol (e.g., "RELIANCE.NS", "AAPL")
- `analysis_type` (string, required): Type of analysis
  - `"technical"`: Technical analysis with indicators
  - `"fundamental"`: Fundamental analysis with financials
  - `"news"`: News-based analysis
  - `"comparison"`: Compare two stocks (requires `comparison_ticker`)
- `indicators` (array, optional): List of technical indicators to include
  - Available: `"RSI"`, `"MACD"`, `"SMA"`, `"EMA"`, `"Bollinger Bands"`, `"ATR"`, `"Stochastic"`
  - Default: All indicators
- `comparison_ticker` (string, optional): Second stock for comparison mode

**Response:**
```json
{
  "success": true,
  "analysis": "# AI Analysis\n\n**Executive Summary**: BULLISH\n\n...",
  "data": {
    "ticker": "RELIANCE.NS",
    "current_price": 2456.75,
    "market_cap": 16500000000000,
    "pe_ratio": 28.5,
    "technical": {
      "rsi": 65.2,
      "sma_50": 2400.5,
      "macd": 12.5
    }
  },
  "quota_info": {
    "requests_made": 5,
    "daily_limit": 20,
    "remaining": 15
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Stock not found",
  "details": "Could not fetch data for ticker XYZ"
}
```

---

### 2. Quick Details
Get rapid stock information without AI analysis.

**Endpoint:** `GET /quick-details/{ticker}`

**Parameters:**
- `ticker` (string, path): Stock ticker symbol

**Example:**
```
GET /quick-details/RELIANCE.NS
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticker": "RELIANCE.NS",
    "current_price": 2456.75,
    "market_cap": 16500000000000,
    "pe_ratio": 28.5,
    "beta": 1.2,
    "fifty_two_week_high": 2650.0,
    "fifty_two_week_low": 2100.0,
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "currency": "INR"
  }
}
```

---

### 3. Search Stocks
Search for NSE/BSE stocks by name or symbol.

**Endpoint:** `GET /search-stocks`

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (int, optional): Maximum results (default: 10)

**Example:**
```
GET /search-stocks?q=reliance&limit=5
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "NSE_Symbol": "RELIANCE",
      "Company_Name": "Reliance Industries Limited",
      "Yahoo_Symbol": "RELIANCE.NS"
    },
    {
      "NSE_Symbol": "RELIANCEIND",
      "Company_Name": "Reliance Industrial Infrastructure Limited",
      "Yahoo_Symbol": "RELIANCEIND.NS"
    }
  ],
  "count": 2
}
```

---

### 4. Quota Status
Check Gemini API usage and remaining quota.

**Endpoint:** `GET /quota-status`

**Response:**
```json
{
  "success": true,
  "quota": {
    "requests_made": 5,
    "daily_limit": 20,
    "remaining": 15,
    "percentage_used": 25.0,
    "is_quota_exceeded": false,
    "date": "2024-12-10"
  }
}
```

---

### 5. Health Check
Verify backend service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-10T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Stock/endpoint not found |
| 429 | Too Many Requests - Quota exceeded |
| 500 | Internal Server Error |

## Rate Limits

- **Gemini API**: 20 requests/day (free tier)
- **Yahoo Finance**: No explicit limits, but be respectful
- **NSE API**: Cached, no real-time limits

## Best Practices

1. **Cache Results**: Store analysis results to avoid redundant API calls
2. **Use Quick Details**: For rapid lookups without AI, use `/quick-details`
3. **Monitor Quota**: Check `/quota-status` before analysis
4. **Handle Errors**: Implement retry logic with exponential backoff
5. **Validate Input**: Always validate ticker symbols before sending

## Examples

### Python Example
```python
import requests

# Analyze a stock
response = requests.post("http://localhost:8000/analyze", json={
    "ticker": "RELIANCE.NS",
    "analysis_type": "technical",
    "indicators": ["RSI", "MACD", "SMA"]
})

data = response.json()
print(data["analysis"])
```

### cURL Example
```bash
# Quick details
curl http://localhost:8000/quick-details/RELIANCE.NS

# Search stocks
curl "http://localhost:8000/search-stocks?q=tcs&limit=5"

# Check quota
curl http://localhost:8000/quota-status
```

### JavaScript Example
```javascript
// Analyze stock
fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticker: 'AAPL',
    analysis_type: 'technical',
    indicators: ['RSI', 'MACD']
  })
})
.then(res => res.json())
.then(data => console.log(data.analysis));
```

---

## Interactive Documentation

For interactive API exploration, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

*Last updated: 2024*
