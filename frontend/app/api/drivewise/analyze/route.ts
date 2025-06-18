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
  car_rental_4x4_per_day: 180, // 4x4 vehicles cost more to rent
  car_purchase_mid_range: 75000,
  car_purchase_4x4: 110000, // 4x4 vehicles cost more to buy
  driver_per_day: 200,
  driver_4x4_per_day: 250, // 4x4 driver service costs more
  fuel_per_day: 25,
  fuel_4x4_per_day: 35, // 4x4 vehicles consume more fuel
  insurance_annual: 2500,
  insurance_4x4_annual: 3500, // Higher insurance for 4x4
  registration_annual: 500,
  maintenance_annual: 3000,
  maintenance_4x4_annual: 4500, // Higher maintenance for 4x4
  depreciation_rate_annual: 0.20,
  depreciation_rate_4x4_annual: 0.22, // Slightly higher depreciation for 4x4
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

  private calculateCosts(totalDays: number, distanceKm?: number, siteStayDays?: number, vehicleType?: string, requiresOffroad?: boolean) {
    const costs = {
      rent: this.calculateRentCosts(totalDays, distanceKm, siteStayDays, vehicleType),
      buy: this.calculateBuyCosts(totalDays, distanceKm, siteStayDays, vehicleType),
      driver: this.calculateDriverCosts(totalDays, distanceKm, siteStayDays, vehicleType)
    };
    return costs;
  }

  private calculateRentCosts(totalDays: number, distanceKm?: number, siteStayDays?: number, vehicleType?: string): CostBreakdown {
    const is4x4 = vehicleType === '4x4';
    const dailyRental = is4x4 ? DUBAI_PRICES.car_rental_4x4_per_day : DUBAI_PRICES.car_rental_per_day;
    let dailyFuel = is4x4 ? DUBAI_PRICES.fuel_4x4_per_day : DUBAI_PRICES.fuel_per_day;
    const dailyTolls = DUBAI_PRICES.salik_tolls_per_day;
    const dailyParking = DUBAI_PRICES.parking_per_day;
    
    // Adjust fuel costs based on distance (if provided)
    if (distanceKm) {
      // 4x4 vehicles have lower fuel efficiency (8 km/l vs 12 km/l for normal cars)
      const fuelEfficiency = is4x4 ? 8 : 12;
      const fuelCostPerKm = 2.5 / fuelEfficiency;
      const roundTripFuel = distanceKm * 2 * fuelCostPerKm; // Round trip
      const baseFuel = is4x4 ? DUBAI_PRICES.fuel_4x4_per_day : DUBAI_PRICES.fuel_per_day;
      dailyFuel = baseFuel + (roundTripFuel / totalDays);
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

  private calculateBuyCosts(totalDays: number, distanceKm?: number, siteStayDays?: number, vehicleType?: string): CostBreakdown {
    const is4x4 = vehicleType === '4x4';
    const carPrice = is4x4 ? DUBAI_PRICES.car_purchase_4x4 : DUBAI_PRICES.car_purchase_mid_range;
    const annualInsurance = is4x4 ? DUBAI_PRICES.insurance_4x4_annual : DUBAI_PRICES.insurance_annual;
    const annualRegistration = DUBAI_PRICES.registration_annual;
    const annualMaintenance = is4x4 ? DUBAI_PRICES.maintenance_4x4_annual : DUBAI_PRICES.maintenance_annual;
    const depreciationRate = is4x4 ? DUBAI_PRICES.depreciation_rate_4x4_annual : DUBAI_PRICES.depreciation_rate_annual;
    
    // Calculate proportional costs for the period
    const periodFactor = totalDays / 365;
    const periodInsurance = annualInsurance * periodFactor;
    const periodRegistration = annualRegistration * periodFactor;
    const periodMaintenance = annualMaintenance * periodFactor;
    const periodDepreciation = carPrice * depreciationRate * periodFactor;
    
    let periodFuel = (is4x4 ? DUBAI_PRICES.fuel_4x4_per_day : DUBAI_PRICES.fuel_per_day) * totalDays;
    // Adjust fuel costs based on distance (if provided)
    if (distanceKm) {
      // 4x4 vehicles have lower fuel efficiency (8 km/l vs 12 km/l for normal cars)
      const fuelEfficiency = is4x4 ? 8 : 12;
      const fuelCostPerKm = 2.5 / fuelEfficiency;
      const roundTripFuel = distanceKm * 2 * fuelCostPerKm; // Round trip
      const baseFuel = is4x4 ? DUBAI_PRICES.fuel_4x4_per_day : DUBAI_PRICES.fuel_per_day;
      const dailyFuelWithDistance = baseFuel + (roundTripFuel / totalDays);
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

  private calculateDriverCosts(totalDays: number, distanceKm?: number, siteStayDays?: number, vehicleType?: string): CostBreakdown {
    const is4x4 = vehicleType === '4x4';
    const driverDaily = is4x4 ? DUBAI_PRICES.driver_4x4_per_day : DUBAI_PRICES.driver_per_day;
    
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

  private generateRecommendations(totalDays: number, costs: any, distanceKm?: number, originOffice?: string, vehicleType?: string, requiresOffroad?: boolean): RecommendationOption[] {
    const durationCategory = this.getDurationCategory(totalDays);
    const is4x4 = vehicleType === '4x4';
    const recommendations: RecommendationOption[] = [];

    // RENT RECOMMENDATION
    let rentPros = [
      "No upfront investment required",
      "Maintenance and insurance included",
      "Flexibility to change car models",
      "No depreciation concerns",
      "24/7 roadside assistance typically included"
    ];
    let rentCons = [
      "Higher daily costs for long-term use",
      "No asset ownership",
      "Mileage restrictions may apply",
      "Availability issues during peak seasons"
    ];

    // Add 4x4 specific considerations
    if (is4x4) {
      rentPros.push("Professional off-road capable vehicles available");
      rentCons.push("Higher rental costs for 4x4 vehicles", "Limited 4x4 vehicle availability");
    }

    let rentScore = 9.0;
    if (durationCategory === 'medium_term') rentScore = 7.0;
    if (durationCategory === 'long_term') rentScore = 4.0;
    
    // Adjust score based on distance and vehicle type
    if (distanceKm && distanceKm > 200) rentScore += 1.0;
    if (originOffice === 'muscat') rentScore += 0.5;
    if (is4x4) rentScore += 1.5; // Rental companies handle 4x4 maintenance well

    recommendations.push({
      option_type: 'rent',
      cost_breakdown: costs.rent,
      pros: rentPros,
      cons: rentCons,
      suitability_score: Math.min(10, rentScore)
    });

    // BUY RECOMMENDATION
    let buyPros = [
      "Asset ownership and potential resale value",
      "No daily rental fees",
      "Complete freedom and flexibility",
      "Customization options",
      "Long-term cost efficiency"
    ];
    let buyCons = [
      "High upfront investment",
      "Depreciation in Dubai's harsh climate",
      "Maintenance and repair responsibilities",
      "Insurance and registration costs",
      "Parking and storage requirements"
    ];

    // Add 4x4 specific considerations
    if (is4x4) {
      buyPros.push("Ownership of specialized off-road vehicle", "Can handle Fujairah's rough terrain");
      buyCons.push("Higher purchase and maintenance costs", "More complex 4x4 systems to maintain", "Higher insurance premiums");
    }

    let buyScore = 2.0;
    if (durationCategory === 'medium_term') buyScore = 6.0;
    if (durationCategory === 'long_term') buyScore = 8.5;
    
    // Adjust for vehicle type and conditions
    if (distanceKm && distanceKm > 200) buyScore -= 0.5;
    if (originOffice === 'muscat') buyScore -= 1.0;
    if (is4x4 && requiresOffroad) buyScore -= 1.0; // Higher maintenance for off-road use

    recommendations.push({
      option_type: 'buy',
      cost_breakdown: costs.buy,
      pros: buyPros,
      cons: buyCons,
      suitability_score: Math.max(1, buyScore)
    });

    // DRIVER RECOMMENDATION
    let driverPros = [
      "No driving stress in Dubai traffic",
      "Professional local knowledge",
      "Productivity during commute",
      "No parking concerns",
      "Safety and convenience"
    ];
    let driverCons = [
      "Highest daily cost",
      "Less privacy and flexibility",
      "Dependency on driver availability",
      "Language barriers possible"
    ];

    // Add 4x4 specific considerations
    if (is4x4) {
      driverPros.push("Experienced off-road driving", "Professional handling of rough terrain", "No personal risk on dangerous roads");
      driverCons.push("Higher costs for 4x4 driver services", "Limited availability of 4x4 drivers");
    }

    let driverScore = 7.5;
    if (durationCategory === 'medium_term') driverScore = 6.5;
    if (durationCategory === 'long_term') driverScore = 5.0;
    
    // Driver service excellent for challenging conditions
    if (distanceKm && distanceKm > 200) driverScore += 1.5;
    if (originOffice === 'muscat') driverScore += 2.0;
    if (is4x4 && requiresOffroad) driverScore += 2.0; // Professional off-road driving is valuable

    recommendations.push({
      option_type: 'driver',
      cost_breakdown: costs.driver,
      pros: driverPros,
      cons: driverCons,
      suitability_score: Math.min(10, driverScore)
    });

    return recommendations;
  }

  async generateReasoning(totalDays: number, bestOption: RecommendationOption, costs: any, distanceKm?: number, originOffice?: string, vehicleType?: string, requiresOffroad?: boolean): Promise<string> {
    const distanceInfo = distanceKm ? `Distance from ${originOffice || 'origin'} to Fujairah: ${distanceKm}km` : '';
    const vehicleInfo = vehicleType === '4x4' ? '4x4 vehicle required for off-road access to Fujairah site (5km rough terrain)' : 'Normal vehicle suitable for this route';
    
    const prompt = `You are a Dubai automotive consultant. Based on the analysis for ${totalDays} days, provide detailed reasoning for recommending ${bestOption.option_type}.

Cost comparison:
- Rent: ${costs.rent.total_cost.toFixed(0)} AED (${costs.rent.daily_cost.toFixed(0)} AED/day)
- Buy: ${costs.buy.total_cost.toFixed(0)} AED (${costs.buy.daily_cost.toFixed(0)} AED/day)
- Driver: ${costs.driver.total_cost.toFixed(0)} AED (${costs.driver.daily_cost.toFixed(0)} AED/day)

${distanceInfo ? `Travel details: ${distanceInfo}` : ''}
Vehicle requirement: ${vehicleInfo}

Consider Dubai-specific factors:
- Harsh climate affecting car depreciation
- Heavy traffic and parking challenges
- Salik toll system
- Insurance and registration requirements
- Fuel costs and maintenance
${distanceKm ? '- Long distance travel considerations and fuel efficiency' : ''}
${originOffice === 'muscat' ? '- Cross-border travel from Oman to UAE' : ''}
${vehicleType === '4x4' ? '- Specialized 4x4 maintenance and insurance costs' : ''}
${requiresOffroad ? '- Off-road driving safety and vehicle capability requirements' : ''}

Provide clear, actionable advice in exactly 2 short sentences explaining why ${bestOption.option_type} is the best choice for this duration, distance, and vehicle requirement.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert Dubai automotive consultant with deep knowledge of local market conditions, costs, and practical considerations including 4x4 vehicle requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || "Analysis completed based on cost, duration, and vehicle requirement factors.";
    } catch (error) {
      console.error('Error generating reasoning:', error);
      return `Based on the ${totalDays}-day analysis requiring ${vehicleType || 'standard'} vehicle, ${bestOption.option_type} is recommended due to optimal cost-effectiveness and practical considerations for Dubai conditions.`;
    }
  }

  async analyze(
    totalDays: number, 
    distanceKm?: number, 
    originOffice?: string, 
    siteStayDays?: number,
    vehicleType?: string,
    requiresOffroad?: boolean
  ): Promise<CarRecommendationResponse> {
    // Calculate costs for all options (including distance considerations)
    const costs = this.calculateCosts(totalDays, distanceKm, siteStayDays, vehicleType, requiresOffroad);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(totalDays, costs, distanceKm, originOffice, vehicleType, requiresOffroad);
    
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
    const reasoning = await this.generateReasoning(totalDays, bestOption, costs, distanceKm, originOffice, vehicleType, requiresOffroad);
    
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
    const { total_days, distance_km, origin_office, site_stay_days, vehicle_type, requires_offroad } = await request.json();

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
    const result = await agent.analyze(total_days, distance_km, origin_office, site_stay_days, vehicle_type, requires_offroad);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DriveWise analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to analyze car recommendation' },
      { status: 500 }
    );
  }
} 