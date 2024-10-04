function processData(data) {
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
  
  
const magnitudeColorScale = d3
    .scaleOrdinal()
    .domain(['4-5', '5-6', '6-7', '7-8'])
    .range(['#ffffb2', '#feb24c', '#f03b20', '#bd0026']);
  
function getMagnitudeRange(magnitude) {
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
  
function generateStackedBarChart(data) {
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
      .attr('id', 'bar-chart');
  
    const timeIntervals = [...new Set(data.map(d => d.timeInterval))];
    const magnitudeRanges = magnitudeColorScale.domain();
  
    console.log(timeIntervals);
    
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
        console.log([d, i]);
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
          frequency += count;
          index++;
        }
        
        console.log([timeInterval, frequency]);

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
    };
      
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

// Clean data function
const parseRow = (d) => {
    d['lat'] = +d['lat'];
    d['lon'] = +d['lon'];
    d['ML'] = +d['ML'];
    d['depth'] = +d['depth'];
  
    // Make date format to Date() format with the parsed values
    const [year, month, day] = d.date.split('-');
    const [hour, minute, second] = d.time.split(':');
    const dateTime = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second,
    );
    d.date = dateTime;
    return d;
};

// Update scatter plot legend
function updateLegend(selectedColorAttr, scatterSvg, scatterWidth, scatterMargin) {
    let legendData;
    let coloringMethod;

    if (selectedColorAttr === 'quality') {
      legendData = [
        { label: 'A', color: 'red' },
        { label: 'B', color: 'yellow' },
        { label: 'C', color: 'green' },
        { label: 'D', color: 'blue' },
      ];
      coloringMethod = 'Quality ';
    } else if (selectedColorAttr === 'ML') {
      legendData = [
        { label: '4.0 - 5.0', color: '#ffffb2' },
        { label: '5.0 - 6.0', color: '#feb24c' },
        { label: '6.0 - 7.0', color: '#f03b20' },
        { label: '7.0 - 8.0', color: '#bd0026' },
      ];
      coloringMethod = 'Magnitude';
    } else if (selectedColorAttr === 'depth') {
      legendData = [
        { label: '< 10 km', color: 'green' },
        { label: '10 km ~ 50 km', color: 'yellow' },
        { label: '>= 50 km', color: 'red' },
      ];
      coloringMethod = 'Depth';
    }
    scatterSvg.select('.legend').remove();

    scatterSvg.append('text')
      .attr('class', 'coloring-method')
      .attr('x', scatterWidth - 120)
      .attr('y', scatterMargin.top)
      .text(coloringMethod)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
    
    const legend = scatterSvg
      .append('g')
      .attr('class', 'legend')
      .attr(
      'transform',
      `translate(${scatterWidth - 143}, ${scatterMargin.top + 15})`,
      );

    const legendItems = legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems
      .append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (d) => d.color);

    legendItems
      .append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text((d) => d.label)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
}


// Function to get X scale
function getXScale(data, xAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin) {
    let xScale;
    if (xAttr === 'date') {
      xScale = d3
        .scaleTime()
        .domain([
          new Date(selectedYear, 0, 1), // January 1st
          new Date(selectedYear, 11, 31), // December 31st
        ])
        .range([
          scatterMargin.left,
          scatterWidth - scatterMargin.right,
        ]);
    } else if (xAttr === 'quality') {
      xScale = d3
        .scaleBand()
        .domain(['A', 'B', 'C', 'D'])
        .range([
          scatterMargin.left,
          scatterWidth - scatterMargin.right,
        ])
        .padding(0.1);
      
    } else {
      xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[xAttr]))
        .range([
          scatterMargin.left,
          scatterWidth - scatterMargin.right,
        ]);
      
    }
    return xScale
}

function getXAxis(data, xAttr, xScale) {
  let xAxis;
  if (xAttr === 'date') {
    xAxis = d3
      .axisBottom(xScale)
      .tickFormat(d3.timeFormat('%b'));
  }  else {
    xAxis = d3.axisBottom(xScale);
  }
  return xAxis
}
function getYAxis(data, yAttr, yScale) {
  let yAxis;
  if (yAttr === 'date') {
    yAxis = d3
      .axisLeft(yScale)
      .tickFormat(d3.timeFormat('%b'));
  }  else {
    yAxis = d3.axisLeft(yScale);
  }
  return yAxis
}
  
// Function to get Y scale
function getYScale(data, yAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin, yScale, yAxis) {
    if (yAttr === 'date') {
      yScale = d3
        .scaleTime()
        .domain([
          new Date(selectedYear, 0, 1), // January 1st
          new Date(selectedYear, 11, 31), // December 31st
        ])
        .range([
          scatterHeight - scatterMargin.bottom,
          scatterMargin.top,
        ]);
      
    } else if (yAttr === 'quality') {
      yScale = d3
        .scaleBand()
        .domain(['A', 'B', 'C', 'D'])
        .range([
          scatterHeight - scatterMargin.bottom,
          scatterMargin.top,
        ])
        .padding(0.1);
      
    } else {
      yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[yAttr]))
        .range([
          scatterHeight - scatterMargin.bottom,
          scatterMargin.top,
        ]);
      
    }
    return yScale
}


function updateMap(selectedEarthquake, selectedColorAttr, svg) {
    svg
      .selectAll('circle')
      .transition()
      .attr('r', (d) => {
        // Check if the earthquake matches the selected one
        if (d === selectedEarthquake) {
          return d.ML * 3; 
        } else {
          return d.ML;
        }
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('fill', (d) => {
        // Choose color based on depth
        if (selectedColorAttr === 'depth') {
          if (d.depth < 10) {
            return 'green';
          } else if (10 <= d.depth && d.depth < 50) {
            return 'yellow';
          } else {
            return 'red';
          }
        } else if (selectedColorAttr === 'quality') {
          // Adjust color based on quality attribute
          if (d.quality === 'A') {
            return 'red';
          } else if (d.quality === 'B') {
            return 'yellow';
          } else if (d.quality === 'C') {
            return 'green';
          } else if (d.quality === 'D') {
            return 'blue';
          }
        } else if (selectedColorAttr === 'ML') {
          const magnitudeRange = getMagnitudeRange(d.ML);
          return magnitudeColorScale(magnitudeRange);
        }
    })
    .duration(200);
}
  
function resetMap(selectedColorAttr, svg) {
    svg
      .selectAll('circle')
      .transition()
      .attr('r', (d) => d.ML)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('fill', (d) => {
        if (selectedColorAttr === 'depth') {
          if (d.depth < 10) {
            return 'green';
          } else if (10 <= d.depth && d.depth < 50) {
            return 'yellow';
          } else {
            return 'red';
          }
        } else if (selectedColorAttr === 'quality') {
          // Adjust color based on quality attribute
          if (d.quality === 'A') {
            return 'red';
          } else if (d.quality === 'B') {
            return 'yellow';
          } else if (d.quality === 'C') {
            return 'green';
          } else if (d.quality === 'D') {
            return 'blue';
          }
        } else if (selectedColorAttr === 'ML') {
          const magnitudeRange = getMagnitudeRange(d.ML);
          return magnitudeColorScale(magnitudeRange);
        }
    })
    .duration(200);
}
  
function updateScatterplot(
    selectedEarthquake,
    selectedXAttr,
    selectedYAttr,
    selectedColorAttr,
    xScale,
    yScale,
    scatterSvg
  ) {
    scatterSvg
      .selectAll('circle')
      .transition()
      .attr('cx', (d) => {
        if (selectedXAttr === 'quality' && d.quality) {
          return (
            xScale(d[selectedXAttr]) + xScale.bandwidth() / 2
          ); // Adjust for the center of the bar
        } else {
          return xScale(d[selectedXAttr]);
        }
      })
      .attr('cy', (d) => {
        if (selectedYAttr === 'quality' && d.quality) {
          return (
            yScale(d[selectedYAttr]) + yScale.bandwidth() / 2
          ); // Adjust for the center of the bar
        } else {
          return yScale(d[selectedYAttr]);
        }
      })
      .attr('r', (d) => {
        // Check if the earthquake matches the selected one
        if (d === selectedEarthquake) {
          return d.ML * 3; 
        } else {
          return d.ML;
        }
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('fill', (d) => {
        // Choose color based on depth
        if (selectedColorAttr === 'depth') {
          if (d.depth < 10) {
            return 'green';
          } else if (10 <= d.depth && d.depth < 50) {
            return 'yellow';
          } else {
            return 'red';
          }
        } else if (selectedColorAttr === 'quality') {
          // Adjust color based on quality attribute
          if (d.quality === 'A') {
            return 'red';
          } else if (d.quality === 'B') {
            return 'yellow';
          } else if (d.quality === 'C') {
            return 'green';
          } else if (d.quality === 'D') {
            return 'blue';
          }
        } else if (selectedColorAttr === 'ML') {
          const magnitudeRange = getMagnitudeRange(d.ML);
          return magnitudeColorScale(magnitudeRange);
        }
    })
    .duration(200);
}
  
function resetScatterplot(
    selectedXAttr,
    selectedYAttr,
    selectedColorAttr,
    xScale,
    yScale,
    scatterSvg
  ) {
    scatterSvg
      .selectAll('circle')
      .transition()
      .attr('cx', (d) => {
        if (selectedXAttr === 'quality' && d.quality) {
          return (
            xScale(d[selectedXAttr]) + xScale.bandwidth() / 2
          ); // Adjust for the center of the bar
        } else {
          return xScale(d[selectedXAttr]);
        }
      })
      .attr('cy', (d) => {
        if (selectedYAttr === 'quality' && d.quality) {
          return (
            yScale(d[selectedYAttr]) + yScale.bandwidth() / 2
          ); // Adjust for the center of the bar
        } else {
          return yScale(d[selectedYAttr]);
        }
      })
      .attr('r', (d) => d.ML)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('fill', (d) => {
        if (selectedColorAttr === 'depth') {
          if (d.depth < 10) {
            return 'green';
          } else if (10 <= d.depth && d.depth < 50) {
            return 'yellow';
          } else {
            return 'red';
          }
        } else if (selectedColorAttr === 'quality') {
          // Adjust color based on quality attribute
          if (d.quality === 'A') {
            return 'red';
          } else if (d.quality === 'B') {
            return 'yellow';
          } else if (d.quality === 'C') {
            return 'green';
          } else if (d.quality === 'D') {
            return 'blue';
          }
        } else if (selectedColorAttr === 'ML') {
          const magnitudeRange = getMagnitudeRange(d.ML);
          return magnitudeColorScale(magnitudeRange);
        }
    })
    .duration(200);
}

// Histogram (2-hour intervals)
const getHour = (d) => {
    const [hour, minute, second] = d.time.split(':');
    return parseInt(hour);
};
  
// Group earthquakes by 2-hour intervals
const groupByTwoHours = (data) => {
    const groupedData = Array(12).fill(0);
    data.forEach((d) => {
      const hour = getHour(d);
      const index = Math.floor(hour / 2); // Calculate the index for the 2-hour interval
      groupedData[index]++;
    });
    return groupedData;
};
  
function generateHistogram(frequencies) {
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

// Histogram 2
const getHourQuality = (d) => {
    const [hour, minute, second] = d.time.split(':');
    const quality = d.quality;
    return { hour: parseInt(hour), quality };
};
  
const groupByHourAndQuality = (data) => {
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
  
function generateHistogram2(frequenciesByHourAndQuality) {
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
    d3.rgb('#cedb9c');
    d3.rgb('#ff9896');
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

// Code reference to https://github.com/jacychutw/d3-practice-GYM/blob/main/index.js
// Shape file of Taiwan Map from Taiwan Government Website https://data.gov.tw/en/datasets/all


// Set Background
d3.select('#map-container')
  .select('svg')
  .append('rect')
  .attr('width', 650)
  .attr('height', 550)
  .attr('fill', 'lightblue');

// Map on the left
var svg = d3.select('#map-container').select('svg');

const g = svg
  .append('g')
  .attr('width', 650)
  .attr('height', 550)
  .attr('id', 'map');

svg.call(
  d3.zoom().on('zoom', () => {
    g.attr('transform', d3.event.transform);
  }),
);

// Using Mercator projection
var projection = d3
  .geoMercator()
  .center([123.5, 23.5])
  .scale(5500);
var pathGenerator = d3.geoPath().projection(projection);

d3.select('body')
  .append('div')
  .attr('id', 'tooltip')
  .attr('style', 'position: absolute; opacity: 0;');


let xScale, yScale, xAxis, yAxis;

 // Scatter Plot on the right
const scatterWidth = 600;
const scatterHeight = 580;
const scatterMargin = {
 top: 20,
 right: 30,
 bottom: 35,
 left: 50,
};
let scatterSvg = d3
 .select('#scatterplot-container')
 .select('svg');

if (scatterSvg.empty()) {
  scatterSvg = d3
    .select('#scatterplot-container')
    .append('svg')
    .attr('id', 'scatterplot')
    .attr('width', scatterWidth)
    .attr('height', scatterHeight);
  } else {
  scatterSvg
    .attr('width', scatterWidth)
    .attr('height', scatterHeight);
  }
 

// Function to create scatterplot
function createScatterplot(
  data,
  xAttr,
  yAttr,
  colorAttr,
  selectedYear,
  svg
) {

  // Remove existing elements
  scatterSvg.selectAll('*').remove();
  scatterSvg.selectAll('circle').remove();
  scatterSvg.selectAll('text').remove();
  scatterSvg.selectAll('g').remove();
  
  
  xScale = getXScale(data, xAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin);
  yScale = getYScale(data, yAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin);
  xAxis = getXAxis(data, xAttr, xScale);
  yAxis = getYAxis(data, yAttr, yScale);

  // Append axes
  scatterSvg
    .append('g')
    .attr('class', 'x-axis')
    .attr(
      'transform',
      `translate(0, ${scatterHeight - scatterMargin.bottom})`,
    )
    .call(xAxis);

  scatterSvg
    .append('g')
    .attr('class', 'y-axis')
    .attr(
      'transform',
      `translate(${scatterMargin.left}, 0)`,
    )
    .call(yAxis);

  // Create circles
  scatterSvg
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => {
      if (xAttr === 'quality' && d.quality) {
        return xScale(d[xAttr]) + xScale.bandwidth() / 2; // Adjust for the center of the bar
      } else {
        return xScale(d[xAttr]);
      }
    })
    .attr('cy', (d) => {
      if (yAttr === 'quality' && d.quality) {
        return yScale(d[yAttr]) + yScale.bandwidth() / 2; // Adjust for the center of the bar
      } else {
        return yScale(d[yAttr]);
      }
    })
    .attr('r', (d) => d.ML)
    //.attr('fill', (d) => colorScale(d[colorAttr]))
    .attr('fill', (d) => {
      // Choose color based on depth
      if (colorAttr === 'depth') {
        if (d.depth < 10) {
          return 'green';
        } else if (10 <= d.depth && d.depth < 50) {
          return 'yellow';
        } else {
          return 'red';
        }
      } else if (colorAttr === 'quality') {
        // Adjust color based on quality attribute
        if (d.quality === 'A') {
          return 'red';
        } else if (d.quality === 'B') {
          return 'yellow';
        } else if (d.quality === 'C') {
          return 'green';
        } else if (d.quality === 'D') {
          return 'blue';
        }
      } else if (colorAttr === 'ML') {
        const magnitudeRange = getMagnitudeRange(d.ML);
        return magnitudeColorScale(magnitudeRange);
      }
    })
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .on('mouseover', function (d) {
      const [x, y] = projection([d['lon'], d['lat']]);
      const date = d.date.toISOString().split('T')[0];
      d3.select('#tooltip')
        .style('opacity', 1)
        .html(
          '<div class="custom_tooltip"> Time: ' +
            date +
            '<br> Latitude: ' +
            d['lat'] +
            '<br> Longitude: ' +
            d['lon'] +
            '<br> Magnitude: ' +
            d['ML'] +
            '<br> Depth: ' +
            d['depth'] +
            '<br> Quality: ' +
            d['quality'] +
            '</div>',
        )
        .style('left', `${x}px`)
        .style('top', `${y}px`);

      updateScatterplot(
        d,
        xAttr,
        yAttr,
        colorAttr,
        xScale,
        yScale,
        scatterSvg
      );
      updateMap(d, colorAttr, svg);
    })
    .on('mousemove', function () {
      d3.select('#tooltip')
        .style('left', d3.event.pageX + 10 + 'px')
        .style('top', d3.event.pageY + 10 + 'px');
    })
    .on('mouseout', function (d) {
      d3.select('#tooltip').style('opacity', 0);
      resetScatterplot(
        xAttr,
        yAttr,
        colorAttr,
        xScale,
        yScale,
        scatterSvg
      );
      resetMap(colorAttr, svg);
    });

  let xLabel;
  if (xAttr === 'ML') {
    xLabel = 'Magnitude';
  } else if (xAttr === 'quality') {
    xLabel = 'Quality';
  } else if (xAttr === 'date') {
    xLabel = 'Month';
  } else if (xAttr === 'depth') {
    xLabel = 'Depth';
  } else {
    xLabel = xAttr;
  }

  let yLabel;
  if (yAttr === 'ML') {
    yLabel = 'Magnitude';
  } else if (yAttr === 'quality') {
    yLabel = 'Quality';
  } else if (yAttr === 'date') {
    yLabel = 'Month';
  } else if (yAttr === 'depth') {
    yLabel = 'Depth';
  } else {
    yLabel = yAttr;
  }

  scatterSvg
    .append('text')
    .attr(
      'transform',
      `translate(${scatterWidth / 2}, ${scatterHeight - 5})`,
    )
    .style('text-anchor', 'middle')
    .text(xLabel);

  scatterSvg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', scatterMargin.left - 48)
    .attr('x', 0 - scatterHeight / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text(yLabel);

  scatterSvg
    .append('text')
    .attr('x', scatterWidth / 2)
    .attr('y', scatterMargin.top)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Earthquake ' + xLabel + ' vs ' + yLabel);

  updateLegend(colorAttr, scatterSvg, scatterWidth, scatterMargin);
}


// Render Function
async function render(
  selectedYear,
  selectedXAttr,
  selectedYAttr,
  selectedColorAttr,
) {
  svg.selectAll('circle').remove();
  g.selectAll('path').remove();
  g.selectAll('circle').remove();
  

  const [jsondata, csvdata] = await Promise.all([
    d3.json(
      'https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json',
    ),
    d3.csv(
      'https://raw.githubusercontent.com/esa0624/cp341/main/Earthquake_1973_2024.csv',
      parseRow,
    ),
  ]);
  console.log(csvdata);

  const filteredData = csvdata.filter(
    (d) =>
      d.date.getFullYear() === selectedYear &&
      d.quality != '',
  );

  // Get map TopoJSON data
  const geometries = topojson.feature(
    jsondata,
    jsondata.objects['counties'],
  );
  console.log(jsondata);

  g.append('path');
  const paths = g
    .selectAll('path')
    .data(geometries.features);
  paths
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .attr('class', 'county')
    .on('mouseover', function (d) {
      const [x, y] = pathGenerator.centroid(d);
      const name = d.properties.COUNTYENG;
      console.log(name);
      d3.select('#tooltip')
        .style('opacity', 1)
        .html('<div>Name: ' + name + '</div>')
        .style('left', `${x}px`)
        .style('top', `${y}px`);
    })
    .on('mousemove', function () {
      d3.select('#tooltip')
        .style('left', d3.event.pageX + 10 + 'px')
        .style('top', d3.event.pageY + 10 + 'px');
    })
    .on('mouseout', function () {
      d3.select('#tooltip').style('opacity', 0);
    });

  const circle = g
    .selectAll('circle')
    .data(filteredData)
    .enter()
    .append('circle')
    .attr('r', 0)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('cx', (d) => projection([d['lon'], d['lat']])[0])
    .attr('cy', (d) => projection([d['lon'], d['lat']])[1])
    .on('mouseover', function (d) {
      const [x, y] = projection([d['lon'], d['lat']]);
      const date = d.date.toISOString().split('T')[0];
      d3.select('#tooltip')
        .style('opacity', 1)
        .html(
          '<div class="custom_tooltip"> Time: ' +
            date +
            '<br> Latitude: ' +
            d['lat'] +
            '<br> Longitude: ' +
            d['lon'] +
            '<br> Magnitude: ' +
            d['ML'] +
            '<br> Depth: ' +
            d['depth'] +
            '<br> Quality: ' +
            d['quality'] +
            '</div>',
        )
        .style('left', `${x}px`)
        .style('top', `${y}px`);

      updateScatterplot(
        d,
        selectedXAttr,
        selectedYAttr,
        selectedColorAttr,
        xScale,
        yScale,
        scatterSvg
      );
      updateMap(d, selectedColorAttr,svg);
    })
    .on('mousemove', function () {
      d3.select('#tooltip')
        .style('left', d3.event.pageX + 10 + 'px')
        .style('top', d3.event.pageY + 10 + 'px');
    })
    .on('mouseout', function () {
      d3.select('#tooltip').style('opacity', 0);
      resetScatterplot(
        selectedXAttr,
        selectedYAttr,
        selectedColorAttr,
        xScale,
        yScale,
        scatterSvg
      );
      resetMap(selectedColorAttr, svg);
    });

  const interval = 30; //ms
  let index = 0;

  //loop through earthquake data and draw
  function update() {
    if (index < filteredData.length) {
      circle
        .filter((d, i) => i === index)
        .transition()
        .attr('r', (d) => d.ML)
        .attr('fill', (d) => {
          // Choose color based on depth
          if (selectedColorAttr === 'depth') {
            if (d.depth < 10) {
              return 'green';
            } else if (10 <= d.depth && d.depth < 50) {
              return 'yellow';
            } else {
              return 'red';
            }
          } else if (selectedColorAttr === 'quality') {
            // Adjust color based on quality attribute
            if (d.quality === 'A') {
              return 'red';
            } else if (d.quality === 'B') {
              return 'yellow';
            } else if (d.quality === 'C') {
              return 'green';
            } else if (d.quality === 'D') {
              return 'blue';
            }
          } else if (selectedColorAttr === 'ML') {
            const magnitudeRange = getMagnitudeRange(d.ML);
            return magnitudeColorScale(magnitudeRange);
          }
        })
        .duration(100);
      index++;
      setTimeout(update, interval);
    }
  }
  // Map Transition
  update();

  // Scatter Plot
  createScatterplot(
    filteredData,
    selectedXAttr,
    selectedYAttr,
    selectedColorAttr,
    selectedYear,
    svg
  );

  // Histogram 1 Plot
  const frequencies = groupByTwoHours(csvdata);
  console.log(frequencies);
  generateHistogram(frequencies);

  // Histogram 2
  const frequenciesByHourAndQuality =
    groupByHourAndQuality(csvdata);
  console.log(frequenciesByHourAndQuality);
  generateHistogram2(frequenciesByHourAndQuality);

  // Stacked Bar Chart
  const processedData = processData(csvdata);
  console.log('Process', processedData);
  generateStackedBarChart(processedData);
}

const xSelect = document.getElementById('xAttrSelect');
const ySelect = document.getElementById('yAttrSelect');
const colorSelect = document.getElementById(
  'colorAttrSelect',
);

// Select the dropdowns
if (
  xSelect.options.length === 0 &&
  ySelect.options.length === 0 &&
  colorSelect.options.length === 0
) {
  const options = [
    { display: 'Magnitude', value: 'ML' },
    { display: 'Depth', value: 'depth' },
    { display: 'Month', value: 'date' },
    { display: 'Quality', value: 'quality' },
  ];

  const options2 = [
    { display: 'Depth', value: 'depth' },
    { display: 'Magnitude', value: 'ML' },
    { display: 'Quality', value: 'quality' },
  ];

  // Populate the dropdowns with options
  options.forEach((option) => {
    const xOption = document.createElement('option');
    const yOption = document.createElement('option');

    xOption.value = option.value;
    xOption.textContent = option.display;
    xSelect.appendChild(xOption);

    yOption.value = option.value;
    yOption.textContent = option.display;
    ySelect.appendChild(yOption);
  });

  options2.forEach((option) => {
    const colorOption = document.createElement('option');

    colorOption.value = option.value;
    colorOption.textContent = option.display;
    colorSelect.appendChild(colorOption);
  });
}

// render();
render(1973, 'ML', 'ML', 'depth');

document.addEventListener('DOMContentLoaded', function () {
  // Add event listener to the year select dropdown
  document
    .getElementById('year-select')
    .addEventListener('change', function () {
      const selectedYear = parseInt(this.value);
      const selectedXAttr =
        document.getElementById('xAttrSelect').value;
      const selectedYAttr =
        document.getElementById('yAttrSelect').value;
      const colorAttr = document.getElementById(
        'colorAttrSelect',
      ).value;
      render(
        selectedYear,
        selectedXAttr,
        selectedYAttr,
        colorAttr,
      );
    });

  // Add event listener to the x-axis attribute select dropdown
  document
    .getElementById('xAttrSelect')
    .addEventListener('change', function () {
      const selectedYear = parseInt(
        document.getElementById('year-select').value,
      );
      const selectedXAttr = this.value;
      const selectedYAttr =
        document.getElementById('yAttrSelect').value;
      const colorAttr = document.getElementById(
        'colorAttrSelect',
      ).value;
      render(
        selectedYear,
        selectedXAttr,
        selectedYAttr,
        colorAttr,
      );
    });

  // Add event listener to the y-axis attribute select dropdown
  document
    .getElementById('yAttrSelect')
    .addEventListener('change', function () {
      const selectedYear = parseInt(
        document.getElementById('year-select').value,
      );
      const selectedXAttr =
        document.getElementById('xAttrSelect').value;
      const selectedYAttr = this.value;
      const colorAttr = document.getElementById(
        'colorAttrSelect',
      ).value;
      render(
        selectedYear,
        selectedXAttr,
        selectedYAttr,
        colorAttr,
      );
    });

  document
    .getElementById('colorAttrSelect')
    .addEventListener('change', function () {
      const selectedYear = parseInt(
        document.getElementById('year-select').value,
      );
      const selectedXAttr =
        document.getElementById('xAttrSelect').value;
      const selectedYAttr =
        document.getElementById('yAttrSelect').value;
      const colorAttr = this.value;
      render(
        selectedYear,
        selectedXAttr,
        selectedYAttr,
        colorAttr,
      );
    });
});
