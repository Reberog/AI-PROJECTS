import pandas as pd
import requests
import yfinance as yf

def fetch_nse_stocks_from_official():
    """
    Fetch NSE stock list from official NSE data sources
    """
    try:
        # NSE official equity list URL
        url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        
        # Read the CSV directly into pandas
        df = pd.read_csv(url)
        
        # Clean and format the data
        df['YAHOO_SYMBOL'] = df['SYMBOL'] + '.NS'
        print("All Data")
        print(df.head())
        
        # Select relevant columns
        nse_stocks = df[['SYMBOL', 'NAME OF COMPANY', 'YAHOO_SYMBOL']].copy()
        nse_stocks.columns = ['NSE_Symbol', 'Company_Name', 'Yahoo_Symbol']
        
        print(f"Found {len(nse_stocks)} NSE stocks")
        return nse_stocks
        
    except Exception as e:
        print(f"Error fetching from NSE: {e}")
        return None

def fetch_nifty_stocks():
    """
    Fetch NIFTY 50 stocks (smaller, curated list)
    """
    # NIFTY 50 stocks (manually curated - most actively traded)
    nifty50 = [
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
    
    return pd.DataFrame({
        'NSE_Symbol': [s.replace('.NS', '') for s in nifty50],
        'Yahoo_Symbol': nifty50,
        'Index': 'NIFTY50'
    })

def test_stock_data(symbol_list, sample_size=5):
    """
    Test if we can actually fetch data for these stocks
    """
    print(f"\nTesting data availability for {sample_size} random stocks...")
    
    sample = symbol_list.sample(n=min(sample_size, len(symbol_list)))
    
    for _, stock in sample.iterrows():
        yahoo_symbol = stock['Yahoo_Symbol']
        try:
            ticker = yf.Ticker(yahoo_symbol)
            info = ticker.info
            hist = ticker.history(period="5d")
            
            if not hist.empty:
                print(f"✅ {yahoo_symbol} - {stock.get('Company_Name', 'N/A')} - Data available")
            else:
                print(f"❌ {yahoo_symbol} - No historical data")
                
        except Exception as e:
            print(f"❌ {yahoo_symbol} - Error: {e}")

if __name__ == "__main__":
    print("=== Fetching NSE Stock Lists ===\n")
    
    # Method 1: Official NSE data
    print("1. Trying official NSE data...")
    nse_stocks = fetch_nse_stocks_from_official()
    
    if nse_stocks is not None:
        print(f"Sample NSE stocks:")
        print(nse_stocks.head(10))
        
        # Test a few stocks
        test_stock_data(nse_stocks, 5)
        
        # Save to CSV
        nse_stocks.to_csv('nse_stocks_list.csv', index=False)
        print(f"\n💾 Saved {len(nse_stocks)} stocks to 'nse_stocks_list.csv'")
    
    print("\n" + "="*50)
    
    # Method 2: NIFTY 50 (guaranteed to work)
    print("2. NIFTY 50 stocks (curated list):")
    nifty50 = fetch_nifty_stocks()
    print(nifty50.head(10))
    
    # Test NIFTY 50 stocks
    test_stock_data(nifty50, 5)
    
    # Save NIFTY 50
    nifty50.to_csv('nifty50_stocks.csv', index=False)
    print(f"\n💾 Saved NIFTY 50 to 'nifty50_stocks.csv'")
