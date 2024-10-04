
export function processData(data) {
    const magnitudeRanges = [
      { min: 3, max: 4 },
      { min: 4, max: 5 },
      { min: 5, max: 6 },
      { min: 6, max: 7 },
      { min: 7, max: 8 },
      { min: 8, max: 9 },
      { min: 9, max: 10 },
    ];
    const frequencies = {};
  
    data.forEach((d) => {
      const dateTime = d.date.toISOString().split('T')[0];
      const [year, month, day] = dateTime.split('-');
      const magnitude = parseFloat(d.ML);
      let magnitudeRange;
      for (let i = 0; i < magnitudeRanges.length; i++) {
        const range = magnitudeRanges[i];
        if (magnitude >= range.min && magnitude < range.max) {
          magnitudeRange = `${range.min}-${range.max}`;
          break;
        }
      }
      const key = `${year}_${magnitudeRange}`;
      frequencies[key] = (frequencies[key] || 0) + 1;
    });
  
    const processedData = Object.keys(frequencies).map(
      (key) => {
        const [timestamp, magnitudeRange] = key.split('_');
        return {
          timeInterval: timestamp,
          magnitudeRange,
          frequency: frequencies[key],
        };
      },
    );
    return processedData;
}
  
  
export const magnitudeColorScale = d3
    .scaleOrdinal()
    .domain(['4-5', '5-6', '6-7', '7-8'])
    .range(['#ffffb2', '#feb24c', '#f03b20', '#bd0026']);
  
export function getMagnitudeRange(magnitude) {
    if (magnitude >= 4 && magnitude < 5) {
      return '4-5';
    } else if (magnitude >= 5 && magnitude < 6) {
      return '5-6';
    } else if (magnitude >= 6 && magnitude < 7) {
      return '6-7';
    } else if (magnitude >= 7 && magnitude < 8) {
      return '7-8';
    }
}
  
export function generateStackedBarChart(data) {
    const margin = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 50,
    };
    const width = 700;
    const height = 500;
  
     const svg = d3.select('#row5').select('svg');
     svg
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('id', 'bar-chart')
  
    const timeIntervals = [...new Set(data.map(d => d.timeInterval))];
    const magnitudeRanges = magnitudeColorScale.domain();
  
    console.log(timeIntervals)
    
    const aggregatedData = {};
  
    data.forEach(d => {
      if (!aggregatedData[d.timeInterval]) {
        aggregatedData[d.timeInterval] = {};
      }
      aggregatedData[d.timeInterval][d.magnitudeRange] = d.frequency;
    });
  
    const stackedData = Object.keys(aggregatedData).map(timeInterval => {
      const intervalData = aggregatedData[timeInterval];
      return magnitudeRanges.map(range => intervalData[range] || 0);
    });
    console.log('Transformed data:', stackedData);
  
    const stack = d3.stack().keys(d3.range(magnitudeRanges.length));
    const stackedValues = stack(stackedData);
    console.log('Stacked values:', stackedValues);
  
    const xScale = d3.scaleBand()
      .domain(timeIntervals)
      .range([margin.left, width - margin.right])
      .padding(0.1);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d3.sum(magnitudeRanges, range => (aggregatedData[d.timeInterval][range] || 0)))])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    svg.selectAll('*').remove();
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    const series = g.selectAll('.series')
      .data(stackedValues)
      .enter().append('g')
      .attr('class', 'series')
      .attr('fill', (d, i) => magnitudeColorScale(magnitudeRanges[i]));
    


    series.selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', (d, i) => xScale(timeIntervals[i]))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .on('mouseover', function (d, i) {
        // const color = d3.select(d).attr('fill');
        // console.log(color)
        console.log([d, i])
        const timeInterval =  timeIntervals[i];
        //const magnitudeRange = magnitudeRanges[d];
        // let index = 0
        // if (magnitudeRange == '4-5'){
        //   index  = 0
        // } else if (magnitudeRange == '5-6'){
        //   index = 1
        // } else if (magnitudeRange == '6-7'){
        //   index = 2
        // } else if (magnitudeRange == '7-8'){
        //   index = 3
        // } 
        //const frequency = stackedValues[index][d][1] - stackedValues[index][d][0]; 
        let frequency = 0;
        let index = 0;
        while (index < 4){
          let count = stackedValues[index][i][1] - stackedValues[index][i][0]; 
          frequency += count
          index++
        }
        
        console.log([timeInterval, frequency])

        const x = d3.event.pageX;
        const y = d3.event.pageY;
  
        d3.select('#tooltip')
          .style('opacity', 1)
          .html(`Year: ${timeInterval}<br>Total Frequency: ${frequency}`)
          .style('left', `${x}px`)
          .style('top', `${y}px`);
      })
  
      .on('mousemove', function () {
        d3.select('#tooltip')
          .style('left', d3.event.pageX + 10 + 'px')
          .style('top', d3.event.pageY + 10 + 'px');
      })
      .on('mouseout', function (d) {
        d3.select('#tooltip').style('opacity', 0);
        
      });
      
  
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');
  
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));
  
    svg.append('text')
      .attr('x', width / 2 + 40)
      .attr('y', height - margin.bottom + 70)
      .style('text-anchor', 'middle')
      .text('Year');
  
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left - 20)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Earthquake Frequency');
  
    svg.append('text')
      .attr('x', width / 2 + 40)
      .attr('y', margin.top / 2 + 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Stacked Bar Chart of Earthquake Frequency Over Time');
    

    const magnitudeLabels = {
      '4-5': '4.0 - 5.0',
      '5-6': '5.0 - 6.0',
      '6-7': '6.0 - 7.0',
      '7-8': '7.0 - 8.0'
    }
      
    // Add the legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right}, ${margin.top})`);
  
    const legendRectSize = 18;
    const legendSpacing = 4;
  
    const legendItems = legend.selectAll('.legend-item')
      .data(magnitudeRanges)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * (legendRectSize + legendSpacing)})`);
  
    legendItems.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('fill', d => magnitudeColorScale(d));

    
    legendItems.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(d => magnitudeLabels[d]);
    
    svg.append('text')
      .attr('x', width - margin.right + legendRectSize + legendSpacing)
      .attr('y', margin.top - legendSpacing - 15)
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'hanging')
      .style('font-size', '15px')
      .text('Magnitude');
}
  
  
