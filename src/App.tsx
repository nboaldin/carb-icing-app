import { useState, useEffect } from 'react';
import { Input } from './components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { cn } from './lib/utils';
import CasaCarbIcingChart from './components/CasaCarbIcingChart';
import HumidityCarbIcePotentialChart from './components/HumidityCarbIcePotentialChart';
import './index.css';

const CarbIcingCalculator: React.FC = () => {
    const [temp, setTemp] = useState<string>('');
    const [dewPoint, setDewPoint] = useState<string>('');
    const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
    const [icingRisk, setIcingRisk] = useState<string | null>(null);
    const [tempInput, setTempInput] = useState<string>('');
    const [dewPointInput, setDewPointInput] = useState<string>('');

    // Temperature conversion functions
    const cToF = (c: number) => c * 9/5 + 32;
    const fToC = (f: number) => (f - 32) * 5/9;

    // Update input values when unit changes
    useEffect(() => {
        if (temp) {
            const tempNum = parseFloat(temp);
            setTempInput(tempUnit === 'F' ? cToF(tempNum).toString() : tempNum.toString());
        }
        if (dewPoint) {
            const dewPointNum = parseFloat(dewPoint);
            setDewPointInput(tempUnit === 'F' ? cToF(dewPointNum).toString() : dewPointNum.toString());
        }
    }, [tempUnit]);

    // Handle input changes
    const handleTempInputChange = (value: string) => {
        setTempInput(value);
        if (!value) {
            setTemp('');
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        
        if (tempUnit === 'F') {
            setTemp(fToC(numValue).toString());
        } else {
            setTemp(numValue.toString());
        }
        
        // If dew point is set and would exceed new temperature, adjust it
        if (dewPoint) {
            const dewPointNum = parseFloat(dewPoint);
            const newTempNum = tempUnit === 'F' ? fToC(numValue) : numValue;
            if (dewPointNum > newTempNum) {
                const adjustedDewPoint = tempUnit === 'F' ? cToF(newTempNum) : newTempNum;
                setDewPoint(newTempNum.toString());
                setDewPointInput(adjustedDewPoint.toString());
            }
        }
    };

    const handleDewPointInputChange = (value: string) => {
        setDewPointInput(value);
        if (!value) {
            setDewPoint('');
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        
        // Convert to Celsius for comparison
        const dewPointCelsius = tempUnit === 'F' ? fToC(numValue) : numValue;
        const tempCelsius = temp ? parseFloat(temp) : 0;
        
        // Prevent dew point from exceeding temperature
        if (dewPointCelsius > tempCelsius && temp) {
            // Cap dew point at temperature
            const cappedDewPoint = tempUnit === 'F' ? cToF(tempCelsius) : tempCelsius;
            setDewPoint(tempCelsius.toString());
            setDewPointInput(cappedDewPoint.toString());
            return;
        }
        
        if (tempUnit === 'F') {
            setDewPoint(fToC(numValue).toString());
        } else {
            setDewPoint(numValue.toString());
        }
    };

    const calculateIcingRisk = (
        temp: string,
        dewPoint: string
    ): string | null => {
        const tempNum = parseFloat(temp);
        const dewPointNum = parseFloat(dewPoint);
        if (isNaN(tempNum) || isNaN(dewPointNum)) return null;

        const dewPointDepression = tempNum - dewPointNum;
        
        // Serious icing - any power (darkest blue)
        if (tempNum >= 0 && tempNum <= 20 && dewPointDepression >= 0 && dewPointDepression <= 8) {
            return 'Serious icing - any power';
        }
        
        // Serious icing - descent power (lighter blue within medium blue)
        if (tempNum >= 0 && tempNum <= 20 && dewPointDepression >= 0 && dewPointDepression <= 12) {
            return 'Serious icing - descent power';
        }
        
        // Moderate icing - cruise power, or Serious icing - descent power (medium blue)
        if (tempNum >= 0 && tempNum <= 30 && dewPointDepression >= 0 && dewPointDepression <= 15) {
            return 'Moderate icing - cruise power, or Serious icing - descent power';
        }
        
        // Light icing - cruise or descent power (lightest blue)
        if (tempNum >= 0 && tempNum <= 40 && dewPointDepression >= 0 && dewPointDepression <= 25) {
            return 'Light icing - cruise or descent power';
        }
        
        return 'No icing';
    };

    useEffect(() => {
        const risk = calculateIcingRisk(temp, dewPoint);
        setIcingRisk(risk);
    }, [temp, dewPoint]);

    const getRiskColor = (): string => {
        switch (icingRisk) {
            case 'Serious icing - any power':
                return 'bg-red-600';
            case 'Serious icing - descent power':
                return 'bg-orange-500';
            case 'Moderate icing - cruise power, or Serious icing - descent power':
                return 'bg-yellow-500';
            case 'Light icing - cruise or descent power':
                return 'bg-blue-400';
            case 'No icing':
                return 'bg-green-500';
            default:
                return 'bg-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Carburetor Icing Probability Chart</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Based on Australian Government CASA chart. Enter temperature and dew point to calculate icing risk.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Temperature ({tempUnit === 'C' ? '°C' : '°F'})
                            </label>
                            <Input
                                type="number"
                                value={tempInput}
                                onChange={(e) => handleTempInputChange(e.target.value)}
                                placeholder={`Enter temperature in ${tempUnit === 'C' ? 'Celsius' : 'Fahrenheit'}`}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dew Point ({tempUnit === 'C' ? '°C' : '°F'})
                            </label>
                            <Input
                                type="number"
                                value={dewPointInput}
                                onChange={(e) => handleDewPointInputChange(e.target.value)}
                                placeholder={`Enter dew point in ${tempUnit === 'C' ? 'Celsius' : 'Fahrenheit'}`}
                                className="w-full"
                            />
                            {temp && dewPoint && parseFloat(dewPoint) >= parseFloat(temp) && (
                                <p className="text-xs text-orange-600 mt-1">
                                    Note: Dew point cannot exceed temperature (100% humidity limit)
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Temperature Unit
                            </label>
                            <Select value={tempUnit} onValueChange={(value: string) => setTempUnit(value as 'C' | 'F')}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select temperature unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="C">Celsius (°C)</SelectItem>
                                    <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {icingRisk && (
                            <div className="flex items-center">
                                <label className="block text-sm font-medium text-gray-700 mr-2">
                                    Icing Risk:
                                </label>
                                <div
                                    className={cn(
                                        'px-3 py-1 rounded-md text-white text-sm',
                                        getRiskColor()
                                    )}
                                >
                                    {icingRisk}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">CASA Chart (Dew Point Depression)</h3>
                                <CasaCarbIcingChart temp={temp} dewPoint={dewPoint} tempUnit={tempUnit} />
                                <div className="mt-4 text-xs text-gray-600">
                                    <p className="font-semibold mb-2">Chart Legend:</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(25, 25, 112, 0.6)'}}></div>
                                            <span>Serious icing - any power</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(70, 130, 180, 0.5)'}}></div>
                                            <span>Serious icing - descent power</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(100, 149, 237, 0.4)'}}></div>
                                            <span>Moderate icing - cruise power</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(173, 216, 230, 0.3)'}}></div>
                                            <span>Light icing - cruise/descent</span>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Carb Ice Potential (Relative Humidity)</h3>
                                <HumidityCarbIcePotentialChart temp={temp} dewPoint={dewPoint} tempUnit={tempUnit} />
                                <div className="mt-4 text-xs text-gray-600">
                                    <p className="font-semibold mb-2">Chart Legend:</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(100, 149, 237, 0.3)'}}></div>
                                            <span>Icing (glide and cruise power)</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(255, 255, 0, 0.4)'}}></div>
                                            <span>Serious icing (glide power)</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(255, 165, 0, 0.5)'}}></div>
                                            <span>Serious icing (cruise power)</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(34, 139, 34, 0.6)'}}></div>
                                            <span>Icing (pressure-type carburetors)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CarbIcingCalculator;
