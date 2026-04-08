/**
 * Workshop Mock Execution System
 *
 * Client-side mock execution for workshop code blocks.
 * Reads mock output data from data-mock-output attributes,
 * simulates execution with animations, and renders results.
 * No network calls are made.
 */

const APP_ROOT_MOCK = window.APP_ROOT || '';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Typewriter effect: renders text character-by-character with a blinking cursor.
 */
async function typewriterEffect(element, text, speed) {
  speed = speed || 12;
  const cursor = document.createElement('span');
  cursor.className = 'mock-cursor';
  element.appendChild(cursor);

  let i = 0;
  const textNode = document.createTextNode('');
  element.insertBefore(textNode, cursor);

  while (i < text.length) {
    // Write in small chunks for performance
    const chunk = text.substring(i, Math.min(i + 3, text.length));
    textNode.textContent += chunk;
    i += chunk.length;

    // Auto-scroll to bottom
    const outputArea = element.closest('.code-canvas__output');
    if (outputArea) {
      outputArea.scrollTop = outputArea.scrollHeight;
    }

    await delay(speed);
  }

  // Remove cursor after typing completes
  await delay(400);
  cursor.remove();
}

/**
 * Render a mock DataFrame as an HTML table.
 */
function renderMockTable(element, data) {
  const table = document.createElement('table');
  table.className = 'mock-table';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Add row label column if present
  if (data.row_labels) {
    const th = document.createElement('th');
    th.textContent = '';
    headerRow.appendChild(th);
  }

  data.columns.forEach(function(col) {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Data rows
  const tbody = document.createElement('tbody');
  data.rows.forEach(function(row, rowIdx) {
    const tr = document.createElement('tr');

    // Row label if present
    if (data.row_labels && data.row_labels[rowIdx]) {
      const labelTd = document.createElement('td');
      labelTd.className = 'mock-table__row-label';
      labelTd.textContent = data.row_labels[rowIdx];
      tr.appendChild(labelTd);
    }

    row.forEach(function(val) {
      const td = document.createElement('td');
      td.textContent = val;

      // Color PASS/FAIL cells
      if (val === 'PASS') {
        td.className = 'mock-table__cell--pass';
      } else if (val === 'FAIL') {
        td.className = 'mock-table__cell--fail';
      }

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  element.appendChild(table);
}

/**
 * Render a pre-rendered chart image with fade-in.
 */
function renderMockChart(element, imagePath) {
  const container = document.createElement('div');
  container.className = 'mock-chart';

  const img = document.createElement('img');
  img.src = APP_ROOT_MOCK + '/static/' + imagePath;
  img.alt = 'Chart output';
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.5s ease';

  img.onload = function() {
    img.style.opacity = '1';
  };

  container.appendChild(img);
  element.appendChild(container);
}

/**
 * Render JSON output with syntax highlighting.
 */
function renderMockJson(element, jsonContent) {
  const container = document.createElement('div');
  container.className = 'mock-json';

  const pre = document.createElement('pre');
  const formatted = typeof jsonContent === 'string'
    ? jsonContent
    : JSON.stringify(jsonContent, null, 2);
  pre.textContent = formatted;
  container.appendChild(pre);
  element.appendChild(container);
}

/**
 * Main mock test runner.
 * Reads mock output data from the code canvas's data-mock-output attribute,
 * simulates execution with a delay and animations.
 */
async function runMockTest(testId) {
  const canvas = document.querySelector('[data-test-id="' + testId + '"]');
  if (!canvas) return;

  const button = canvas.querySelector('.run-button');
  const outputArea = document.getElementById('output-' + testId);
  if (!outputArea) return;

  // Parse mock data
  var mockData;
  try {
    mockData = JSON.parse(canvas.dataset.mockOutput);
  } catch (e) {
    return;
  }

  // Set loading state
  button.classList.add('run-button--loading');
  button.innerHTML = '<span>&#8987;</span> Running...';

  // Clear previous output
  outputArea.innerHTML = '';
  outputArea.classList.add('code-canvas__output--visible');

  try {
    // Simulate based on output type
    if (mockData.type === 'stream') {
      await delay(300);
      await typewriterEffect(outputArea, mockData.content, 8);

    } else if (mockData.type === 'dataframe') {
      // Show preamble if present
      if (mockData.preamble) {
        var preambleDiv = document.createElement('div');
        preambleDiv.className = 'mock-preamble';
        outputArea.appendChild(preambleDiv);
        await typewriterEffect(preambleDiv, mockData.preamble, 8);
        await delay(400);
      }

      // Show computing spinner
      var spinner = document.createElement('div');
      spinner.style.cssText = 'color: #94a3b8; padding: 8px 0;';
      spinner.textContent = 'Computing metrics...';
      outputArea.appendChild(spinner);
      await delay(800);
      spinner.remove();

      // Render table
      renderMockTable(outputArea, mockData);

      // Show postscript if present
      if (mockData.postscript) {
        await delay(300);
        var postDiv = document.createElement('div');
        postDiv.className = 'mock-postscript';
        outputArea.appendChild(postDiv);
        await typewriterEffect(postDiv, mockData.postscript, 8);
      }

    } else if (mockData.type === 'chart') {
      // Show computing spinner then chart
      var chartSpinner = document.createElement('div');
      chartSpinner.style.cssText = 'color: #94a3b8; padding: 8px 0;';
      chartSpinner.textContent = 'Rendering visualization...';
      outputArea.appendChild(chartSpinner);
      await delay(1200);
      chartSpinner.remove();

      renderMockChart(outputArea, mockData.image_path);

    } else if (mockData.type === 'json') {
      await delay(500);
      await typewriterEffect(outputArea, mockData.content, 5);
    }

  } finally {
    // Reset button
    button.classList.remove('run-button--loading');
    button.innerHTML = '<span>&#9654;</span> Run';

    // Scroll output into view
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
