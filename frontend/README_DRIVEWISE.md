# DriveWise - AI Car Recommendation System

## Overview
DriveWise is an intelligent car recommendation system that analyzes whether it's better to rent, buy, or hire a car with driver in Dubai based on duration and comprehensive cost analysis.

## Features
- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT-4o-mini for intelligent recommendations
- 💰 **Comprehensive Cost Analysis**: Includes depreciation, maintenance, fuel, insurance, tolls, and driver costs
- 🏜️ **Dubai-Specific**: Tailored for Dubai market conditions and pricing
- 📊 **Visual Comparison**: Beautiful UI showing cost breakdowns and pros/cons
- ⏱️ **Flexible Duration**: Manual selection or date range picker

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the frontend directory and add your OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

You can get an API key from: https://platform.openai.com/api-keys

### 2. Install Dependencies
The required packages are already included in package.json:
- `openai`: For AI-powered analysis

### 3. Usage
1. Navigate to the DriveWise form
2. Select duration using either:
   - Manual selection (days/weeks/months/years)
   - Date range picker
3. Click "Get AI Recommendation"
4. View comprehensive analysis with cost breakdowns

## API Endpoints

### POST `/api/drivewise/analyze`
Analyzes car recommendations based on duration.

**Request Body:**
```json
{
  "total_days": 30
}
```

**Response:**
```json
{
  "recommended_option": "rent",
  "confidence_score": 0.85,
  "options": [
    {
      "option_type": "rent",
      "cost_breakdown": {
        "daily_cost": 168,
        "total_cost": 5040,
        "fuel": 750,
        "tolls": 240,
        "parking": 450
      },
      "pros": ["No upfront investment", "Maintenance included"],
      "cons": ["Higher daily costs for long-term"],
      "suitability_score": 9.0
    }
  ],
  "reasoning": "AI-generated detailed analysis...",
  "duration_category": "medium_term",
  "total_days": 30,
  "location": "Dubai"
}
```

## Cost Factors Considered

### Rent a Car
- Daily rental fees
- Fuel costs
- Salik tolls
- Parking fees
- Insurance (included)

### Buy a Car
- Purchase price (AED 75,000 mid-range)
- Depreciation (20% annually, adjusted for Dubai climate)
- Insurance (AED 2,500/year)
- Registration (AED 500/year)
- Maintenance (AED 3,000/year)
- Fuel costs
- Salik tolls
- Parking fees

### Hire with Driver
- Driver salary (AED 200/day)
- Fuel costs
- Salik tolls
- Parking fees
- Vehicle provided by driver service

## Dubai Market Prices (2024)
- Car rental: AED 120/day
- Mid-range car purchase: AED 75,000
- Driver service: AED 200/day
- Fuel: AED 25/day
- Insurance: AED 2,500/year
- Salik tolls: AED 8/day
- Parking: AED 15/day

## Duration Categories
- **Short-term**: 1-7 days (Rent recommended)
- **Medium-term**: 8-90 days (Flexible based on costs)
- **Long-term**: 90+ days (Buy often recommended)

## AI Analysis
The system uses OpenAI's GPT-4o-mini to provide:
- Detailed reasoning for recommendations
- Dubai-specific considerations
- Market condition analysis
- Practical advice based on duration and costs

## File Structure
```
frontend/
├── app/
│   ├── api/drivewise/analyze/route.ts    # API endpoint
│   └── tools/DriveWise/form.tsx          # Main form component
└── README_DRIVEWISE.md                   # This file
```

## Error Handling
- Input validation (1-3650 days)
- OpenAI API error handling
- Network error handling
- User-friendly error messages

## Future Enhancements
- Multiple car categories (economy, luxury, SUV)
- Insurance options
- Seasonal pricing adjustments
- Multi-city support
- Integration with real-time pricing APIs 