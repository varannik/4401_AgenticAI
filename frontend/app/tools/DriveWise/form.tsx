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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            totalDays: 1,
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const response = await fetch('/api/drivewise/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    total_days: values.totalDays
                }),
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
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className={`bg-white/30 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/20 hover:bg-white/40 transition-all duration-300 w-full ${recommendation ? 'max-w-6xl' : 'max-w-lg'}`}>
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            🚗 DriveWise - Smart Car Decision
                        </h2>
                        <p className="text-gray-600 text-sm">
                            AI-powered recommendations for Dubai car needs
                        </p>
                    </div>

                    {!recommendation && (
                        <>
                            {/* Tabs Section */}
                            <div className="mb-8">
                                <Tabs value={selectionMethod} onValueChange={handleTabChange}>
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="manual" className="text-sm font-medium">
                                            Manual Selection
                                        </TabsTrigger>
                                        <TabsTrigger value="date" className="text-sm font-medium">
                                            Date Range
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContents>
                                        <TabsContent value="manual">
                                            <div className="space-y-6">
                                                {/* Time Unit and Quantity Section */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Time Unit Selector */}
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Time Unit
                                                        </label>
                                                        <Select value={timeUnit} onValueChange={(value) => setTimeUnit(value)}>
                                                            <SelectTrigger className="w-full border-2 border-gray-100 rounded-lg hover:border-blue-200">
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
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Quantity
                                                        </label>
                                                        <div className="flex items-center justify-center space-x-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualCount(Math.max(1, manualCount - 1))}
                                                                className="w-8 h-8 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-full hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-gray-500 hover:text-red-600 font-bold text-sm shadow-sm hover:shadow-md"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={manualCount}
                                                                onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                                min="1"
                                                                className="w-16 text-center text-xl font-bold text-gray-800 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualCount(manualCount + 1)}
                                                                className="w-8 h-8 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-full hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-gray-500 hover:text-green-600 font-bold text-sm shadow-sm hover:shadow-md"
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

                            {/* Form Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="totalDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-gray-700">
                                                        Total Duration (days)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input 
                                                                name={field.name}
                                                                value={totalDays}
                                                                onChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                type="number"
                                                                min="1"
                                                                readOnly
                                                                className="w-full px-4 py-3 text-lg font-semibold text-center bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-gray-500 text-sm">days</span>
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
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
                                    📍 Dubai, UAE • {recommendation.total_days} days
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


