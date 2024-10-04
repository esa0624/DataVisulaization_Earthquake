// Histogram 2
export const getHourQuality = (d) => {
    const [hour, minute, second] = d.time.split(':');
    const quality = d.quality;
    return { hour: parseInt(hour), quality };
};
  
export const groupByHourAndQuality = (data) => {
    const groupedData = Array.from({ length: 24 }, () =>
      Array(3).fill(0),
    );
    data.forEach((d) => {
      const { hour, quality } = getHourQuality(d);
      const index = hour;
      if (quality === 'B') {
        groupedData[index][0]++; // Increment count for quality 'B'
      } else if (quality === 'C') {
        groupedData[index][1]++; // Increment count for quality 'C'
      } else if (quality === 'D') {
        groupedData[index][2]++; // Increment count for quality 'D'
      }
    });
    console.log(groupedData);
    return groupedData;
};
  
export function generateHistogram2(frequenciesByHourAndQuality) {
    const margin2 = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 50,
    };
    const width2 = 650;
    const height2 = 500;
  
    const histogramSvg2 = d3.select('#row2').select('svg');
    histogramSvg2
      .append('svg')
      .attr('width', width2)
      .attr('height', height2)
      .attr('id', 'second-histogram')
      .attr(
        'transform',
        'translate(' + margin2.left + ',' + margin2.top + ')',
      );
  
    const x2 = d3
      .scaleBand()
      .domain([...Array(24).keys()])
      .range([margin2.left, width2 - margin2.right])
      .padding(0.1);
  
    const y2 = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          frequenciesByHourAndQuality.map((d) => d3.max(d)),
        ),
      ])
      .nice()
      .range([height2 - margin2.bottom, margin2.top]);
    
    var blue = d3.rgb('#aec7e8');
    var purple = d3.rgb('#c5b0d5');
    var green = d3.rgb('#cedb9c');
    var pink = d3.rgb('#ff9896');
    var yellow = d3.rgb('#fdd0a2');

    const color = d3
      .scaleOrdinal()
      .domain(['B', 'C', 'D'])
      //.range(d3.schemeCategory10);
      .range([blue, purple, yellow]);
    //.range(['lightgreen', 'lightpink', 'lightblue']);
  
    const histogramX2 = d3.axisBottom(x2);
    const histogramY2 = d3.axisLeft(y2);
  
    histogramSvg2
      .append('g')
      .attr(
        'transform',
        `translate(0, ${height2 - margin2.bottom})`,
      )
      .call(histogramX2)
      .selectAll('text')
      .text((d, i) => {
        return `${i.toString().padStart(2, '0')}:00`;
      })
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
  
    histogramSvg2
      .append('g')
      .attr('transform', `translate(${margin2.left}, 0)`)
      .call(histogramY2);
  
    const bars = histogramSvg2
      .selectAll('.bar-group')
      .data(frequenciesByHourAndQuality)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d, i) => `translate(${x2(i)}, 0)`);
  
    x2.bandwidth(20);
    bars
      .selectAll('.bar')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => (x2.bandwidth() / 3) * i)
      .attr('y', (d) => y2(d))
      .attr('width', x2.bandwidth() / 3)
      .attr('height', (d) => height2 - margin2.bottom - y2(d))
      .attr('fill', (d, i) => color(i));
  
    const legendData2 = ['B', 'C', 'D'];
    // Add legend
    const histogram_legend = histogramSvg2
      .selectAll('.legend')
      .data(legendData2)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);
  
    histogram_legend
      .append('rect')
      .attr('x', width2 - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', (d, i) => color(i));
  
    histogram_legend
      .append('text')
      .attr('x', width2 - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text((d, i) => legendData2[i]);
  
    histogramSvg2
      .append('text')
      .attr(
        'transform',
        `translate(${width2 / 2}, ${height2 + 15})`,
      )
      .style('text-anchor', 'middle')
      .text('Hour of the Day');
  
    histogramSvg2
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin2.left - 48)
      .attr('x', 0 - height2 / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Frequency');
  
    histogramSvg2
      .append('text')
      .attr('x', width2 / 2)
      .attr('y', margin2.top / 2 + 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(
        'Distribution of Earthquakes by Time of Day (Grouped by Quality)',
      );
}