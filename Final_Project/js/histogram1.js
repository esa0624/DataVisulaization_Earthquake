// Histogram (2-hour intervals)
export const getHour = (d) => {
    const [hour, minute, second] = d.time.split(':');
    return parseInt(hour);
};
  
// Group earthquakes by 2-hour intervals
export const groupByTwoHours = (data) => {
    const groupedData = Array(12).fill(0);
    data.forEach((d) => {
      const hour = getHour(d);
      const index = Math.floor(hour / 2); // Calculate the index for the 2-hour interval
      groupedData[index]++;
    });
    return groupedData;
};
  
export function generateHistogram(frequencies) {
    // Histogram (2-hour interval)
    const margin = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 50,
    };
    const width = 600;
    const height = 450;
  
    const histogramSvg = d3.select('#row1').select('svg');
  
    histogramSvg
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('id', 'histogram')
      //.append('g')
      .attr(
        'transform',
        'translate(' + margin.left + ',' + margin.top + ')',
      );
  
    const x = d3
      .scaleBand()
      .domain([...Array(12).keys()])
      .range([margin.left, width - margin.right])
      .padding(0.1);
  
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(frequencies)])
      .range([height - margin.bottom, margin.top]);
  
    const histogramX = d3.axisBottom(x);
    const histogramY = d3.axisLeft(y);
  
    histogramSvg
      .append('g')
      .attr(
        'transform',
        `translate(0, ${height - margin.bottom})`,
      )
      .call(histogramX)
      .selectAll('text')
      .text((d, i) => {
        const startHour = (i * 2) % 24;
        const endHour = ((i + 1) * 2) % 24;
        return `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
      })
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
  
    histogramSvg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(histogramY);
  
    histogramSvg
      .selectAll('rect')
      .data(frequencies)
      .enter()
      .append('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', (d) => y(d))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d) - margin.bottom)
      .attr('fill', 'skyblue');
  
    histogramSvg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left - 48)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Frequency');
  
    histogramSvg
      .append('text')
      .attr(
        'transform',
        `translate(${width / 2}, ${height + 35})`,
      )
      .style('text-anchor', 'middle')
      .text('Time Period (2-hour intervals)');
  
    histogramSvg
      .append('text')
      .attr('x', width / 2)
      .attr('y', margin.top - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(
        'Earthquake Frequency by Time Period (2-hour intervals)',
      );
}
  