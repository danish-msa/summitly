# Architecture & System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      index_repliers.html (Main UI)                   │   │
│  │  - Voice input / text chat interface                 │   │
│  │  - Property display cards                            │   │
│  │  - Lead capture forms                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┬─┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Flask)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/intelligent-chat-sync  ◄──► NLP Processing    │   │
│  │  /api/property-analysis      ◄──► Valuation Engine  │   │
│  │  /api/multimodal             ◄──► Audio Processing  │   │
│  │  /api/leads                  ◄──► Lead Management   │   │
│  │  /api/saved-searches         ◄──► Search Service    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┬─┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                             │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Repliers API  │  │  OpenAI API  │  │  Exa Search  │    │
│  │  - Listings    │  │  - Chat      │  │  - Market    │    │
│  │  - Valuation   │  │  - Embedding │  │    Data      │    │
│  └────────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  NLP Service   │  │  Formatting  │  │ Chatbot Core │    │
│  │  - Extract     │  │  - Response  │  │ - Context    │    │
│  │    entities    │  │    formatting│  │ - Memory     │    │
│  │  - Classify    │  │  - HTML      │  │ - Reasoning  │    │
│  └────────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┬─┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - Property Database (Repliers)                      │   │
│  │  - Lead Storage (Excel/Database)                     │   │
│  │  - Session Cache (In-memory)                         │   │
│  │  - Conversation History (Logs)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend Layer

**Location:** `Frontend/current/index_repliers.html`

**Responsibilities:**
- User interface rendering
- Voice recording/playback
- Form submission
- Real-time chat display
- Property card rendering

**Technologies:**
- HTML5, CSS3, JavaScript
- Web Audio API for voice
- Fetch API for requests
- localStorage for sessions

---

### API Layer (Flask)

**Location:** `app/voice_assistant_clean.py`

**Key Endpoints:**
1. **Chat Endpoint** (`/api/intelligent-chat-sync`)
   - Receives user message
   - Routes to appropriate service
   - Returns formatted response

2. **Property Analysis** (`/api/property-analysis`)
   - Analyzes specific properties
   - Provides valuation insights
   - Market comparisons

3. **Multimodal** (`/api/multimodal`)
   - Audio transcription
   - Voice-to-text conversion
   - Multi-format handling

4. **Lead Management** (`/api/leads`)
   - Captures user interest
   - Tracks follow-ups
   - Excel export

---

### Services Layer

#### Directory Structure
```
services/
├── repliers/
│   ├── client.py          # API client
│   ├── listings.py        # Property listings
│   └── valuation.py       # Valuation service
│
├── huggingface/
│   ├── config.py          # Model configuration
│   └── service.py         # HuggingFace wrapper
│
├── chatbot/
│   ├── formatter.py       # Response formatting
│   ├── nlp.py            # NLP processing
│   └── message.py        # Message handling
│
├── valuation/
│   ├── engine.py         # Valuation logic
│   ├── estimates.py      # Estimate generation
│   └── comparables.py    # Comparable analysis
│
├── search/
│   └── saved_search.py   # Search management
│
└── config.py             # Shared configuration
```

#### Key Services

**1. Repliers Client** (`services/repliers_client.py`)
```python
# Handles API communication
repliers_client.get_listings(location, criteria)
repliers_client.get_property_details(mls_number)
repliers_client.get_valuation(property_id)
```

**2. NLP Service** (`services/nlp_service.py`)
```python
# Natural language processing
nlp_service.extract_entities(text)        # Extract location, price, etc.
nlp_service.classify_intent(text)         # Chat, search, analysis, etc.
nlp_service.generate_response(context)    # AI-powered response
```

**3. Chatbot Formatter** (`services/chatbot_formatter.py`)
```python
# Response formatting
chatbot_formatter.format_properties(data)
chatbot_formatter.format_with_html(response)
chatbot_formatter.add_buttons_and_links(content)
```

**4. Valuation Engine** (`services/valuation_engine.py`)
```python
# Property valuation
valuation_engine.estimate_price(property)
valuation_engine.market_analysis(location)
valuation_engine.roi_calculation(property)
```

---

### Data Flow Examples

#### Example 1: Chat Query

```
User Input: "Show me condos in Toronto under $800k"
    │
    ▼
API Endpoint (/api/intelligent-chat-sync)
    │
    ├─► NLP Service
    │   ├─ Extract entities: location="Toronto", budget_max=800000
    │   ├─ Classify intent: "search"
    │   └─ Generate context
    │
    ├─► Repliers Client
    │   ├─ Call API: get_listings("Toronto", {type: "condo", price_max: 800000})
    │   └─ Return: [Property1, Property2, ...]
    │
    ├─► Chatbot Formatter
    │   ├─ Format properties
    │   ├─ Generate description
    │   └─ Add HTML/links
    │
    ▼
Response: "Found 12 condos... [Property Cards] [View More Button]"
    │
    ▼
Frontend Display
```

#### Example 2: Voice Query

```
User: Records audio → "What's the value of property N12584160?"
    │
    ▼
Multimodal Endpoint (/api/multimodal)
    │
    ├─► Audio Transcription
    │   └─ Convert WAV to text
    │
    ├─► NLP Service
    │   ├─ Extract MLS number: N12584160
    │   └─ Classify intent: "valuation"
    │
    ├─► Repliers Client
    │   ├─ Get property details
    │   └─ Get comparable sales
    │
    ├─► Valuation Engine
    │   ├─ Estimate price: $850,000
    │   ├─ Market analysis
    │   └─ Generate report
    │
    ├─► Chatbot Formatter
    │   └─ Format for audio playback
    │
    ▼
Response: Audio file or text for TTS
    │
    ▼
Frontend: Plays audio response
```

---

## Configuration Management

```
config/
├── .env                  # Secrets (git-ignored)
└── .env.example         # Template

services/config.py       # Runtime configuration
```

**Configuration Hierarchy:**
1. Environment variables (highest priority)
2. .env file
3. services/config.py (defaults)
4. Hardcoded defaults (lowest priority)

---

## Database Design

### Session Storage
```
Session {
  session_id: string,
  user_id: string (optional),
  created_at: timestamp,
  last_activity: timestamp,
  preferences: {
    location: string,
    budget_min/max: number,
    property_type: string,
    bedrooms: number
  },
  conversation_history: [
    { role: 'user', content: string, timestamp: timestamp },
    { role: 'assistant', content: string, timestamp: timestamp }
  ]
}
```

### Lead Storage
```
Lead {
  lead_id: string,
  name: string,
  email: string,
  phone: string,
  interested_properties: [string],
  created_at: timestamp,
  status: 'new' | 'contacted' | 'qualified' | 'lost',
  notes: string
}
```

---

## Error Handling Strategy

```
Try to handle at each layer:

API Layer:
├─ Input validation
├─ Request formatting
└─ Response wrapping

Services Layer:
├─ API error handling
├─ Data transformation
└─ Fallback logic

Frontend:
├─ Network error handling
├─ User feedback
└─ Retry logic
```

---

## Scaling Considerations

### Horizontal Scaling
- Flask runs behind load balancer
- Sessions stored in Redis (not in-memory)
- Database connection pooling
- CDN for static assets

### Caching Strategy
```
Layer 1: Frontend cache (localStorage, IndexedDB)
Layer 2: API response cache (Redis, 5-10 mins)
Layer 3: Service cache (local, 30-60 mins)
Layer 4: Database cache (query results)
```

### Performance Optimization
- Async request handling for long operations
- Property images lazy-loaded
- Conversation history pagination
- Database query optimization

---

## Security Architecture

```
┌─────────────────────────────────────┐
│   API Security                      │
├─────────────────────────────────────┤
│ • CORS headers validation           │
│ • Input sanitization                │
│ • Rate limiting (100 req/min)       │
│ • SQL injection prevention          │
│ • XSS protection                    │
└─────────────────────────────────────┘
         ▼
┌─────────────────────────────────────┐
│   Session Management                │
├─────────────────────────────────────┤
│ • Session tokens                    │
│ • Timeout (30 mins)                 │
│ • Secure cookies (HTTPS)            │
└─────────────────────────────────────┘
         ▼
┌─────────────────────────────────────┐
│   Data Protection                   │
├─────────────────────────────────────┤
│ • Encryption at rest                │
│ • HTTPS in transit                  │
│ • PII masking in logs               │
└─────────────────────────────────────┘
```

---

## Deployment Architecture

```
Internet
    │
    ▼
┌─────────────────────────────┐
│   Load Balancer             │
│   (or CDN)                  │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌────────┐
│ App    │   │ App    │   (Multiple instances)
│Instance│   │Instance│
├────────┤   ├────────┤
│Flask   │   │Flask   │
│5050    │   │5050    │
└───┬────┘   └───┬────┘
    │             │
    └──────┬──────┘
           ▼
    ┌────────────────────┐
    │  Redis Cache       │
    │  (Session/Logs)    │
    └────────────────────┘
           ▼
    ┌────────────────────┐
    │  Database          │
    │  (Logs, Leads)     │
    └────────────────────┘
```

---

**Last Updated**: November 28, 2025  
**Version**: 3.0.0
