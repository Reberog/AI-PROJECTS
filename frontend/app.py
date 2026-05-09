import streamlit as st
import pandas as pd
import requests
import os

# Cache for NSE stocks data
@st.cache_data(ttl=3600)  # Cache for 1 hour
def fetch_nse_stocks_cache():
    """Fetch and cache NSE stocks list for autocomplete"""
    try:
        response = requests.get("http://127.0.0.1:8000/nse/stocks", timeout=10)
        if response.status_code == 200:
            data = response.json()
            stocks = data.get('stocks', [])
            
            # Create a list of searchable options
            options = []
            for stock in stocks:
                nse_symbol = stock.get('NSE_Symbol', '')
                company_name = stock.get('Company_Name', '')
                if nse_symbol and company_name:
                    options.append({
                        'symbol': nse_symbol,
                        'company': company_name,
                        'display': f"{nse_symbol} - {company_name}",
                        'search_text': f"{nse_symbol} {company_name}".lower()
                    })
            return options
    except Exception as e:
        st.warning(f"Could not load NSE stocks cache: {e}")
    
    # Fallback: return some popular stocks
    popular_stocks = [
        {'symbol': 'RELIANCE', 'company': 'Reliance Industries Limited', 'display': 'RELIANCE - Reliance Industries Limited', 'search_text': 'reliance reliance industries limited'},
        {'symbol': 'TCS', 'company': 'Tata Consultancy Services Limited', 'display': 'TCS - Tata Consultancy Services Limited', 'search_text': 'tcs tata consultancy services limited'},
        {'symbol': 'HDFCBANK', 'company': 'HDFC Bank Limited', 'display': 'HDFCBANK - HDFC Bank Limited', 'search_text': 'hdfcbank hdfc bank limited'},
        {'symbol': 'INFY', 'company': 'Infosys Limited', 'display': 'INFY - Infosys Limited', 'search_text': 'infy infosys limited'},
        {'symbol': 'ICICIBANK', 'company': 'ICICI Bank Limited', 'display': 'ICICIBANK - ICICI Bank Limited', 'search_text': 'icicibank icici bank limited'},
    ]
    return popular_stocks

@st.cache_data(ttl=30)  # Cache for 30 seconds
def fetch_quota_status():
    """Fetch Gemini API quota status"""
    try:
        response = requests.get("http://127.0.0.1:8000/quota-status", timeout=5)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Could not load quota status: {e}")
    
    # Fallback
    return {
        'requests_made': 0,
        'daily_limit': 20,
        'remaining': 20,
        'percentage_used': 0
    }

def simple_autocomplete(label, options, key, placeholder="Start typing...", help_text=None):
    """Google-style autocomplete with proper selection and green tick indicators"""
    
    # Initialize session state for this autocomplete
    if f"{key}_selected" not in st.session_state:
        st.session_state[f"{key}_selected"] = ""
    if f"{key}_input_value" not in st.session_state:
        st.session_state[f"{key}_input_value"] = ""
    if f"{key}_show_selection" not in st.session_state:
        st.session_state[f"{key}_show_selection"] = False
    
    # If a selection was made, show it clearly
    if st.session_state[f"{key}_selected"] and st.session_state[f"{key}_show_selection"]:
        selected_symbol = st.session_state[f"{key}_selected"]
        # Find the display string for the selected symbol
        selected_display = next((o['display'] for o in options if o['symbol'] == selected_symbol), selected_symbol)
        st.session_state[f"{key}_selected_display"] = selected_display
        # Display the selected stock with option to change
        col1, col2 = st.columns([5, 1])
        with col1:
            st.success(f"✅ Selected: **{selected_display}**")
        with col2:
            if st.button("Change", key=f"{key}_change", type="secondary", help="Click to select a different stock"):
                # Clear selection and reset
                st.session_state[f"{key}_selected"] = ""
                st.session_state[f"{key}_show_selection"] = False
                st.session_state[f"{key}_input_value"] = ""
                st.session_state[f"{key}_selected_display"] = ""
                st.rerun()
        return selected_symbol
    
    # Search input
    search_input = st.text_input(
        label,
        value=st.session_state[f"{key}_input_value"],
        placeholder=placeholder,
        help=help_text,
        key=f"{key}_input"
    )
    
    # Update input value in session state and reset selection when typing
    if search_input != st.session_state[f"{key}_input_value"]:
        st.session_state[f"{key}_input_value"] = search_input
        st.session_state[f"{key}_show_selection"] = False  # Hide selection when typing
    
    # Real-time filtering and display
    if search_input and len(search_input.strip()) >= 1:
        query = search_input.strip().lower()
        
        # Filter options - prioritize exact matches and starts-with matches
        exact_matches = []
        prefix_matches = []
        partial_matches = []
        
        for option in options:
            symbol_lower = option['symbol'].lower()
            search_text_lower = option['search_text']
            
            # Check for exact symbol match
            if symbol_lower == query:
                exact_matches.append(option)
            # Check if symbol starts with query
            elif symbol_lower.startswith(query):
                prefix_matches.append(option)
            # Check for partial matches in company name or other text
            elif (query in search_text_lower or 
                  any(word.startswith(query) for word in search_text_lower.split())):
                partial_matches.append(option)
        
        # Combine matches in priority order
        matches = exact_matches + prefix_matches + partial_matches
        matches = matches[:8]  # Limit to 8 results
        
        if matches:
            st.markdown(f"**💡 Found {len(matches)} matches:**")
            
            # Display matches with numbered buttons and selection indicators
            for i, match in enumerate(matches):
                col1, col2 = st.columns([5, 1])
                with col1:
                    # Highlight if this is the currently selected stock (even if not confirmed)
                    if st.session_state[f"{key}_selected"] == match['symbol']:
                        st.markdown(f"🟢 **{match['symbol']}** - {match['company'][:55]}{'...' if len(match['company']) > 55 else ''}")
                    else:
                        st.markdown(f"**{match['symbol']}** - {match['company'][:60]}{'...' if len(match['company']) > 60 else ''}")
                with col2:
                    # Green tick for selected item, regular tick for others
                    if st.session_state[f"{key}_selected"] == match['symbol']:
                        button_label = "🟢"
                        button_type = "primary"
                    else:
                        button_label = "✓"
                        button_type = "secondary"
                    if st.button(button_label, key=f"{key}_btn_{i}", type=button_type, help=f"Select {match['symbol']}"):
                        # Store the selection and mark as confirmed
                        st.session_state[f"{key}_selected"] = match['symbol']
                        st.session_state[f"{key}_show_selection"] = True
                        st.session_state[f"{key}_input_value"] = ""  # Clear input
                        st.session_state[f"{key}_selected_display"] = match['display']
                        st.rerun()  # Refresh to show selection
            
            st.divider()
        else:
            st.info("🔍 No matches found. Try different keywords.")
    
    # Return empty string if no selection made (not None, to avoid issues)
    return ""

def fetch_financial_statements(ticker):
    """Fetch financial statements for a given ticker"""
    try:
        response = requests.get(f"http://127.0.0.1:8000/financial-statements/{ticker}", timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Could not fetch financial data: {response.text}"}
    except Exception as e:
        return {"error": f"Connection error: {str(e)}"}

def display_financial_statements(financial_data):
    """Display financial statements in an organized format"""
    if "error" in financial_data:
        st.error(financial_data["error"])
        return
    
    company_name = financial_data.get("company_name", "N/A")
    currency = financial_data.get("currency", "USD")
    symbol = "₹" if currency == "INR" else "$"
    
    st.subheader(f"📊 Financial Statements - {company_name}")
    
    # Key Metrics Summary
    metrics = financial_data.get("key_metrics", {})
    if metrics:
        st.markdown("### 🎯 Key Financial Metrics")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Revenue", safe_format_number(metrics.get("revenue"), symbol))
            st.metric("Net Income", safe_format_number(metrics.get("net_income"), symbol))
        
        with col2:
            st.metric("Total Assets", safe_format_number(metrics.get("total_assets"), symbol))
            st.metric("Total Debt", safe_format_number(metrics.get("total_debt"), symbol))
            
        with col3:
            st.metric("Operating Cash Flow", safe_format_number(metrics.get("operating_cash_flow"), symbol))
            st.metric("Free Cash Flow", safe_format_number(metrics.get("free_cash_flow"), symbol))
            
        with col4:
            st.metric("Gross Margin", safe_format_number(metrics.get("gross_margin"), "", "%"))
            st.metric("Net Margin", safe_format_number(metrics.get("net_margin"), "", "%"))
    
    # Detailed Financial Statements in tabs
    tab1, tab2, tab3 = st.tabs(["📈 Income Statement", "🏛️ Balance Sheet", "💰 Cash Flow"])
    
    statements = financial_data.get("financial_statements", {})
    annual_data = statements.get("annual", {})
    
    with tab1:
        st.markdown("#### Annual Income Statement")
        income_data = annual_data.get("income_statement", {})
        if income_data and "error" not in income_data:
            display_financial_table(income_data, "Income Statement", symbol)
        else:
            st.info("Income statement data not available")
    
    with tab2:
        st.markdown("#### Annual Balance Sheet")
        balance_data = annual_data.get("balance_sheet", {})
        if balance_data and "error" not in balance_data:
            display_financial_table(balance_data, "Balance Sheet", symbol)
        else:
            st.info("Balance sheet data not available")
    
    with tab3:
        st.markdown("#### Annual Cash Flow Statement")
        cashflow_data = annual_data.get("cash_flow", {})
        if cashflow_data and "error" not in cashflow_data:
            display_financial_table(cashflow_data, "Cash Flow", symbol)
        else:
            st.info("Cash flow data not available")

def display_financial_table(data, statement_type, currency_symbol):
    """Display financial data in a formatted table"""
    if not data or "error" in data:
        st.info(f"{statement_type} data not available")
        return
    
    # Convert data to DataFrame for better display
    df_data = []
    years = sorted(data.keys(), reverse=True)  # Most recent first
    
    # Get all unique line items
    all_items = set()
    for year in years:
        all_items.update(data[year].keys())
    
    # Create DataFrame
    for item in sorted(all_items):
        row = {"Item": item}
        for year in years:
            value = data[year].get(item)
            if value is not None:
                if abs(value) >= 1e9:
                    row[year] = safe_format_number(value, currency_symbol, "", 1e9) + "B"
                elif abs(value) >= 1e6:
                    row[year] = safe_format_number(value, currency_symbol, "", 1e6) + "M"
                elif abs(value) >= 1e3:
                    row[year] = safe_format_number(value, currency_symbol, "", 1e3) + "K"
                else:
                    row[year] = safe_format_number(value, currency_symbol)
            else:
                row[year] = "N/A"
        df_data.append(row)
    
    if df_data:
        df = pd.DataFrame(df_data)
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.info(f"No {statement_type} data available")

def safe_format_number(value, prefix="", suffix="", divide_by=1):
    if value is None:
        return "N/A"
    try:
        formatted_value = value / divide_by
        if abs(formatted_value) >= 1e9:
            return f"{prefix}{formatted_value/1e9:.2f}B{suffix}"
        elif abs(formatted_value) >= 1e6:
            return f"{prefix}{formatted_value/1e6:.2f}M{suffix}"
        elif abs(formatted_value) >= 1e3:
            return f"{prefix}{formatted_value/1e3:.2f}K{suffix}"
        else:
            return f"{prefix}{formatted_value:.2f}{suffix}"
    except:
        return str(value)

# Set page config
st.set_page_config(
    page_title="Financial Analysis Tool",
    page_icon="📈",
    layout="wide"
)

# Title and Description
st.title("📈 AI-Powered Financial Analysis Tool")
st.markdown("**Search and analyze NSE stocks with AI-powered insights**")

# Add a metrics row for quick stats
col1, col2, col3, col4 = st.columns(4)

# Try to get NSE stocks count and quota status
try:
    stock_options = fetch_nse_stocks_cache()
    total_stocks = len(stock_options)
    quota_status = fetch_quota_status()
    
    with col1:
        st.metric("📊 Total NSE Stocks", f"{total_stocks:,}")
    with col2:
        # Show AI engine with quota status
        requests_made = quota_status.get('requests_made', 0)
        daily_limit = quota_status.get('daily_limit', 20)
        percentage = quota_status.get('percentage_used', 0)
        
        if percentage > 90:
            st.metric("🤖 AI Requests", f"{requests_made}/{daily_limit}", delta=f"{percentage:.0f}% used", delta_color="inverse")
        elif percentage > 70:
            st.metric("🤖 AI Requests", f"{requests_made}/{daily_limit}", delta=f"{percentage:.0f}% used", delta_color="off")
        else:
            st.metric("🤖 AI Requests", f"{requests_made}/{daily_limit}", delta=f"{percentage:.0f}% used", delta_color="normal")
    with col3:
        st.metric("📈 Data Source", "Yahoo Finance")
    with col4:
        remaining = quota_status.get('remaining', 20)
        if remaining == 0:
            st.metric("⚡ Status", "Quota Full", delta="Resets tomorrow", delta_color="inverse")
        elif remaining < 5:
            st.metric("⚡ Status", f"{remaining} left", delta="Use wisely", delta_color="off")
        else:
            st.metric("⚡ Status", "Live")
except:
    with col1:
        st.metric("📊 Status", "Loading...")
    with col2:
        st.metric("🤖 AI Engine", "Gemini")
    with col3:
        st.metric("📈 Data Source", "Yahoo Finance")
    with col4:
        st.metric("⚡ Mode", "Live")

st.divider()

# Sidebar for inputs
with st.sidebar:
    st.header("🔍 Stock Search")
    stock_options = fetch_nse_stocks_cache()
    
    # Primary stock search with autocomplete
    selected_primary = simple_autocomplete(
        "🎯 Primary Stock",
        stock_options,
        "primary_stock",
        placeholder="e.g., RELIANCE, TCS, or Tata...",
        help_text="Start typing any company name or stock symbol"
    )
    
    # Always use the session state value directly
    query = st.session_state.get("primary_stock_selected", "").strip()
    
    st.divider()
    
    # Comparison stock search with autocomplete
    selected_comparison = simple_autocomplete(
        "⚖️ Compare With (Optional)",
        stock_options,
        "comparison_stock",
        placeholder="e.g., HDFCBANK, INFY...",
        help_text="Type to search for a second stock to compare"
    )
    
    # Always use the session state value directly
    comparison_query = st.session_state.get("comparison_stock_selected", "").strip()
    
    st.divider()
    st.header("📊 Technical Settings")
    
    # Quick Details mode
    quick_details_mode = st.checkbox(
        "⚡ Quick Details Only",
        value=False,
        help="Fetch only current price and basic metrics without AI analysis (saves API quota)"
    )
    
    selected_indicators = st.multiselect(
        "Select Technical Indicators",
        ["RSI", "MACD", "SMA", "EMA", "Bollinger Bands", "ATR", "Stochastic"],
        default=["RSI", "MACD", "SMA", "Bollinger Bands"],
        help="Choose which technical indicators to calculate and display",
        disabled=quick_details_mode  # Disable when in quick mode
    )
    
    # Financial statements option
    include_financials = st.checkbox(
        "📊 Include Financial Statements",
        help="Fetch Income Statement, Balance Sheet, and Cash Flow data",
        disabled=quick_details_mode  # Disable when in quick mode
    )
    
    st.divider()
    
    # Analyze button with dynamic text based on mode
    button_text = "⚡ Get Quick Details" if quick_details_mode else "🚀 Analyze Stock"
    button_help = "Fetch basic stock details only" if quick_details_mode else "Click to fetch data and generate AI analysis"
    
    analyze_btn = st.button(
        button_text, 
        type="primary", 
        use_container_width=True,
        help=button_help
    )

    st.divider()
    
    # Popular stocks examples
    st.header("💡 Examples")
    st.caption("Try typing these in the search above:")
    
    examples = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"
    ]
    
    for example in examples:
        st.markdown(f"• `{example}`")
    
    st.caption("💭 **Pro tip**: Type 'bank' to see all banking stocks, 'tata' for Tata companies!")
    
# Main Content
if analyze_btn:
    if not query:
        st.error("Please select a stock from the suggestions (click the tick).")
    else:
        # Different spinner message based on mode
        spinner_msg = "Fetching stock details..." if quick_details_mode else "Searching and analyzing..."
        
        with st.spinner(spinner_msg):
            try:
                if quick_details_mode:
                    # Quick Details Mode - Just fetch basic data without AI analysis
                    # Make direct call to get stock data
                    payload = {
                        "query": query,
                        "indicators": []  # No indicators in quick mode
                    }
                    if comparison_query:
                        payload["comparison_query"] = comparison_query
                    
                    # We'll use a different endpoint or skip analysis
                    response = requests.post("http://127.0.0.1:8000/analyze", json=payload)
                    
                    if response.status_code == 200:
                        result = response.json()
                        ticker = result['ticker']
                        data = result['data']
                        
                        comp_ticker = result.get('comparison_ticker')
                        comp_data = result.get('comparison_data')
                        
                        # Display basic details in table format
                        st.subheader("⚡ Quick Details")
                        
                        currency = data.get('currency', 'USD')
                        symbol = "₹" if currency == "INR" else "$"
                        
                        def safe_display(value, prefix=""):
                            if value == "N/A" or value is None:
                                return "N/A"
                            try:
                                return f"{prefix}{float(value):.2f}"
                            except:
                                return str(value)
                        
                        # Create table data
                        table_data = {
                            "Metric": [
                                "� Current Price",
                                "📊 Market Cap",
                                "📈 P/E Ratio",
                                "🔮 Forward P/E",
                                "🎯 Beta",
                                "📉 52-Week Low",
                                "📈 52-Week High",
                                "🏢 Sector",
                                "🏭 Industry"
                            ],
                            ticker: [
                                safe_display(data.get('current_price'), symbol),
                                safe_display(data.get('market_cap')),
                                safe_display(data.get('pe_ratio')),
                                safe_display(data.get('forward_pe')),
                                safe_display(data.get('beta')),
                                safe_display(data.get('fifty_two_week_low'), symbol),
                                safe_display(data.get('fifty_two_week_high'), symbol),
                                data.get('sector', 'N/A'),
                                data.get('industry', 'N/A')
                            ]
                        }
                        
                        # Add comparison data if available
                        if comp_data:
                            comp_currency = comp_data.get('currency', 'USD')
                            comp_symbol = "₹" if comp_currency == "INR" else "$"
                            
                            table_data[comp_ticker] = [
                                safe_display(comp_data.get('current_price'), comp_symbol),
                                safe_display(comp_data.get('market_cap')),
                                safe_display(comp_data.get('pe_ratio')),
                                safe_display(comp_data.get('forward_pe')),
                                safe_display(comp_data.get('beta')),
                                safe_display(comp_data.get('fifty_two_week_low'), comp_symbol),
                                safe_display(comp_data.get('fifty_two_week_high'), comp_symbol),
                                comp_data.get('sector', 'N/A'),
                                comp_data.get('industry', 'N/A')
                            ]
                        
                        # Create and display DataFrame
                        df = pd.DataFrame(table_data)
                        st.dataframe(
                            df,
                            use_container_width=True,
                            hide_index=True,
                            column_config={
                                "Metric": st.column_config.TextColumn("Metric", width="medium"),
                                ticker: st.column_config.TextColumn(ticker, width="large"),
                                comp_ticker: st.column_config.TextColumn(comp_ticker, width="large") if comp_data else None
                            }
                        )
                        
                        # Show info box
                        st.info("⚡ Quick Details Mode - No AI analysis or API quota used! Toggle off 'Quick Details Only' for full AI-powered analysis.")
                    else:
                        st.error(f"Error: {response.status_code} - {response.text}")
                        
                else:
                    # Full Analysis Mode - Original behavior
                    # Call Backend API
                    payload = {
                        "query": query,
                        "indicators": selected_indicators
                    }
                    if comparison_query:
                        payload["comparison_query"] = comparison_query
                    
                    response = requests.post("http://127.0.0.1:8000/analyze", json=payload)
                
                    if response.status_code == 200:
                        result = response.json()
                        ticker = result['ticker']
                        data = result['data']
                        analysis = result['analysis']
                        
                        comp_ticker = result.get('comparison_ticker')
                        comp_data = result.get('comparison_data')
                    
                    # Prepare Data for Table
                    # Base Metrics
                    metric_names = ["Current Price", "Market Cap", "P/E Ratio", "Beta"]
                    
                    # Add Selected Indicators to Metrics
                    if "RSI" in selected_indicators:
                        metric_names.append("RSI (14)")
                    if "MACD" in selected_indicators:
                        metric_names.append("MACD")
                    if "SMA" in selected_indicators:
                        metric_names.extend(["SMA 50", "SMA 200"])
                    if "EMA" in selected_indicators:
                        metric_names.append("EMA 50")
                    if "Bollinger Bands" in selected_indicators:
                        metric_names.extend(["BB Upper", "BB Lower"])
                    if "ATR" in selected_indicators:
                        metric_names.append("ATR (14)")
                    if "Stochastic" in selected_indicators:
                        metric_names.append("Stoch %K")

                    metrics = {"Metric": metric_names}
                    
                    # Helper to extract values
                    def get_values(d):
                        c = d.get('currency', 'USD')
                        s = "₹" if c == "INR" else "$"
                        t = d.get('technical', {})
                        
                        # Helper function to safely format numbers
                        def safe_format(value, currency_prefix=""):
                            if value == "N/A" or value is None:
                                return "N/A"
                            try:
                                return f"{currency_prefix}{float(value):.2f}"
                            except (ValueError, TypeError):
                                return str(value)
                        
                        vals = [
                            safe_format(d.get('current_price'), s),
                            safe_format(d.get('market_cap')),
                            safe_format(d.get('pe_ratio')),
                            safe_format(d.get('beta'))
                        ]
                        
                        if "RSI" in selected_indicators:
                            vals.append(safe_format(t.get('rsi', 'N/A')))
                        if "MACD" in selected_indicators:
                            vals.append(safe_format(t.get('macd', 'N/A')))
                        if "SMA" in selected_indicators:
                            vals.append(safe_format(t.get('sma_50', 'N/A'), s))
                            vals.append(safe_format(t.get('sma_200', 'N/A'), s))
                        if "EMA" in selected_indicators:
                            vals.append(safe_format(t.get('ema_50', 'N/A'), s))
                        if "Bollinger Bands" in selected_indicators:
                            vals.append(safe_format(t.get('bb_upper', 'N/A'), s))
                            vals.append(safe_format(t.get('bb_lower', 'N/A'), s))
                        if "ATR" in selected_indicators:
                            vals.append(safe_format(t.get('atr', 'N/A')))
                        if "Stochastic" in selected_indicators:
                            vals.append(safe_format(t.get('stoch_k', 'N/A')))
                            
                        return vals

                    metrics[ticker] = get_values(data)
                    
                    if comp_data:
                        metrics[comp_ticker] = get_values(comp_data)
                    
                    df = pd.DataFrame(metrics)
                    
                    # Display Table
                    st.subheader("📊 Comparative Analysis")
                    st.dataframe(
                        df, 
                        use_container_width=True, 
                        hide_index=True,
                        column_config={
                            "Metric": st.column_config.TextColumn("Metric", width="medium"),
                            ticker: st.column_config.TextColumn(ticker, width="large"),
                            comp_ticker: st.column_config.TextColumn(comp_ticker, width="large") if comp_data else None
                        }
                    )
                    
                    # Display Analysis
                    st.divider()
                    st.subheader("🤖 AI Analysis & Verdict")
                    st.markdown(analysis)
                    
                    # Financial Statements Section
                    if include_financials:
                        st.divider()
                        with st.spinner("Fetching financial statements..."):
                            financial_data = fetch_financial_statements(ticker)
                            display_financial_statements(financial_data)
                            
                            # If comparison stock exists, show its financials too
                            if comp_ticker:
                                st.divider()
                                comp_financial_data = fetch_financial_statements(comp_ticker)
                                display_financial_statements(comp_financial_data)
                    else:
                        st.error(f"Error: {response.status_code} - {response.text}")
                        
            except requests.exceptions.ConnectionError:
                st.error("Could not connect to the backend. Is it running?")
            except Exception as e:
                st.error(f"An unexpected error occurred: {e}")

# Footer
st.divider()
st.caption("Powered by FastAPI, yfinance, and Google Gemini.")
