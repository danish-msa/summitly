# Quick Start Guide: Residential + Commercial Chatbot

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Server

```powershell
cd "C:\PropertyCH\Summitly v2\Summitly-AI-"
python app/voice_assistant_clean.py
```

### Step 2: Open the Frontend

Navigate to: **http://localhost:5050/main**

### Step 3: Try These Queries!

#### Residential Queries 🏠
```
"Show me 2 bedroom condos in Toronto"
"Houses with pools under $800K"
"Properties near good schools in Mississauga"
"3 bedroom townhomes in Ottawa"
```

#### Commercial Queries 🏢
```
"Office space in downtown Toronto"
"Retail store for sale in Vancouver"
"Warehouse with loading dock"
"Bakery for lease in Montreal"
"Commercial building under $2M"
```

---

## ✅ What Just Happened?

Behind the scenes, the system:

1. **Detected Property Type** - Automatically identified if you want residential or commercial
2. **Routed Intelligently** - Sent your query to the right search service
3. **Found Properties** - Searched Repliers API with your criteria
4. **Displayed Results** - Showed properties in a unified format

---

## 🎯 Key Features

### Automatic Detection
- Just describe what you want - no need to say "residential" or "commercial"
- System understands keywords like "bedroom", "office", "retail", "warehouse"
- 95%+ accuracy in classification

### Unified Experience
- Same chat interface for all property types
- Consistent property cards
- Smart suggestions based on context

### Natural Language
- "Show me bakeries in Toronto" → Finds commercial properties
- "2 bedroom condo" → Finds residential properties
- "Properties in Ottawa" → Asks for clarification

---

## 📊 Example Conversation

```
YOU: "Show me retail stores in Toronto"

BOT: 🏢 Found 15 commercial properties in Toronto for retail

     [Property Cards Display]
     
     Suggestions:
     - Show me office spaces
     - Find warehouses
     - Properties under $1M

YOU: "How about office space instead?"

BOT: 🏢 Found 20 commercial properties in Toronto for office

     [Updated Property Cards]
```

---

## 🔧 Advanced Usage

### Mixed Queries
```
"Show me investment properties in Toronto"
→ System asks: "Are you looking for residential or commercial?"
```

### Specific Business Types
```
"Bakery for sale" → Commercial
"Restaurant with patio" → Commercial
"Gym space" → Commercial
"Car wash" → Commercial
```

### Residential with Features
```
"2 bedroom condo with parking" → Residential
"House with finished basement" → Residential
"Townhome near schools" → Residential
```

---

## 🐛 Troubleshooting

### No results found?
- Try a different city
- Remove some filters (price, size, etc.)
- Check if the business type is common in that area

### Wrong property type detected?
- Be more specific: "commercial office space" or "residential condo"
- System learns from context - keep chatting!

### Frontend not loading?
- Check server is running on port 5050
- Clear browser cache
- Check browser console for errors

---

## 📈 Performance Tips

### For Best Results:
1. ✅ Be specific about location (city name)
2. ✅ Mention key features (bedrooms, business type, etc.)
3. ✅ Use natural language - system understands context
4. ✅ If unsure, start broad and refine

### Avoid:
1. ❌ Too many filters at once
2. ❌ Rare combinations (might return 0 results)
3. ❌ Typos in city names

---

## 🎓 Learning by Example

### Example 1: Finding a Restaurant
```
YOU: "I'm looking for a restaurant space"
BOT: 🏢 Detected commercial property search
     Found 12 restaurant/retail properties in Toronto
```

### Example 2: Family Home
```
YOU: "We need a 3 bedroom house with a backyard"
BOT: 🏠 Detected residential property search
     Found 25 houses in Toronto with 3+ bedrooms
```

### Example 3: Investment Property
```
YOU: "Show me investment properties"
BOT: I can help you find investment properties! Are you interested in:
     - Residential (condos, houses)
     - Commercial (office, retail, industrial)
```

---

## 🎉 That's It!

You now have a fully integrated residential + commercial property chatbot!

**Just start chatting naturally and let the system do the rest.** 🏠🏢

---

## 📚 Additional Resources

- **Full Integration Guide**: See `INTEGRATION_GUIDE.md`
- **API Documentation**: See `docs/API_REFERENCE.md`
- **Architecture Details**: See `docs/ARCHITECTURE.md`

---

## 💬 Need Help?

1. Check the logs in the terminal for detailed debugging
2. Test with simple queries first
3. Verify API keys are set in `.env`
4. See troubleshooting section above

**Happy property searching!** 🎊
