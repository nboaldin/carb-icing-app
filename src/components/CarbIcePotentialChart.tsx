import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CarbIcePotentialChartProps {
    temp: string;
    dewPoint: string;
    tempUnit: 'C' | 'F';
}

const CarbIcePotentialChart: React.FC<CarbIcePotentialChartProps> = ({ temp, dewPoint, tempUnit }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        // Set up dimensions
        const margin = { top: 20, right: 20, bottom: 60, left: 60 };
        const width = 500 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Convert Fahrenheit to Celsius for internal calculations
        const fToC = (f: number) => (f - 32) * 5/9;
        const cToF = (c: number) => c * 9/5 + 32;

        // Set up scales based on temperature unit
        const xScale = d3.scaleLinear()
            .domain(tempUnit === 'C' ? [0, 54] : [0, 110]) // 0-54°C or 0-110°F
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(tempUnit === 'C' ? [0, 32] : [0, 90]) // 0-32°C or 0-90°F
            .range([height, 0]);

        // Define curved regions using D3 path generators
        const line = d3.line<[number, number]>()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Define regions based on temperature unit
        let blueIcingPath: [number, number][];
        let yellowSeriousPath: [number, number][];
        let orangeSeriousPath: [number, number][];
        let greenPressurePath: [number, number][];

        if (tempUnit === 'C') {
            // Celsius regions (properly scaled from Fahrenheit)
            blueIcingPath = [
                [0, 0], [38, 0], [38, 27], [32, 29], [21, 32], [10, 29], [4, 27], [0, 21]
            ];
            yellowSeriousPath = [
                [0, 0], [27, 0], [27, 21], [21, 24], [10, 27], [4, 24], [0, 18]
            ];
            orangeSeriousPath = [
                [0, 0], [16, 0], [16, 10], [10, 13], [4, 16], [0, 13]
            ];
            greenPressurePath = [
                [0, 0], [10, 0], [10, 5], [5, 8], [0, 8], [0, 5]
            ];
        } else {
            // Fahrenheit regions (original)
            blueIcingPath = [
                [0, 0], [110, 0], [110, 80], [90, 85], [70, 90], [50, 85], [30, 80], [10, 70], [0, 60]
            ];
            yellowSeriousPath = [
                [0, 0], [80, 0], [80, 70], [70, 75], [50, 80], [30, 75], [10, 65], [0, 55]
            ];
            orangeSeriousPath = [
                [0, 0], [60, 0], [60, 50], [50, 55], [30, 60], [10, 55], [0, 45]
            ];
            greenPressurePath = [
                [0, 0], [30, 0], [30, 20], [20, 25], [10, 25], [0, 20]
            ];
        }

        // Draw regions with curved boundaries
        g.append('path')
            .datum(blueIcingPath)
            .attr('d', line)
            .attr('fill', 'rgba(100, 149, 237, 0.3)')
            .attr('stroke', 'rgba(100, 149, 237, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(yellowSeriousPath)
            .attr('d', line)
            .attr('fill', 'rgba(255, 255, 0, 0.4)')
            .attr('stroke', 'rgba(255, 255, 0, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(orangeSeriousPath)
            .attr('d', line)
            .attr('fill', 'rgba(255, 165, 0, 0.5)')
            .attr('stroke', 'rgba(255, 165, 0, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(greenPressurePath)
            .attr('d', line)
            .attr('fill', 'rgba(34, 139, 34, 0.6)')
            .attr('stroke', 'rgba(34, 139, 34, 0.8)')
            .attr('stroke-width', 1);

        // Add relative humidity lines (diagonal lines)
        const humidityLines = [20, 40, 60, 80, 100];
        humidityLines.forEach(humidity => {
            // Create diagonal line for relative humidity
            const startX = 0;
            const startY = 0;
            const endX = tempUnit === 'C' ? 54 : 110;
            const endY = tempUnit === 'C' ? humidity * 0.36 : humidity; // Scale for Celsius

            g.append('line')
                .attr('x1', xScale(startX))
                .attr('y1', yScale(startY))
                .attr('x2', xScale(endX))
                .attr('y2', yScale(endY))
                .attr('stroke', 'rgba(128, 128, 128, 0.6)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', humidity === 100 ? 'none' : '5,5');

            // Add humidity labels
            g.append('text')
                .attr('x', xScale(endX + 5))
                .attr('y', yScale(endY) - 5)
                .style('font-size', '10px')
                .style('fill', 'rgba(128, 128, 128, 0.8)')
                .text(`${humidity}%`);
        });

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        g.append('g')
            .call(yAxis);

        // Add axis labels
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .style('text-anchor', 'middle')
            .text(`Ambient Temperature (${tempUnit === 'C' ? '°C' : '°F'})`);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .style('text-anchor', 'middle')
            .text(`Dew Point (${tempUnit === 'C' ? '°C' : '°F'})`);

        // Add user point if data is available
        if (temp && dewPoint) {
            const tempNum = parseFloat(temp);
            const dewPointNum = parseFloat(dewPoint);
            
            // Convert from Celsius to display unit
            const displayTemp = tempUnit === 'F' ? cToF(tempNum) : tempNum;
            const displayDewPoint = tempUnit === 'F' ? cToF(dewPointNum) : dewPointNum;



            g.append('circle')
                .attr('cx', xScale(displayTemp))
                .attr('cy', yScale(displayDewPoint))
                .attr('r', 6)
                .attr('fill', 'red')
                .attr('stroke', 'darkred')
                .attr('stroke-width', 2);
        }

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ''));

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ''));

    }, [temp, dewPoint, tempUnit]);

    return (
        <div className="w-full">
            <svg ref={svgRef} className="w-full h-auto"></svg>
        </div>
    );
};

export default CarbIcePotentialChart; 