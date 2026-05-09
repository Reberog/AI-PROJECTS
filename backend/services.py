import yfinance as yf
import google.generativeai as genai
import pandas as pd
import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Cache for NSE stocks list
_nse_stocks_cache = None

def fetch_all_nse_stocks():
    """
    Fetch complete list of NSE stocks from official NSE data source.
    Returns DataFrame with NSE_Symbol, Company_Name, and Yahoo_Symbol columns.
    """
    global _nse_stocks_cache
    
    # Return cached data if available
    if _nse_stocks_cache is not None:
        return _nse_stocks_cache
    
    try:
        print("Fetching NSE stocks list from official source...")
        # NSE official equity list URL
        url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        
        # Read the CSV directly into pandas
        df = pd.read_csv(url)
        
        # Clean and format the data
        df['YAHOO_SYMBOL'] = df['SYMBOL'] + '.NS'
        
        # Select relevant columns
        nse_stocks = df[['SYMBOL', 'NAME OF COMPANY', 'YAHOO_SYMBOL']].copy()
        nse_stocks.columns = ['NSE_Symbol', 'Company_Name', 'Yahoo_Symbol']
        
        # Cache the result
        _nse_stocks_cache = nse_stocks
        
        print(f"✅ Loaded {len(nse_stocks)} NSE stocks")
        return nse_stocks
        
    except Exception as e:
        print(f"❌ Error fetching NSE stocks: {e}")
        return pd.DataFrame(columns=['NSE_Symbol', 'Company_Name', 'Yahoo_Symbol'])

def search_nse_stocks(query: str, limit: int = 10):
    """
    Search for NSE stocks by company name or symbol.
    Returns list of matching stocks with their details.
    """
    nse_stocks = fetch_all_nse_stocks()
    
    if nse_stocks.empty:
        return []
    
    # Convert query to lowercase for case-insensitive search
    query_lower = query.lower()
    
    # Search in both symbol and company name
    mask = (
        nse_stocks['NSE_Symbol'].str.lower().str.contains(query_lower, na=False) |
        nse_stocks['Company_Name'].str.lower().str.contains(query_lower, na=False)
    )
    
    matches = nse_stocks[mask].head(limit)
    
    return matches.to_dict('records')

def get_nifty50_stocks():
    """
    Returns NIFTY 50 stocks list (most actively traded).
    """
    nifty50_symbols = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
        'ICICIBANK.NS', 'HDFC.NS', 'KOTAKBANK.NS', 'BHARTIARTL.NS', 'ITC.NS',
        'SBIN.NS', 'BAJFINANCE.NS', 'LICI.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
        'TITAN.NS', 'AXISBANK.NS', 'NESTLEIND.NS', 'ULTRACEMCO.NS', 'DMART.NS',
        'BAJAJFINSV.NS', 'WIPRO.NS', 'ADANIENT.NS', 'ONGC.NS', 'TATAMOTORS.NS',
        'HCLTECH.NS', 'SUNPHARMA.NS', 'POWERGRID.NS', 'M&M.NS', 'NTPC.NS',
        'TECHM.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'INDUSINDBK.NS', 'TATASTEEL.NS',
        'GRASIM.NS', 'JSWSTEEL.NS', 'SBILIFE.NS', 'DIVISLAB.NS', 'BRITANNIA.NS',
        'APOLLOHOSP.NS', 'CIPLA.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 'HINDALCO.NS',
        'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'BPCL.NS', 'TRENT.NS', 'HDFCLIFE.NS'
    ]
    
    return [{'symbol': symbol, 'name': symbol.replace('.NS', '')} for symbol in nifty50_symbols]

def lookup_ticker(query: str) -> str:
    """
    Searches for a stock ticker based on a query string (company name).
    Prioritizes Indian stocks (NSE/BSE).
    """
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if 'quotes' in data and len(data['quotes']) > 0:
            quotes = data['quotes']
            
            # 1. Look for exact NSE match (.NS)
            for quote in quotes:
                symbol = quote.get('symbol', '')
                if symbol.endswith('.NS'):
                    return symbol
            
            # 2. Look for exact BSE match (.BO)
            for quote in quotes:
                symbol = quote.get('symbol', '')
                if symbol.endswith('.BO'):
                    return symbol
            
            # 3. Fallback to the first equity result
            for quote in quotes:
                if quote.get('quoteType') == 'EQUITY':
                    return quote.get('symbol')
                    
            # 4. Ultimate fallback
            return quotes[0].get('symbol')
            
    except Exception as e:
        print(f"Error looking up ticker: {e}")
    
    return query # Return original query if lookup fails

def enhanced_lookup_ticker(query: str) -> str:
    """
    Enhanced ticker lookup that first searches NSE stocks database,
    then falls back to Yahoo Finance search API.
    """
    print(f"🔍 ENHANCED LOOKUP: Received query = '{query}'")
    
    nse_stocks = fetch_all_nse_stocks()
    
    if not nse_stocks.empty:
        # First, try EXACT symbol match (case-insensitive)
        query_upper = query.upper()
        exact_match = nse_stocks[nse_stocks['NSE_Symbol'].str.upper() == query_upper]
        
        if not exact_match.empty:
            result = exact_match.iloc[0]
            yahoo_symbol = result['Yahoo_Symbol']
            company_name = result['Company_Name']
            print(f"✅ Found EXACT NSE match: {yahoo_symbol} - {company_name}")
            print(f"🎯 RETURNING: {yahoo_symbol}")
            return yahoo_symbol
        
        # Second, try searching for partial matches
        print(f"⚠️ No exact match, trying partial search...")
        nse_matches = search_nse_stocks(query, limit=1)
        
        if nse_matches:
            yahoo_symbol = nse_matches[0]['Yahoo_Symbol']
            company_name = nse_matches[0]['Company_Name']
            print(f"✅ Found partial NSE match: {yahoo_symbol} - {company_name}")
            print(f"🎯 RETURNING: {yahoo_symbol}")
            return yahoo_symbol
    
    # Fallback to original Yahoo Finance search
    print(f"🔍 No NSE match found, trying Yahoo Finance search...")
    result = lookup_ticker(query)
    print(f"🎯 RETURNING from Yahoo: {result}")
    return result

def get_stock_data(ticker: str):
    """
    Fetches stock data from yfinance and calculates technical indicators.
    """
    try:
        stock = yf.Ticker(ticker)
        
        # Get history for price (fetch 1 year to ensure enough data for 200 SMA)
        history = stock.history(period="1y")
        if history.empty:
            return None
        
        # Get info first for reliable current price
        info = stock.info
        
        # Try multiple sources for current price (in order of preference)
        current_price = None
        
        # 1. Try currentPrice or regularMarketPrice from info (most reliable for current price)
        if info.get('currentPrice'):
            current_price = float(info.get('currentPrice'))
        elif info.get('regularMarketPrice'):
            current_price = float(info.get('regularMarketPrice'))
        # 2. Try last valid Close from history (skip NaN values)
        elif not history['Close'].dropna().empty:
            current_price = float(history['Close'].dropna().iloc[-1])
        # 3. Try previousClose from info as last resort
        elif info.get('previousClose'):
            current_price = float(info.get('previousClose'))
        else:
            current_price = "N/A"
        
        # --- Technical Indicators ---
        # Clean the Close data by removing NaN values for accurate calculations
        close_clean = history['Close'].dropna()
        
        # Helper function to safely extract values
        def safe_float(value):
            if pd.isna(value):
                return "N/A"
            try:
                return float(value)
            except (ValueError, TypeError):
                return "N/A"
        
        # Helper to get last valid value from a series
        def get_last_valid(series):
            valid_values = series.dropna()
            if valid_values.empty:
                return "N/A"
            return safe_float(valid_values.iloc[-1])
        
        # 1. SMA (Simple Moving Average)
        history['SMA_50'] = history['Close'].rolling(window=50).mean()
        history['SMA_200'] = history['Close'].rolling(window=200).mean()
        
        sma_50 = get_last_valid(history['SMA_50']) if len(close_clean) >= 50 else "N/A"
        sma_200 = get_last_valid(history['SMA_200']) if len(close_clean) >= 200 else "N/A"
        
        # 2. RSI (Relative Strength Index) - 14 periods
        delta = history['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        history['RSI'] = 100 - (100 / (1 + rs))
        rsi = get_last_valid(history['RSI']) if len(close_clean) >= 14 else "N/A"
        
        # 3. MACD (12, 26, 9)
        exp1 = history['Close'].ewm(span=12, adjust=False).mean()
        exp2 = history['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        macd_val = get_last_valid(macd) if len(close_clean) >= 26 else "N/A"
        signal_val = get_last_valid(signal) if len(close_clean) >= 26 else "N/A"
        
        # 4. Bollinger Bands (20, 2)
        history['SMA_20'] = history['Close'].rolling(window=20).mean()
        history['STD_20'] = history['Close'].rolling(window=20).std()
        history['BB_Upper'] = history['SMA_20'] + (history['STD_20'] * 2)
        history['BB_Lower'] = history['SMA_20'] - (history['STD_20'] * 2)
        
        bb_upper = get_last_valid(history['BB_Upper']) if len(close_clean) >= 20 else "N/A"
        bb_lower = get_last_valid(history['BB_Lower']) if len(close_clean) >= 20 else "N/A"
        
        # 5. EMA (Exponential Moving Average) - 50 periods
        history['EMA_50'] = history['Close'].ewm(span=50, adjust=False).mean()
        ema_50 = get_last_valid(history['EMA_50']) if len(close_clean) >= 50 else "N/A"

        # 6. ATR (Average True Range) - 14 periods
        high_low = history['High'] - history['Low']
        high_close = (history['High'] - history['Close'].shift()).abs()
        low_close = (history['Low'] - history['Close'].shift()).abs()
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        history['ATR'] = true_range.rolling(window=14).mean()
        atr = get_last_valid(history['ATR']) if len(close_clean) >= 14 else "N/A"

        # 7. Stochastic Oscillator (14, 3, 3)
        low_14 = history['Low'].rolling(window=14).min()
        high_14 = history['High'].rolling(window=14).max()
        history['%K'] = 100 * ((history['Close'] - low_14) / (high_14 - low_14))
        history['%D'] = history['%K'].rolling(window=3).mean()
        stoch_k = get_last_valid(history['%K']) if len(close_clean) >= 14 else "N/A"
        stoch_d = get_last_valid(history['%D']) if len(close_clean) >= 14 else "N/A"
        
        # Get news
        news = stock.news
        news_summary = []
        if news:
            for item in news[:3]: # Top 3 news items
                news_summary.append(f"- {item.get('title')} ({item.get('publisher')})")
        
        data = {
            "ticker": ticker.upper(),
            "current_price": current_price,
            "market_cap": info.get("marketCap", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "forward_pe": info.get("forwardPE", "N/A"),
            "beta": info.get("beta", "N/A"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow", "N/A"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "long_business_summary": info.get("longBusinessSummary", "N/A"),
            "currency": info.get("currency", "USD"),
            "news": news_summary,
            "technical": {
                "rsi": rsi,
                "sma_50": sma_50,
                "sma_200": sma_200,
                "macd": macd_val,
                "macd_signal": signal_val,
                "bb_upper": bb_upper,
                "bb_lower": bb_lower,
                "ema_50": ema_50,
                "atr": atr,
                "stoch_k": stoch_k,
                "stoch_d": stoch_d
            }
        }
        return data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

def get_financial_statements(ticker: str):
    """
    Fetches financial statements for a given ticker.
    Returns Income Statement, Balance Sheet, and Cash Flow Statement.
    """
    try:
        stock = yf.Ticker(ticker)
        
        # Get financial statements
        income_stmt = stock.financials  # Income Statement (Annual)
        balance_sheet = stock.balance_sheet  # Balance Sheet (Annual)
        cash_flow = stock.cashflow  # Cash Flow Statement (Annual)
        
        # Get quarterly data as well
        quarterly_income = stock.quarterly_financials
        quarterly_balance = stock.quarterly_balance_sheet
        quarterly_cashflow = stock.quarterly_cashflow
        
        # Get company info for context
        info = stock.info
        
        def format_financial_data(df, statement_name):
            """Helper to format financial dataframes"""
            if df.empty:
                return {"error": f"No {statement_name} data available"}
            
            # Convert to dictionary and handle NaN values
            data = {}
            for column in df.columns:
                year = str(column.year) if hasattr(column, 'year') else str(column)
                data[year] = {}
                for index in df.index:
                    value = df.loc[index, column]
                    if pd.isna(value):
                        data[year][index] = None
                    else:
                        data[year][index] = float(value)
            return data
        
        result = {
            "ticker": ticker.upper(),
            "company_name": info.get("longName", "N/A"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "currency": info.get("currency", "USD"),
            "financial_statements": {
                "annual": {
                    "income_statement": format_financial_data(income_stmt, "Income Statement"),
                    "balance_sheet": format_financial_data(balance_sheet, "Balance Sheet"),
                    "cash_flow": format_financial_data(cash_flow, "Cash Flow")
                },
                "quarterly": {
                    "income_statement": format_financial_data(quarterly_income, "Quarterly Income Statement"),
                    "balance_sheet": format_financial_data(quarterly_balance, "Quarterly Balance Sheet"),
                    "cash_flow": format_financial_data(quarterly_cashflow, "Quarterly Cash Flow")
                }
            },
            "key_metrics": extract_key_metrics(income_stmt, balance_sheet, cash_flow, info)
        }
        
        return result
        
    except Exception as e:
        print(f"Error fetching financial statements for {ticker}: {e}")
        return {"error": f"Could not fetch financial data for {ticker}"}

def extract_key_metrics(income_stmt, balance_sheet, cash_flow, info):
    """
    Extracts key financial metrics from the statements.
    """
    try:
        metrics = {}
        
        # Helper function to get latest value
        def get_latest(df, item_name):
            try:
                if df.empty or item_name not in df.index:
                    return None
                return float(df.loc[item_name].iloc[0])  # Most recent year
            except:
                return None
        
        # Revenue metrics
        revenue = get_latest(income_stmt, "Total Revenue")
        gross_profit = get_latest(income_stmt, "Gross Profit")
        operating_income = get_latest(income_stmt, "Operating Income")
        net_income = get_latest(income_stmt, "Net Income")
        
        # Balance sheet metrics
        total_assets = get_latest(balance_sheet, "Total Assets")
        total_debt = get_latest(balance_sheet, "Total Debt")
        total_equity = get_latest(balance_sheet, "Total Equity Gross Minority Interest")
        cash = get_latest(balance_sheet, "Cash And Cash Equivalents")
        
        # Cash flow metrics
        operating_cash_flow = get_latest(cash_flow, "Operating Cash Flow")
        free_cash_flow = get_latest(cash_flow, "Free Cash Flow")
        
        # Calculate ratios
        metrics = {
            "revenue": revenue,
            "gross_profit": gross_profit,
            "operating_income": operating_income,
            "net_income": net_income,
            "total_assets": total_assets,
            "total_debt": total_debt,
            "total_equity": total_equity,
            "cash": cash,
            "operating_cash_flow": operating_cash_flow,
            "free_cash_flow": free_cash_flow,
            
            # Calculated ratios
            "gross_margin": (gross_profit / revenue * 100) if revenue and gross_profit else None,
            "operating_margin": (operating_income / revenue * 100) if revenue and operating_income else None,
            "net_margin": (net_income / revenue * 100) if revenue and net_income else None,
            "debt_to_equity": (total_debt / total_equity) if total_debt and total_equity else None,
            "return_on_assets": (net_income / total_assets * 100) if net_income and total_assets else None,
            "return_on_equity": (net_income / total_equity * 100) if net_income and total_equity else None,
            
            # From yfinance info
            "market_cap": info.get("marketCap"),
            "enterprise_value": info.get("enterpriseValue"),
            "pe_ratio": info.get("trailingPE"),
            "price_to_book": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),
            "dividend_yield": info.get("dividendYield")
        }
        
        return metrics
        
    except Exception as e:
        print(f"Error extracting key metrics: {e}")
        return {}

def analyze_stock(data: dict, comparison_data: dict = None, indicators: list = None):
    """
    Sends stock data to Gemini for analysis. Supports optional comparison and indicator filtering.
    """
    if not data:
        return "No data available to analyze."
        
    model = genai.GenerativeModel('gemini-flash-latest')
    
    if indicators is None:
        indicators = ["RSI", "MACD", "SMA", "Bollinger Bands", "EMA", "ATR", "Stochastic"]
    
    # Helper to format technicals
    def format_tech(d):
        t = d.get('technical', {})
        c = d.get('currency', 'USD')
        s = "₹" if c == "INR" else "$"
        
        # Helper function to safely format numbers
        def safe_format(value, currency_prefix=""):
            if value == "N/A" or value is None:
                return "N/A"
            try:
                return f"{currency_prefix}{float(value):.2f}"
            except (ValueError, TypeError):
                return str(value)
        
        lines = []
        if "RSI" in indicators:
            rsi_val = safe_format(t.get('rsi', 'N/A'))
            lines.append(f"- RSI (14): {rsi_val}")
        if "SMA" in indicators:
            sma_50_val = safe_format(t.get('sma_50', 'N/A'), s)
            sma_200_val = safe_format(t.get('sma_200', 'N/A'), s)
            lines.append(f"- SMA 50: {sma_50_val}")
            lines.append(f"- SMA 200: {sma_200_val}")
        if "EMA" in indicators:
            ema_50_val = safe_format(t.get('ema_50', 'N/A'), s)
            lines.append(f"- EMA 50: {ema_50_val}")
        if "MACD" in indicators:
            macd_val = safe_format(t.get('macd', 'N/A'))
            signal_val = safe_format(t.get('macd_signal', 'N/A'))
            lines.append(f"- MACD: {macd_val} (Signal: {signal_val})")
        if "Bollinger Bands" in indicators:
            bb_lower_val = safe_format(t.get('bb_lower', 'N/A'), s)
            bb_upper_val = safe_format(t.get('bb_upper', 'N/A'), s)
            lines.append(f"- Bollinger Bands: {bb_lower_val} - {bb_upper_val}")
        if "ATR" in indicators:
            atr_val = safe_format(t.get('atr', 'N/A'))
            lines.append(f"- ATR (14): {atr_val}")
        if "Stochastic" in indicators:
            stoch_k_val = safe_format(t.get('stoch_k', 'N/A'))
            stoch_d_val = safe_format(t.get('stoch_d', 'N/A'))
            lines.append(f"- Stochastic %K: {stoch_k_val} (%D: {stoch_d_val})")
            
        return "\n".join(lines) if lines else "No technical indicators selected."

    currency = data.get('currency', 'USD')
    symbol = "₹" if currency == "INR" else "$"
    
    # Helper to format price values
    def format_price(value, currency_symbol=""):
        if value == "N/A" or value is None:
            return "N/A"
        try:
            return f"{currency_symbol}{float(value):.2f}"
        except (ValueError, TypeError):
            return str(value)
    
    base_prompt = f"""
    Act as a professional financial analyst and trader. 
    
    **PRIMARY STOCK: {data['ticker']}**
    **Price Data:**
    - Current Price: {format_price(data['current_price'], symbol)}
    - 52-Week Range: {format_price(data['fifty_two_week_low'], symbol)} - {format_price(data['fifty_two_week_high'], symbol)}
    - Beta: {data['beta']}
    **Valuation:**
    - Market Cap: {data['market_cap']}
    - P/E Ratio: {data['pe_ratio']}
    - Forward P/E: {data['forward_pe']}
    **Technical Indicators:**
    {format_tech(data)}
    **Recent News:**
    {chr(10).join(data['news'])}
    """
    
    if comparison_data:
        comp_currency = comparison_data.get('currency', 'USD')
        comp_symbol = "₹" if comp_currency == "INR" else "$"
        
        base_prompt += f"""
        
        **COMPARISON STOCK: {comparison_data['ticker']}**
        **Price Data:**
        - Current Price: {format_price(comparison_data['current_price'], comp_symbol)}
        - 52-Week Range: {format_price(comparison_data['fifty_two_week_low'], comp_symbol)} - {format_price(comparison_data['fifty_two_week_high'], comp_symbol)}
        - Beta: {comparison_data['beta']}
        **Valuation:**
        - Market Cap: {comparison_data['market_cap']}
        - P/E Ratio: {comparison_data['pe_ratio']}
        - Forward P/E: {comparison_data['forward_pe']}
        **Technical Indicators:**
        {format_tech(comparison_data)}
        **Recent News:**
        {chr(10).join(comparison_data['news'])}
        
        **TASK:**
        Perform a HEAD-TO-HEAD comparison.
        
        1. **Executive Summary**: Brief outlook and overall assessment of both stocks (include Bullish/Bearish/Neutral sentiment for each).
        
        2. **Final Verdict**:
           # 🏆 WINNER: [Ticker]
           **Reason**: One sentence summary explaining why this stock is the better choice.
           
        3. **Comparative Analysis**:
           - **Valuation**: Which is cheaper?
           - **Growth**: Which has better prospects?
           - **Technicals**: Which has a better chart setup?
           - **Risk**: Which is safer?
           
        4. **Trade Setup (For the Winner)**:
           - **Action**: BUY / WAIT
           - **Entry**: Target price.
           - **Target**: Profit goal.
           - **Stop Loss**: Risk management.
        """
    else:
        base_prompt += f"""
        **TASK:**
        Provide a comprehensive analysis with a specific focus on a TRADE SETUP.
        
        1. **Executive Summary**: Brief outlook (Bullish/Bearish/Neutral).
        2. **Technical Analysis**: Interpret RSI, MACD, and Bollinger Bands.
        3. **Fundamental Check**: Is the valuation supportive?
        
        4. **TRADE SETUP (Crucial)**:
           Based on the technicals, propose a specific trade.
           - **Action**: BUY / SELL / WAIT
           - **Entry Price**: Specific price or range.
           - **Target Price**: Profit goal.
           - **Stop Loss**: Risk management.
           - **Timeframe**: Short-term vs Long-term.
           - **Rationale**: Why this setup?
        """
    
    base_prompt += "\nFormat the output in Markdown. Use bolding for key numbers."
    
    try:
        # Increment request counter before making API call
        current_count = increment_request_count()
        
        response = model.generate_content(base_prompt)
        return response.text
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate limit" in error_msg or "429" in error_msg or "exceeded" in error_msg:
            print("⚠️ AI API quota exceeded")
            return f"""# 🤖 AI Analysis Temporarily Unavailable

**🔋 Quota Status**: You've used your daily 20 free Gemini API requests. 

📊 **Current Usage**: {current_count}/20 requests today
🕒 **Quota Resets**: Tomorrow at midnight
⏰ **Time Left**: ~{24 - datetime.now().hour} hours

---
**⚡ Solutions:**
- **Wait**: Free quota resets tomorrow (20 requests/day)  
- **Upgrade**: Get unlimited requests with a paid Gemini API plan
- **Try Again**: Tomorrow after quota reset

💡 **Pro Tip**: Use the tool strategically to maximize your daily quota!
"""
        else:
            return f"Error generating analysis: {e}"

# Request tracking for Gemini API quota management
REQUEST_COUNTER_FILE = "gemini_requests.json"

def get_daily_request_count():
    """
    Get the current daily request count for Gemini API.
    Returns tuple: (count, date, is_today)
    """
    today = datetime.now().strftime("%Y-%m-%d")
    
    try:
        if os.path.exists(REQUEST_COUNTER_FILE):
            with open(REQUEST_COUNTER_FILE, 'r') as f:
                data = json.load(f)
                stored_date = data.get('date', '')
                stored_count = data.get('count', 0)
                
                # Check if it's the same day
                if stored_date == today:
                    return stored_count, today, True
                else:
                    # New day - reset counter
                    reset_daily_request_count()
                    return 0, today, True
        else:
            # File doesn't exist - create it
            reset_daily_request_count()
            return 0, today, True
            
    except Exception as e:
        print(f"Error reading request counter: {e}")
        return 0, today, True

def increment_request_count():
    """
    Increment the daily request counter.
    Returns the new count.
    """
    current_count, today, _ = get_daily_request_count()
    new_count = current_count + 1
    
    try:
        with open(REQUEST_COUNTER_FILE, 'w') as f:
            json.dump({
                'date': today,
                'count': new_count,
                'last_updated': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"📊 Gemini API requests today: {new_count}/20")
        return new_count
    except Exception as e:
        print(f"Error updating request counter: {e}")
        return current_count

def reset_daily_request_count():
    """
    Reset the daily request counter (called automatically on new day).
    """
    today = datetime.now().strftime("%Y-%m-%d")
    
    try:
        with open(REQUEST_COUNTER_FILE, 'w') as f:
            json.dump({
                'date': today,
                'count': 0,
                'last_updated': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"🔄 Request counter reset for new day: {today}")
    except Exception as e:
        print(f"Error resetting request counter: {e}")

def get_quota_status():
    """
    Get quota status information for the frontend.
    Returns dict with count, limit, date, etc.
    """
    count, date, is_today = get_daily_request_count()
    limit = 20  # Free tier limit
    
    return {
        'requests_made': count,
        'daily_limit': limit,
        'remaining': max(0, limit - count),
        'date': date,
        'percentage_used': round((count / limit) * 100, 1),
        'is_quota_exceeded': count >= limit
    }
