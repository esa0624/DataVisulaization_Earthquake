// Code reference to https://github.com/jacychutw/d3-practice-GYM/blob/main/index.js
// Shape file of Taiwan Map from Taiwan Government Website https://data.gov.tw/en/datasets/all
import {
  parseRow, 
  updateLegend, 
  getXScale, 
  getYScale, 
  getXAxis,
  getYAxis,
  getColorScale,
  updateMap, 
  resetMap, 
  updateScatterplot,
  resetScatterplot,
} from './function.js';

import {
  getHour,
  groupByTwoHours, 
  generateHistogram,  
} from './histogram1.js';

import {
  getHourQuality, 
  groupByHourAndQuality, 
  generateHistogram2, 
} from './histogram2.js';

import {
  processData, 
  magnitudeColorScale, 
  getMagnitudeRange, 
  generateStackedBarChart,
} from './barchart.js';


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
