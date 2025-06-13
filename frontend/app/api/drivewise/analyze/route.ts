import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Types for the recommendation system
interface CostBreakdown {
  daily_cost: number;
  total_cost: number;
  depreciation?: number;
  maintenance?: number;
  fuel?: number;
  insurance?: number;
  registration?: number;
  driver_salary?: number;
  tolls?: number;
  parking?: number;
}

interface RecommendationOption {
  option_type: 'rent' | 'buy' | 'driver';
  cost_breakdown: CostBreakdown;
  pros: string[];
  cons: string[];
  suitability_score: number;
}

interface CarRecommendationResponse {
  recommended_option: 'rent' | 'buy' | 'driver';
  confidence_score: number;
  options: RecommendationOption[];
  reasoning: string;
  duration_category: 'short_term' | 'medium_term' | 'long_term';
  total_days: number;
  location: string;
  distance_km?: number;
  origin_office?: string;
  site_stay_days?: number;
}

// Dubai market prices (2024 estimates in AED)
const DUBAI_PRICES = {
  car_rental_per_day: 120,
  car_purchase_mid_range: 75000,
  driver_per_day: 200,
  fuel_per_day: 25,
  insurance_annual: 2500,
  registration_annual: 500,
  maintenance_annual: 3000,
  depreciation_rate_annual: 0.20,
  salik_tolls_per_day: 8,
  parking_per_day: 15
};

class DriveWiseAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private calculateCosts(totalDays: number, distanceKm?: number, siteStayDays?: number) {
    const costs = {
      rent: this.calculateRentCosts(totalDays, distanceKm, siteStayDays),
      buy: this.calculateBuyCosts(totalDays, distanceKm, siteStayDays),
      driver: this.calculateDriverCosts(totalDays, distanceKm, siteStayDays)
    };
    return costs;
  }

  private calculateRentCosts(totalDays: number, distanceKm?: number, siteStayDays?: number): CostBreakdown {
    const dailyRental = DUBAI_PRICES.car_rental_per_day;
    let dailyFuel = DUBAI_PRICES.fuel_per_day;
    const dailyTolls = DUBAI_PRICES.salik_tolls_per_day;
    const dailyParking = DUBAI_PRICES.parking_per_day;
    
    // Adjust fuel costs based on distance (if provided)
    if (distanceKm) {
      // Assuming 12 km/l fuel efficiency and AED 2.5 per liter
      const fuelCostPerKm = 2.5 / 12;
      const roundTripFuel = distanceKm * 2 * fuelCostPerKm; // Round trip
      dailyFuel = DUBAI_PRICES.fuel_per_day + (roundTripFuel / totalDays);
    }
    
    // Add accommodation costs for site stays
    let accommodationCost = 0;
    if (siteStayDays && siteStayDays > 0) {
      const hotelPerNight = 300; // AED per night in Fujairah
      accommodationCost = hotelPerNight * siteStayDays;
    }
    
    const dailyCost = dailyRental + dailyFuel + dailyTolls + dailyParking;
    const totalCost = (dailyCost * totalDays) + accommodationCost;

    return {
      daily_cost: totalCost / totalDays,
      total_cost: totalCost,
      fuel: dailyFuel * totalDays,
      tolls: dailyTolls * totalDays,
      parking: dailyParking * totalDays
    };
  }

  private calculateBuyCosts(totalDays: number, distanceKm?: number, siteStayDays?: number): CostBreakdown {
    const carPrice = DUBAI_PRICES.car_purchase_mid_range;
    const annualInsurance = DUBAI_PRICES.insurance_annual;
    const annualRegistration = DUBAI_PRICES.registration_annual;
    const annualMaintenance = DUBAI_PRICES.maintenance_annual;
    const depreciationRate = DUBAI_PRICES.depreciation_rate_annual;
    
    // Calculate proportional costs for the period
    const periodFactor = totalDays / 365;
    const periodInsurance = annualInsurance * periodFactor;
    const periodRegistration = annualRegistration * periodFactor;
    const periodMaintenance = annualMaintenance * periodFactor;
    const periodDepreciation = carPrice * depreciationRate * periodFactor;
    
    let periodFuel = DUBAI_PRICES.fuel_per_day * totalDays;
    // Adjust fuel costs based on distance (if provided)
    if (distanceKm) {
      // Assuming 12 km/l fuel efficiency and AED 2.5 per liter
      const fuelCostPerKm = 2.5 / 12;
      const roundTripFuel = distanceKm * 2 * fuelCostPerKm; // Round trip
      const dailyFuelWithDistance = DUBAI_PRICES.fuel_per_day + (roundTripFuel / totalDays);
      periodFuel = dailyFuelWithDistance * totalDays;
    }
    
    const periodTolls = DUBAI_PRICES.salik_tolls_per_day * totalDays;
    const periodParking = DUBAI_PRICES.parking_per_day * totalDays;
    
    // Add accommodation costs for site stays
    let accommodationCost = 0;
    if (siteStayDays && siteStayDays > 0) {
      const hotelPerNight = 300; // AED per night in Fujairah
      accommodationCost = hotelPerNight * siteStayDays;
    }
    
    const totalCost = carPrice + periodInsurance + periodRegistration + 
                     periodMaintenance + periodDepreciation + periodFuel + 
                     periodTolls + periodParking + accommodationCost;
    const dailyCost = totalCost / totalDays;

    return {
      daily_cost: dailyCost,
      total_cost: totalCost,
      depreciation: periodDepreciation,
      maintenance: periodMaintenance,
      fuel: periodFuel,
      insurance: periodInsurance,
      registration: periodRegistration,
      tolls: periodTolls,
      parking: periodParking
    };
  }

  private calculateDriverCosts(totalDays: number, distanceKm?: number, siteStayDays?: number): CostBreakdown {
    const driverDaily = DUBAI_PRICES.driver_per_day;
    
    // Add accommodation costs for site stays
    let accommodationCost = 0;
    if (siteStayDays && siteStayDays > 0) {
      const hotelPerNight = 300; // AED per night in Fujairah
      accommodationCost = hotelPerNight * siteStayDays;
    }
    
    const dailyCost = driverDaily;
    const totalCost = (dailyCost * totalDays) + accommodationCost;

    return {
      daily_cost: totalCost / totalDays,
      total_cost: totalCost,
      driver_salary: driverDaily * totalDays
    };
  }

  private getDurationCategory(totalDays: number): 'short_term' | 'medium_term' | 'long_term' {
    if (totalDays <= 7) return 'short_term';
    if (totalDays <= 90) return 'medium_term';
    return 'long_term';
  }

  private generateRecommendations(totalDays: number, costs: any, distanceKm?: number, originOffice?: string): RecommendationOption[] {
    const durationCategory = this.getDurationCategory(totalDays);
    const recommendations: RecommendationOption[] = [];

    // RENT RECOMMENDATION
    const rentPros = [
      "No upfront investment required",
      "Maintenance and insurance included",
      "Flexibility to change car models",
      "No depreciation concerns",
      "24/7 roadside assistance typically included"
    ];
    const rentCons = [
      "Higher daily costs for long-term use",
      "No asset ownership",
      "Mileage restrictions may apply",
      "Availability issues during peak seasons"
    ];

    let rentScore = 9.0;
    if (durationCategory === 'medium_term') rentScore = 7.0;
    if (durationCategory === 'long_term') rentScore = 4.0;
    
    // Adjust score based on distance - rental cars good for long distances
    if (distanceKm && distanceKm > 200) rentScore += 1.0;
    if (originOffice === 'muscat') rentScore += 0.5; // Cross-border considerations

    recommendations.push({
      option_type: 'rent',
      cost_breakdown: costs.rent,
      pros: rentPros,
      cons: rentCons,
      suitability_score: rentScore
    });

    // BUY RECOMMENDATION
    const buyPros = [
      "Asset ownership and potential resale value",
      "No daily rental fees",
      "Complete freedom and flexibility",
      "Customization options",
      "Long-term cost efficiency"
    ];
    const buyCons = [
      "High upfront investment",
      "Depreciation in Dubai's harsh climate",
      "Maintenance and repair responsibilities",
      "Insurance and registration costs",
      "Parking and storage requirements"
    ];

    let buyScore = 2.0;
    if (durationCategory === 'medium_term') buyScore = 6.0;
    if (durationCategory === 'long_term') buyScore = 8.5;
    
    // Buying less attractive for long distances due to wear and tear
    if (distanceKm && distanceKm > 200) buyScore -= 0.5;
    if (originOffice === 'muscat') buyScore -= 1.0; // Cross-border complications

    recommendations.push({
      option_type: 'buy',
      cost_breakdown: costs.buy,
      pros: buyPros,
      cons: buyCons,
      suitability_score: buyScore
    });

    // DRIVER RECOMMENDATION
    const driverPros = [
      "No driving stress in Dubai traffic",
      "Professional local knowledge",
      "Productivity during commute",
      "No parking concerns",
      "Safety and convenience"
    ];
    const driverCons = [
      "Highest daily cost",
      "Less privacy and flexibility",
      "Dependency on driver availability",
      "Language barriers possible"
    ];

    let driverScore = 7.5;
    if (durationCategory === 'medium_term') driverScore = 6.5;
    if (durationCategory === 'long_term') driverScore = 5.0;
    
    // Driver service excellent for long distances and cross-border travel
    if (distanceKm && distanceKm > 200) driverScore += 1.5;
    if (originOffice === 'muscat') driverScore += 2.0; // Professional handling of cross-border

    recommendations.push({
      option_type: 'driver',
      cost_breakdown: costs.driver,
      pros: driverPros,
      cons: driverCons,
      suitability_score: driverScore
    });

    return recommendations;
  }

  async generateReasoning(totalDays: number, bestOption: RecommendationOption, costs: any, distanceKm?: number, originOffice?: string): Promise<string> {
    const distanceInfo = distanceKm ? `Distance from ${originOffice || 'origin'} to Fujairah: ${distanceKm}km` : '';
    
    const prompt = `You are a Dubai automotive consultant. Based on the analysis for ${totalDays} days, provide detailed reasoning for recommending ${bestOption.option_type}.

Cost comparison:
- Rent: ${costs.rent.total_cost.toFixed(0)} AED (${costs.rent.daily_cost.toFixed(0)} AED/day)
- Buy: ${costs.buy.total_cost.toFixed(0)} AED (${costs.buy.daily_cost.toFixed(0)} AED/day)
- Driver: ${costs.driver.total_cost.toFixed(0)} AED (${costs.driver.daily_cost.toFixed(0)} AED/day)

${distanceInfo ? `Travel details: ${distanceInfo}` : ''}

Consider Dubai-specific factors:
- Harsh climate affecting car depreciation
- Heavy traffic and parking challenges
- Salik toll system
- Insurance and registration requirements
- Fuel costs and maintenance
${distanceKm ? '- Long distance travel considerations and fuel efficiency' : ''}
${originOffice === 'muscat' ? '- Cross-border travel from Oman to UAE' : ''}

Provide clear, actionable advice in exactly 2 short sentences explaining why ${bestOption.option_type} is the best choice for this duration and distance.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert Dubai automotive consultant with deep knowledge of local market conditions, costs, and practical considerations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || "Analysis completed based on cost and duration factors.";
    } catch (error) {
      console.error('Error generating reasoning:', error);
      return `Based on the ${totalDays}-day analysis, ${bestOption.option_type} is recommended due to optimal cost-effectiveness and practical considerations for Dubai conditions.`;
    }
  }

  async analyze(
    totalDays: number, 
    distanceKm?: number, 
    originOffice?: string, 
    siteStayDays?: number
  ): Promise<CarRecommendationResponse> {
    // Calculate costs for all options (including distance considerations)
    const costs = this.calculateCosts(totalDays, distanceKm, siteStayDays);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(totalDays, costs, distanceKm, originOffice);
    
    // Find the best option
    const bestOption = recommendations.reduce((prev, current) => 
      current.suitability_score > prev.suitability_score ? current : prev
    );
    
    // Calculate confidence score
    const scores = recommendations.map(opt => opt.suitability_score);
    const maxScore = Math.max(...scores);
    const secondMaxScore = scores.sort((a, b) => b - a)[1];
    const confidence = Math.min(0.95, (maxScore - secondMaxScore) / 10 + 0.6);
    
    // Generate AI reasoning
    const reasoning = await this.generateReasoning(totalDays, bestOption, costs, distanceKm, originOffice);
    
    return {
      recommended_option: bestOption.option_type,
      confidence_score: confidence,
      options: recommendations,
      reasoning,
      duration_category: this.getDurationCategory(totalDays),
      total_days: totalDays,
      location: originOffice ? `${originOffice.charAt(0).toUpperCase() + originOffice.slice(1)} to Fujairah` : 'Dubai',
      distance_km: distanceKm,
      origin_office: originOffice,
      site_stay_days: siteStayDays
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { total_days, distance_km, origin_office, site_stay_days } = await request.json();

    // Validate input
    if (!total_days || total_days < 1) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Total days must be at least 1' },
        { status: 400 }
      );
    }

    if (total_days > 3650) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Total days cannot exceed 3650 (10 years)' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Configuration error', message: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create agent and analyze
    const agent = new DriveWiseAgent();
    const result = await agent.analyze(total_days, distance_km, origin_office, site_stay_days);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DriveWise analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to analyze car recommendation' },
      { status: 500 }
    );
  }
} 