import {
  magnitudeColorScale, 
  getMagnitudeRange, 
} from './barchart.js';


// Clean data function
export const parseRow = (d) => {
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
export function updateLegend(selectedColorAttr, scatterSvg, scatterWidth, scatterMargin) {
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
export function getXScale(data, xAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin) {
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

export function getXAxis(data, xAttr, xScale) {
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
export function getYAxis(data, yAttr, yScale) {
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
export function getYScale(data, yAttr, selectedYear, scatterWidth, scatterHeight, scatterMargin, yScale, yAxis) {
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
  
// Function to get color scale
export function getColorScale(data, colorAttr) {
    let scale;
    if (colorAttr === 'depth') {
      scale = d3
        .scaleOrdinal()
        .domain(['green', 'yellow', 'red'])
        .range(['green', 'yellow', 'red']);
    } else if (colorAttr === 'quality') {
      scale = d3
        .scaleOrdinal()
        .domain(['A', 'B', 'C', 'D'])
        .range(['red', 'yellow', 'green', 'blue']);
    } else if (colorAttr === 'ML') {
      scale = d3
        .scaleOrdinal()
        .domain([
          'Magnitude 4-5',
          'Magnitude 5-6',
          'Magnitude 6-7',
          'Magnitude 7-8',
        ])
        .range(['#ffffb2', '#feb24c', '#f03b20', '#bd0026']);
    }
    return scale;
}


export function updateMap(selectedEarthquake, selectedColorAttr, svg) {
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
  
export function resetMap(selectedColorAttr, svg) {
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
  
export function updateScatterplot(
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
  
export function resetScatterplot(
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

