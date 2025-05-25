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



export default function DriveWiseForm() {

    const [timeUnit, setTimeUnit] = useState('days');
    const [manualCount, setManualCount] = useState(1);
    const [dateRangeCount, setDateRangeCount] = useState(0);
    const [totalDays, setTotalDays] = useState(1);
    const [selectionMethod, setSelectionMethod] = useState<'manual' | 'date'>('manual');

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

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }


    return (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-white/30 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/20 hover:bg-white/40 transition-all duration-300 w-full max-w-lg">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Duration Selection
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Choose how you want to specify the duration
                        </p>
                    </div>

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
                                                    <SelectTrigger className="w-full border-2 border-gray-100 rounded-lg hover:border-blue-200 hover:boarder-2 ">
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
                                    className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Submit Duration
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </main>
    )
}


