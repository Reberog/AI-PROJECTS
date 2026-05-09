# 🚀 AI-Powered Stock Intelligence Platform (ASIP)

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**A full-stack financial analysis application leveraging Google's Gemini LLM for intelligent stock insights**

[Features](#-key-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack)

</div>

---

## 📋 Overview

AI-Powered Stock Intelligence Platform (ASIP) is a production-ready financial analysis tool that combines real-time market data with advanced AI capabilities to provide comprehensive stock analysis, technical indicators, and actionable trade recommendations.

### 🎯 Key Features

- **🤖 AI-Powered Analysis**: Leverages Google's Gemini LLM for intelligent stock insights and trade recommendations
- **📊 10+ Technical Indicators**: RSI, MACD, SMA, EMA, Bollinger Bands, ATR, Stochastic Oscillator
- **⚖️ Comparative Analysis**: Side-by-side comparison of multiple stocks with AI-driven verdict
- **📈 Real-Time Data**: Live stock prices, news, and market data from Yahoo Finance
- **🇮🇳 NSE/BSE Support**: Complete Indian stock market integration with 2000+ stocks
- **⚡ Quick Details Mode**: Rapid stock lookup without AI analysis for instant insights
- **🎨 Modern UI**: Clean, responsive Streamlit interface with intuitive controls
- **🔒 Quota Management**: Built-in API usage tracking and rate limiting

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│                      (Streamlit UI)                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Stock      │  │  Analysis    │  │   Results    │           │
│  │  Selection   │  │    Config    │  │   Display    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND LAYER                            │
│                       (FastAPI Server)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Endpoints                               │   │
│  │  • /analyze         • /quick-details                     │   │
│  │  • /search-stocks   • /quota-status                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────▼──────────────────────────────┐     │
│  │              Services Layer                            │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │     │
│  │  │ Stock Data   │  │  Technical   │  │  Financial   │  │     │
│  │  │  Fetcher     │  │  Indicators  │  │  Statements  │  │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────-▼─────┐
│  Yahoo Finance │  │  Google Gemini │  │  NSE/BSE    │
│      API       │  │      LLM       │  │   Data      │
└────────────────┘  └────────────────┘  └─────────────┘
```

### Data Flow

```
User Input → Stock Selection → Backend API
                                    ↓
                          Data Aggregation
                    ┌───────────┴────────────┐
                    ↓                        ↓
            Market Data (yfinance)    Technical Indicators
                    │                        │
                    └───────────┬────────────┘
                                ↓
                        AI Analysis (Gemini)
                                ↓
                    Formatted Response → UI Display
```

### Technical Indicators Pipeline

```
Historical Data (1 Year)
        ↓
    [Preprocessing]
        ↓
    ┌───┴───────────────────────────┐
    ↓                               ↓
Trend Indicators          Momentum Indicators
- SMA (50, 200)          - RSI (14)
- EMA (50)               - MACD (12,26,9)
- Bollinger Bands        - Stochastic (14,3,3)
    ↓                               ↓
    └───┬───────────────────────────┘
        ↓
  Volatility Indicators
    - ATR (14)
    - Bollinger Bandwidth
        ↓
    [Aggregation]
        ↓
   Analysis Ready Data
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance async API framework
- **Python 3.12+**: Core programming language
- **yfinance**: Real-time market data retrieval
- **Pandas**: Data manipulation and technical analysis
- **Google Generative AI**: LLM integration for intelligent analysis

### Frontend
- **Streamlit**: Interactive web UI framework
- **Requests**: HTTP client for API communication
- **Custom Components**: Enhanced user experience

### AI/ML
- **Google Gemini Flash**: Fast, cost-effective LLM for analysis
- **Prompt Engineering**: Structured prompts for consistent outputs
- **Quota Management**: Built-in rate limiting and usage tracking

### Data Sources
- **Yahoo Finance API**: Stock prices, financials, news
- **NSE India**: Official equity listings
- **Real-time Market Data**: Live price updates

---

## 📦 Installation

### Prerequisites
- Python 3.12 or higher
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Git (for cloning)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/asip-stock-intelligence.git
cd asip-stock-intelligence
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

5. **Run the application**
```bash
# Option 1: Use the startup script
chmod +x run.sh
./run.sh

# Option 2: Run manually
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
streamlit run app.py
```

6. **Access the application**
- Frontend: http://localhost:8501
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎯 Usage

### Basic Stock Analysis

1. **Select a Stock**: Enter company name or ticker symbol
2. **Choose Analysis Type**: Technical, Fundamental, News, or Comparison
3. **Select Indicators**: Pick relevant technical indicators
4. **Analyze**: Get AI-powered insights and trade recommendations

### Quick Details Mode

Toggle "Quick Details Only" for rapid stock lookup without AI analysis:
- Instant price and metrics
- No API quota consumption
- Perfect for quick comparisons

### Comparative Analysis

1. Enter two stock symbols
2. Select "Comparison" mode
3. Get head-to-head analysis with winner verdict

### Example Queries

```python
# Indian Stocks
- "Reliance" → RELIANCE.NS
- "TCS" → TCS.NS
- "HDFC Bank" → HDFCBANK.NS

# US Stocks
- "Apple" → AAPL
- "Microsoft" → MSFT
- "Tesla" → TSLA
```

---

## 📊 Features Deep Dive

### 1. Technical Indicators

| Indicator | Period | Purpose |
|-----------|--------|---------|
| RSI | 14 | Momentum & overbought/oversold |
| MACD | 12,26,9 | Trend direction & strength |
| SMA | 50, 200 | Long-term trend identification |
| EMA | 50 | Short-term trend with recent bias |
| Bollinger Bands | 20, 2σ | Volatility & price levels |
| ATR | 14 | Volatility measurement |
| Stochastic | 14,3,3 | Momentum oscillator |

### 2. AI Analysis Capabilities

- **Executive Summary**: Bullish/Bearish/Neutral sentiment
- **Technical Interpretation**: RSI, MACD, trend analysis
- **Fundamental Check**: Valuation assessment
- **Trade Setup**: Entry, target, stop-loss recommendations
- **Risk Assessment**: Beta, volatility analysis
- **News Sentiment**: Recent news impact analysis

---

## 🚀 Performance

- **Response Time**: 15-30 seconds for full AI analysis
- **Quick Details**: 2-5 seconds
- **Data Freshness**: Real-time to 15-minute delay
- **API Quota**: 20 free requests/day (Gemini)
- **Caching**: NSE stock list cached for performance

---

## 💼 Skills Demonstrated

This project showcases:
- ✅ **LLM Integration**: Google Gemini API for AI-powered analysis
- ✅ **Full-Stack Development**: FastAPI backend + Streamlit frontend
- ✅ **Financial Modeling**: Technical indicators & fundamental analysis
- ✅ **API Design**: RESTful architecture with proper error handling
- ✅ **Data Engineering**: Real-time data processing with Pandas
- ✅ **Cloud Architecture**: Scalable microservices design

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Arpan Anand**
- GitHub: [@arpananand](https://github.com/arpananand)
- LinkedIn: [linkedin.com/in/arpananand](https://linkedin.com/in/arpananand)
- Email: arpan.anand.official@gmail.com

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ for the FinTech community

</div>
