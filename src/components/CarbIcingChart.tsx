import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CarbIcingChartProps {
    temp: string;
    dewPoint: string;
    tempUnit: 'C' | 'F';
}

const CarbIcingChart: React.FC<CarbIcingChartProps> = ({ temp, dewPoint, tempUnit }) => {
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

        // Temperature conversion functions
        const fToC = (f: number) => (f - 32) * 5/9;
        const cToF = (c: number) => c * 9/5 + 32;

        // Set up scales based on temperature unit
        const xScale = d3.scaleLinear()
            .domain(tempUnit === 'C' ? [0, 50] : [32, 110]) // 0-50°C or 32-110°F
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(tempUnit === 'C' ? [-10, 30] : [-18, 54]) // -10 to 30°C or -18 to 54°F dew point depression
            .range([height, 0]);

        // Define curved regions using D3 path generators
        const line = d3.line<[number, number]>()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Define regions based on temperature unit
        let lightIcingPath: [number, number][];
        let moderateIcingPath: [number, number][];
        let seriousDescentPath: [number, number][];
        let seriousAnyPowerPath: [number, number][];

        if (tempUnit === 'C') {
            // Celsius regions (original)
            lightIcingPath = [
                [0, 0], [40, 0], [40, 25], [35, 28], [25, 30], [15, 28], [5, 25], [0, 20]
            ];
            moderateIcingPath = [
                [0, 0], [30, 0], [30, 15], [25, 18], [15, 20], [5, 18], [0, 15]
            ];
            seriousDescentPath = [
                [0, 0], [20, 0], [20, 12], [15, 15], [10, 16], [5, 15], [0, 12]
            ];
            seriousAnyPowerPath = [
                [0, 0], [20, 0], [20, 8], [15, 10], [10, 11], [5, 10], [0, 8]
            ];
        } else {
            // Fahrenheit regions (converted from Celsius)
            lightIcingPath = [
                [32, 0], [110, 0], [110, 45], [95, 50], [77, 54], [59, 50], [41, 45], [32, 36]
            ];
            moderateIcingPath = [
                [32, 0], [86, 0], [86, 27], [77, 32], [59, 36], [41, 32], [32, 27]
            ];
            seriousDescentPath = [
                [32, 0], [68, 0], [68, 22], [59, 27], [50, 29], [41, 27], [32, 22]
            ];
            seriousAnyPowerPath = [
                [32, 0], [68, 0], [68, 14], [59, 18], [50, 20], [41, 18], [32, 14]
            ];
        }

        // Draw regions with curved boundaries
        g.append('path')
            .datum(lightIcingPath)
            .attr('d', line)
            .attr('fill', 'rgba(173, 216, 230, 0.3)')
            .attr('stroke', 'rgba(173, 216, 230, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(moderateIcingPath)
            .attr('d', line)
            .attr('fill', 'rgba(100, 149, 237, 0.4)')
            .attr('stroke', 'rgba(100, 149, 237, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(seriousDescentPath)
            .attr('d', line)
            .attr('fill', 'rgba(70, 130, 180, 0.5)')
            .attr('stroke', 'rgba(70, 130, 180, 0.8)')
            .attr('stroke-width', 1);

        g.append('path')
            .datum(seriousAnyPowerPath)
            .attr('d', line)
            .attr('fill', 'rgba(25, 25, 112, 0.6)')
            .attr('stroke', 'rgba(25, 25, 112, 0.8)')
            .attr('stroke-width', 1);



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
            .text(`Temperature (${tempUnit === 'C' ? '°C' : '°F'})`);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .style('text-anchor', 'middle')
            .text(`Dew Point Depression (${tempUnit === 'C' ? '°C' : '°F'})`);

        // Add user point if data is available
        if (temp && dewPoint) {
            const tempNum = parseFloat(temp);
            const dewPointNum = parseFloat(dewPoint);
            
            // Convert from Celsius to display unit
            const displayTemp = tempUnit === 'F' ? cToF(tempNum) : tempNum;
            const displayDewPoint = tempUnit === 'F' ? cToF(dewPointNum) : dewPointNum;
            const dewPointDepression = displayTemp - displayDewPoint;



            g.append('circle')
                .attr('cx', xScale(displayTemp))
                .attr('cy', yScale(dewPointDepression))
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

export default CarbIcingChart; 