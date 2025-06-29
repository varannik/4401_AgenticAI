'use client'

import { useState, useEffect } from 'react';
import { DatePickerWithRange } from '@/app/uIComponents/DatePickerWithRange';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    TabsContents,
} from "@/components/animate-ui/components/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    totalDays: z.number().min(1),
    distanceCalculationMethod: z.enum(['office-to-site', 'map-selection', 'manual-distance']),
    originOffice: z.enum(['muscat', 'dubai']),
    siteStayDays: z.number().min(0),
    destinationSite: z.string().optional(),
    customOriginCoords: z.object({
        lat: z.number(),
        lng: z.number()
    }).optional(),
    customDestinationCoords: z.object({
        lat: z.number(),
        lng: z.number()
    }).optional(),
    calculatedDistance: z.number().optional(),
    manualDistance: z.number().min(1).optional(),
    vehicleType: z.enum(['4x4', 'normal']),
    requiresOffroad: z.boolean(),
})

// Types for API response
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

export default function DriveWiseForm() {

    const [timeUnit, setTimeUnit] = useState('days');
    const [manualCount, setManualCount] = useState(1);
    const [dateRangeCount, setDateRangeCount] = useState(0);
    const [totalDays, setTotalDays] = useState(1);
    const [selectionMethod, setSelectionMethod] = useState<'manual' | 'date'>('manual');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<CarRecommendationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // New state variables for enhanced features
    const [distanceCalculationMethod, setDistanceCalculationMethod] = useState<'office-to-site' | 'map-selection' | 'manual-distance'>('office-to-site');
    const [originOffice, setOriginOffice] = useState<'muscat' | 'dubai'>('dubai');
    const [siteStayDays, setSiteStayDays] = useState(0);
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [customOriginCoords, setCustomOriginCoords] = useState<{lat: number, lng: number} | null>(null);
    const [customDestinationCoords, setCustomDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
    const [manualDistance, setManualDistance] = useState<number>(100);
    const [vehicleType, setVehicleType] = useState<'4x4' | 'normal'>('4x4');
    const [requiresOffroad, setRequiresOffroad] = useState<boolean>(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            totalDays: 1,
            distanceCalculationMethod: 'office-to-site',
            originOffice: 'dubai',
            siteStayDays: 0,
            manualDistance: 100,
            vehicleType: '4x4',
            requiresOffroad: true,
        },
    });

    const handleDateRangeChange = (days: number) => {
        setDateRangeCount(days);
        if (selectionMethod === 'date') {
            setTotalDays(days);
            form.setValue('totalDays', days);
        }
    };

    const handleTabChange = (value: string) => {
        setSelectionMethod(value as 'manual' | 'date');
        
        // When switching to date tab, use the date range count
        if (value === 'date' && dateRangeCount > 0) {
            setTotalDays(dateRangeCount);
            form.setValue('totalDays', dateRangeCount);
        }
        // When switching to manual tab, recalculate based on manual settings
        else if (value === 'manual') {
            let days = manualCount;
            switch (timeUnit) {
                case 'weeks':
                    days = manualCount * 7;
                    break;
                case 'months':
                    days = manualCount * 30;
                    break;
                case 'years':
                    days = manualCount * 365;
                    break;
            }
            setTotalDays(days);
            form.setValue('totalDays', days);
        }
    };

    useEffect(() => {
        if (selectionMethod === 'manual') {
            let days = manualCount;
            switch (timeUnit) {
                case 'weeks':
                    days = manualCount * 7;
                    break;
                case 'months':
                    days = manualCount * 30; // Approximate
                    break;
                case 'years':
                    days = manualCount * 365; // Approximate
                    break;
            }
            setTotalDays(days);
            form.setValue('totalDays', days);
        }
    }, [manualCount, timeUnit, selectionMethod, form]);

    // Initialize distance calculation
    useEffect(() => {
        if (distanceCalculationMethod === 'office-to-site') {
            const distance = calculateOfficeToSiteDistance(originOffice);
            setCalculatedDistance(distance);
            form.setValue('calculatedDistance', distance);
        }
    }, [distanceCalculationMethod, originOffice, form]);

    // Distance calculation function
    const calculateOfficeToSiteDistance = (office: 'muscat' | 'dubai'): number => {
        // Predefined distances to Fujairah site
        const distances = {
            muscat: 340, // approximately 340 km from Muscat to Fujairah
            dubai: 120,  // approximately 120 km from Dubai to Fujairah
        };
        return distances[office];
    };

    // Handle distance calculation method change
    const handleDistanceMethodChange = (method: 'office-to-site' | 'map-selection' | 'manual-distance') => {
        setDistanceCalculationMethod(method);
        form.setValue('distanceCalculationMethod', method);
        
        // Determine vehicle requirements based on route
        const { vehicleType: requiredVehicleType, requiresOffroad: offroad } = determineVehicleRequirement(method);
        setVehicleType(requiredVehicleType);
        setRequiresOffroad(offroad);
        form.setValue('vehicleType', requiredVehicleType);
        form.setValue('requiresOffroad', offroad);
        
        if (method === 'office-to-site') {
            const distance = calculateOfficeToSiteDistance(originOffice);
            setCalculatedDistance(distance);
            form.setValue('calculatedDistance', distance);
            form.setValue('manualDistance', undefined);
        } else if (method === 'manual-distance') {
            setCalculatedDistance(manualDistance);
            form.setValue('calculatedDistance', manualDistance);
            form.setValue('manualDistance', manualDistance);
        } else {
            setCalculatedDistance(null);
            form.setValue('calculatedDistance', undefined);
            form.setValue('manualDistance', undefined);
        }
    };

    // Handle origin office change
    const handleOriginOfficeChange = (office: 'muscat' | 'dubai') => {
        setOriginOffice(office);
        form.setValue('originOffice', office);
        
        if (distanceCalculationMethod === 'office-to-site') {
            const distance = calculateOfficeToSiteDistance(office);
            setCalculatedDistance(distance);
            form.setValue('calculatedDistance', distance);
        }
    };

    // Handle site stay days change
    const handleSiteStayDaysChange = (days: number) => {
        setSiteStayDays(days);
        form.setValue('siteStayDays', days);
    };

    const handleManualDistanceChange = (distance: number) => {
        setManualDistance(distance);
        form.setValue('manualDistance', distance);
        if (distanceCalculationMethod === 'manual-distance') {
            setCalculatedDistance(distance);
            form.setValue('calculatedDistance', distance);
        }
    };

    // Function to determine if 4x4 is required based on route
    const determineVehicleRequirement = (method: 'office-to-site' | 'map-selection' | 'manual-distance'): { vehicleType: '4x4' | 'normal', requiresOffroad: boolean } => {
        if (method === 'office-to-site') {
            // Office to Fujairah requires 4x4 due to 5km off-road access
            return { vehicleType: '4x4', requiresOffroad: true };
        } else {
            // Site-to-site or manual distance can use normal cars
            return { vehicleType: 'normal', requiresOffroad: false };
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const requestData = {
                total_days: values.totalDays,
                distance_calculation_method: values.distanceCalculationMethod,
                origin_office: values.originOffice,
                site_stay_days: values.siteStayDays,
                distance_km: values.distanceCalculationMethod === 'manual-distance' ? values.manualDistance : calculatedDistance,
                calculated_distance: calculatedDistance,
                manual_distance: values.manualDistance,
                custom_origin_coords: customOriginCoords,
                custom_destination_coords: customDestinationCoords,
                vehicle_type: values.vehicleType,
                requires_offroad: values.requiresOffroad,
            };

            const response = await fetch('/api/drivewise/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get recommendation');
            }

            const data: CarRecommendationResponse = await response.json();
            setRecommendation(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    const getOptionIcon = (type: string) => {
        switch (type) {
            case 'rent': return '🚗';
            case 'buy': return '🏪';
            case 'driver': return '👨‍✈️';
            default: return '🚗';
        }
    };

    const getOptionTitle = (type: string) => {
        switch (type) {
            case 'rent': return 'Rent a Car';
            case 'buy': return 'Buy a Car';
            case 'driver': return 'Hire with Driver';
            default: return type;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className={`bg-white/30 backdrop-blur-lg rounded-xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/20 hover:bg-white/40 transition-all duration-300 w-full ${recommendation ? 'max-w-6xl' : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl'}`}>
                    
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                            🚗 DriveWise - Smart Car Decision
                        </h2>
                        <p className="text-gray-600 text-sm">
                            AI-powered recommendations for Dubai car needs
                        </p>
                    </div>

                    {!recommendation && (
                        <>
                            {/* Distance Calculation Section */}
                            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold mr-3">1</span>
                                    📍 Distance & Location Settings
                                </h3>
                                
                                {/* Distance Calculation Method */}
                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                        Choose Distance Calculation Method
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                        <div 
                                            className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                                distanceCalculationMethod === 'office-to-site' 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                            onClick={() => handleDistanceMethodChange('office-to-site')}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    name="distanceMethod"
                                                    checked={distanceCalculationMethod === 'office-to-site'}
                                                    onChange={() => handleDistanceMethodChange('office-to-site')}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">🏢 Office to Fujairah Site</div>
                                                    <div className="text-xs sm:text-sm text-gray-600">Select from Muscat or Dubai office</div>
                                                    <div className="mt-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full inline-block">
                                                        🚙 4x4 Required (5km off-road)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div 
                                            className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                                distanceCalculationMethod === 'map-selection' 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                            onClick={() => handleDistanceMethodChange('map-selection')}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    name="distanceMethod"
                                                    checked={distanceCalculationMethod === 'map-selection'}
                                                    onChange={() => handleDistanceMethodChange('map-selection')}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">🗺️ Custom Map Selection</div>
                                                    <div className="text-xs sm:text-sm text-gray-600">Choose points on map</div>
                                                    <div className="mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full inline-block">
                                                        🚗 Normal Cars OK
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div 
                                            className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                                distanceCalculationMethod === 'manual-distance' 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                            onClick={() => handleDistanceMethodChange('manual-distance')}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    name="distanceMethod"
                                                    checked={distanceCalculationMethod === 'manual-distance'}
                                                    onChange={() => handleDistanceMethodChange('manual-distance')}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">📏 Manual Distance</div>
                                                    <div className="text-xs sm:text-sm text-gray-600">Enter distance manually</div>
                                                    <div className="mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full inline-block">
                                                        🚗 Normal Cars OK
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Origin Office Selection (only show if office-to-site is selected) */}
                                {distanceCalculationMethod === 'office-to-site' && (
                                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                            Select Origin Office
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                            <div 
                                                className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                                    originOffice === 'dubai' 
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                                onClick={() => handleOriginOfficeChange('dubai')}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="radio"
                                                        name="originOffice"
                                                        checked={originOffice === 'dubai'}
                                                        onChange={() => handleOriginOfficeChange('dubai')}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">🏙️ Dubai Office</div>
                                                        <div className="text-xs sm:text-sm text-gray-600">~120 km to Fujairah</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div 
                                                className={`p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                                    originOffice === 'muscat' 
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                                onClick={() => handleOriginOfficeChange('muscat')}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="radio"
                                                        name="originOffice"
                                                        checked={originOffice === 'muscat'}
                                                        onChange={() => handleOriginOfficeChange('muscat')}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">🏔️ Muscat Office</div>
                                                        <div className="text-xs sm:text-sm text-gray-600">~340 km to Fujairah</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Map Selection (placeholder for future implementation) */}
                                {distanceCalculationMethod === 'map-selection' && (
                                    <div className="space-y-4 mb-6">
                                        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">🚧</span>
                                                <div>
                                                    <h4 className="font-medium text-yellow-800">Map Selection Coming Soon</h4>
                                                    <p className="text-sm text-yellow-700">Interactive map selection will be available in the next update. For now, please use the office-to-site option.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Manual Distance Input */}
                                {distanceCalculationMethod === 'manual-distance' && (
                                    <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
                                        <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                                            Enter Distance (km)
                                        </label>
                                        <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-gray-200">
                                            <div className="flex flex-row items-center justify-center space-x-1 sm:space-x-6">
                                                <span className="text-xs sm:text-sm font-medium text-gray-600 w-12 sm:w-20 text-right">
                                                    <span className="hidden sm:inline">Distance:</span>
                                                    <span className="sm:hidden">Dist:</span>
                                                </span>
                                                <div className="flex items-center justify-center space-x-1 sm:space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleManualDistanceChange(Math.max(1, manualDistance - 10))}
                                                        className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-red-50 border-2 border-red-200 rounded-full hover:border-red-400 hover:bg-red-100 transition-all duration-200 text-red-600 hover:text-red-700 font-bold text-base sm:text-lg shadow-sm hover:shadow-md touch-manipulation"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={manualDistance}
                                                        onChange={(e) => handleManualDistanceChange(Math.max(1, parseInt(e.target.value) || 1))}
                                                        min="1"
                                                        className="w-16 sm:w-24 h-10 sm:h-10 text-center text-base sm:text-xl font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleManualDistanceChange(manualDistance + 10)}
                                                        className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-green-50 border-2 border-green-200 rounded-full hover:border-green-400 hover:bg-green-100 transition-all duration-200 text-green-600 hover:text-green-700 font-bold text-base sm:text-lg shadow-sm hover:shadow-md touch-manipulation"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-xs sm:text-sm font-medium text-gray-600 w-8 sm:w-20 text-left">km</span>
                                            </div>
                                            <div className="mt-3 sm:mt-4 text-center">
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    Enter the one-way distance for your trip. This will be used to calculate fuel and travel costs.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Site Stay Days */}
                                <div className="space-y-3 sm:space-y-4">
                                    <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                                        Site Stay Duration (optional)
                                    </label>
                                    <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-gray-200">
                                        <div className="flex flex-row items-center justify-center space-x-1 sm:space-x-6">
                                            <span className="text-xs sm:text-sm font-medium text-gray-600 w-12 sm:w-20 text-right">
                                                <span className="hidden sm:inline">Days at site:</span>
                                                <span className="sm:hidden">Days:</span>
                                            </span>
                                            <div className="flex items-center justify-center space-x-1 sm:space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSiteStayDaysChange(Math.max(0, siteStayDays - 1))}
                                                    className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-red-50 border-2 border-red-200 rounded-full hover:border-red-400 hover:bg-red-100 transition-all duration-200 text-red-600 hover:text-red-700 font-bold text-base sm:text-lg shadow-sm hover:shadow-md touch-manipulation"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    value={siteStayDays}
                                                    onChange={(e) => handleSiteStayDaysChange(Math.max(0, parseInt(e.target.value) || 0))}
                                                    min="0"
                                                    className="w-16 sm:w-20 h-10 sm:h-10 text-center text-base sm:text-xl font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSiteStayDaysChange(siteStayDays + 1)}
                                                    className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-green-50 border-2 border-green-200 rounded-full hover:border-green-400 hover:bg-green-100 transition-all duration-200 text-green-600 hover:text-green-700 font-bold text-base sm:text-lg shadow-sm hover:shadow-md touch-manipulation"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-gray-600 w-12 sm:w-20 text-left">days</span>
                                        </div>
                                        <div className="mt-3 sm:mt-4 text-center">
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                Number of days you plan to stay at the site (affects accommodation and daily costs)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Distance Display */}
                                {calculatedDistance && (
                                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                                            <span className="text-base sm:text-lg font-semibold text-blue-800 flex items-center">
                                                📏 <span className="ml-2">Calculated Distance:</span>
                                            </span>
                                            <span className="text-xl sm:text-2xl font-bold text-blue-600">{calculatedDistance} km</span>
                                        </div>
                                    </div>
                                )}

                                {/* Vehicle Type Requirement Display */}
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                                        <span className="text-base sm:text-lg font-semibold text-orange-800 flex items-center">
                                            {vehicleType === '4x4' ? '🚙' : '🚗'} <span className="ml-2">Vehicle Requirement:</span>
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                vehicleType === '4x4' 
                                                    ? 'bg-orange-100 text-orange-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {vehicleType === '4x4' ? '4x4 Vehicle Required' : 'Normal Car Suitable'}
                                            </span>
                                        </div>
                                    </div>
                                    {requiresOffroad && (
                                        <div className="mt-2 text-xs sm:text-sm text-orange-700 bg-orange-100 p-2 rounded-lg">
                                            ⚠️ <strong>Off-road Access:</strong> Fujairah site requires 5km off-road driving through rough terrain. 4x4 vehicles are mandatory for safety and accessibility.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Duration Selection Section */}
                            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-sm font-bold mr-3">2</span>
                                    ⏱️ Duration Selection
                                </h3>
                                <Tabs value={selectionMethod} onValueChange={handleTabChange}>
                                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-12">
                                        <TabsTrigger value="manual" className="text-xs sm:text-sm font-medium py-1 sm:py-2 px-2 sm:px-3 h-8 sm:h-10">
                                            Manual Selection
                                        </TabsTrigger>
                                        <TabsTrigger value="date" className="text-xs sm:text-sm font-medium py-1 sm:py-2 px-2 sm:px-3 h-8 sm:h-10">
                                            Date Range
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContents>
                                        <TabsContent value="manual">
                                            <div className="space-y-4 sm:space-y-6">
                                                {/* Time Unit and Quantity Section */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                    {/* Time Unit Selector */}
                                                    <div className="space-y-2 sm:space-y-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Time Unit
                                                        </label>
                                                        <Select value={timeUnit} onValueChange={(value) => setTimeUnit(value)}>
                                                            <SelectTrigger className="w-full border-2 border-gray-100 rounded-lg hover:border-blue-200 h-12 sm:h-auto">
                                                                <SelectValue placeholder="Select time unit" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="days">Days</SelectItem>
                                                                <SelectItem value="weeks">Weeks</SelectItem>
                                                                <SelectItem value="months">Months</SelectItem>
                                                                <SelectItem value="years">Years</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Counter Section */}
                                                    <div className="space-y-2 sm:space-y-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Quantity
                                                        </label>
                                                        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualCount(Math.max(1, manualCount - 1))}
                                                                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-full hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-gray-500 hover:text-red-600 font-bold text-lg sm:text-sm shadow-sm hover:shadow-md touch-manipulation"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={manualCount}
                                                                onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                                min="1"
                                                                className="w-16 sm:w-16 h-10 sm:h-auto text-center text-lg sm:text-xl font-bold text-gray-800 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualCount(manualCount + 1)}
                                                                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-full hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-gray-500 hover:text-green-600 font-bold text-lg sm:text-sm shadow-sm hover:shadow-md touch-manipulation"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="date">
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Select Date Range
                                                </label>
                                                <div className="flex justify-center">
                                                    <DatePickerWithRange onDateRangeChange={handleDateRangeChange} />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </TabsContents>
                                </Tabs>
                            </div>

                            {/* Analysis Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="mb-4 flex items-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-sm font-bold mr-3">3</span>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">🤖 AI Analysis</h3>
                                </div>

                                {/* User Selections Summary */}
                                <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                        📋 Your Selections Summary
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                                        {/* Distance Method */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                            <div className="font-medium text-gray-700 mb-1">📍 Distance Method</div>
                                            <div className="text-gray-600">
                                                {distanceCalculationMethod === 'office-to-site' && '🏢 Office to Site'}
                                                {distanceCalculationMethod === 'map-selection' && '🗺️ Map Selection'}
                                                {distanceCalculationMethod === 'manual-distance' && '📏 Manual Distance'}
                                            </div>
                                        </div>

                                        {/* Origin Office (if applicable) */}
                                        {distanceCalculationMethod === 'office-to-site' && (
                                            <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                                <div className="font-medium text-gray-700 mb-1">🏢 Origin Office</div>
                                                <div className="text-gray-600">
                                                    {originOffice === 'dubai' && '🏙️ Dubai Office'}
                                                    {originOffice === 'muscat' && '🏔️ Muscat Office'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Distance */}
                                        {calculatedDistance && (
                                            <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                                <div className="font-medium text-gray-700 mb-1">📏 Distance</div>
                                                <div className="text-gray-600 font-semibold">{calculatedDistance} km</div>
                                            </div>
                                        )}

                                        {/* Site Stay Days */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                            <div className="font-medium text-gray-700 mb-1">🏕️ Site Stay</div>
                                            <div className="text-gray-600">
                                                {siteStayDays > 0 ? `${siteStayDays} days` : 'No stay'}
                                            </div>
                                        </div>

                                        {/* Duration Method */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                            <div className="font-medium text-gray-700 mb-1">⏱️ Duration Method</div>
                                            <div className="text-gray-600">
                                                {selectionMethod === 'manual' ? '📝 Manual Selection' : '📅 Date Range'}
                                            </div>
                                        </div>

                                        {/* Vehicle Type */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                            <div className="font-medium text-gray-700 mb-1">
                                                {vehicleType === '4x4' ? '🚙' : '🚗'} Vehicle Type
                                            </div>
                                            <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                                                vehicleType === '4x4' 
                                                    ? 'bg-orange-100 text-orange-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {vehicleType === '4x4' ? '4x4 Required' : 'Normal Car OK'}
                                            </div>
                                        </div>

                                        {/* Total Days */}
                                        <div className="bg-white/70 rounded-lg p-3 border border-purple-100 sm:col-span-2 lg:col-span-1">
                                            <div className="font-medium text-gray-700 mb-1">📊 Total Duration</div>
                                            <div className="text-gray-600 font-bold text-base sm:text-lg text-purple-600">
                                                {totalDays} days
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        
                                        
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    <span>Analyzing with AI...</span>
                                                </div>
                                            ) : (
                                                '🤖 Get AI Recommendation'
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-red-500">❌</span>
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Results Section */}
                    {recommendation && (
                        <div className="space-y-8">
                            {/* Back Button */}
                            <div className="flex justify-between items-center">
                                <Button 
                                    onClick={() => setRecommendation(null)}
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <span>←</span>
                                    <span>New Analysis</span>
                                </Button>
                                <div className="text-sm text-gray-600">
                                    📍 {recommendation.origin_office ? 
                                        `${recommendation.origin_office.charAt(0).toUpperCase() + recommendation.origin_office.slice(1)} to Fujairah` : 
                                        'Dubai, UAE'
                                    } • {recommendation.total_days} days
                                    {recommendation.distance_km && ` • ${recommendation.distance_km} km`}
                                    {recommendation.site_stay_days && recommendation.site_stay_days > 0 && ` • ${recommendation.site_stay_days} days at site`}
                                </div>
                            </div>

                            {/* Recommendation Header */}
                            <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                                <div className="text-6xl mb-4">{getOptionIcon(recommendation.recommended_option)}</div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                                    Recommended: {getOptionTitle(recommendation.recommended_option)}
                                </h3>
                                <div className="flex justify-center items-center space-x-6 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <span>🎯</span>
                                        <span>Confidence: {(recommendation.confidence_score * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span>⏱️</span>
                                        <span>{recommendation.duration_category.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-6 mt-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">💡 AI Analysis</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{recommendation.reasoning}</p>
                                </div>
                            </div>

                            {/* Options Comparison */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {recommendation.options.map((option) => (
                                    <div 
                                        key={option.option_type}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                            option.option_type === recommendation.recommended_option
                                                ? 'border-green-400 bg-green-50 shadow-lg scale-105'
                                                : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="text-center mb-6">
                                            <div className="text-4xl mb-3">{getOptionIcon(option.option_type)}</div>
                                            <h4 className="text-xl font-bold text-gray-800">{getOptionTitle(option.option_type)}</h4>
                                            <div className="flex items-center justify-center space-x-2 mt-2">
                                                <span className="text-sm text-gray-600">Score: {option.suitability_score}/10</span>
                                            </div>
                                        </div>

                                        {/* Cost Breakdown */}
                                        <div className="mb-6 p-4 bg-white/80 rounded-lg border">
                                            <div className="text-center mb-3">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {formatCurrency(option.cost_breakdown.total_cost)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    ({formatCurrency(option.cost_breakdown.daily_cost)}/day)
                                                </div>
                                            </div>
                                            
                                            {/* Detailed Cost Breakdown */}
                                            <div className="space-y-1 text-xs text-gray-600">
                                                {option.cost_breakdown.fuel && option.cost_breakdown.fuel > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>⛽ Fuel:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.fuel)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.depreciation && option.cost_breakdown.depreciation > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>📉 Depreciation:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.depreciation)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.maintenance && option.cost_breakdown.maintenance > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>🔧 Maintenance:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.maintenance)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.insurance && option.cost_breakdown.insurance > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>🛡️ Insurance:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.insurance)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.driver_salary && option.cost_breakdown.driver_salary > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>👨‍✈️ Driver:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.driver_salary)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.tolls && option.cost_breakdown.tolls > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>🛣️ Tolls:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.tolls)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.parking && option.cost_breakdown.parking > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>🅿️ Parking:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.parking)}</span>
                                                    </div>
                                                )}
                                                {option.cost_breakdown.registration && option.cost_breakdown.registration > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>📋 Registration:</span>
                                                        <span>{formatCurrency(option.cost_breakdown.registration)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pros and Cons */}
                                        <div className="space-y-4">
                                            <div>
                                                <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                                                    <span className="mr-1">✅</span> Advantages
                                                </h5>
                                                <ul className="text-xs text-gray-600 space-y-1">
                                                    {option.pros.slice(0, 2).map((pro, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="mr-2 text-green-500">•</span>
                                                            <span>{pro}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                                                    <span className="mr-1">❌</span> Disadvantages
                                                </h5>
                                                <ul className="text-xs text-gray-600 space-y-1">
                                                    {option.cons.slice(0, 2).map((con, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="mr-2 text-red-500">•</span>
                                                            <span>{con}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Info */}
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">
                                    💡 Analysis powered by AI • Prices based on 2024 Dubai market rates • 
                                    Includes depreciation, tolls, maintenance, and all associated costs
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}


