// D3.js diagram renderers for blog posts
console.log('diagrams.js loaded, d3 available:', typeof d3 !== 'undefined');

/**
 * Render JEPA architecture diagram with real images showing invariance loss
 * Interactive: hover on View Generation to see crop regions on original image
 */
function renderJEPADiagram(containerId) {
  console.log('renderJEPADiagram called with:', containerId);
  const container = document.getElementById(containerId);
  console.log('Container found:', !!container, 'D3 available:', typeof d3 !== 'undefined');
  if (!container || typeof d3 === 'undefined') {
    console.error('Cannot render diagram:', containerId, typeof d3);
    return;
  }

  const width = 620;
  const height = 580;

  // Colors
  const colors = {
    bg: '#0a0c0a',
    box: '#1a1c1a',
    stroke: '#444',
    text: '#eee',
    muted: '#888',
    accent: '#4a9eff',
    green: '#1a3a1a',
    loss: '#2a1a1a',
    globalCrop: '#4a9eff',
    localCrop: '#51cf66'
  };

  container.innerHTML = '';

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background', colors.bg)
    .style('border-radius', '6px')
    .style('display', 'block')
    .style('margin', '0 auto');

  // Define arrow marker
  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrow-jepa')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', colors.muted);

  const cx = width / 2;

  // Helper functions
  function box(x, y, w, h, label, sub, fill = colors.box) {
    const g = svg.append('g');
    g.append('rect')
      .attr('x', x - w/2).attr('y', y - h/2)
      .attr('width', w).attr('height', h)
      .attr('rx', 4)
      .attr('fill', fill)
      .attr('stroke', colors.stroke);
    g.append('text')
      .attr('x', x).attr('y', sub ? y - 3 : y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '12px')
      .text(label);
    if (sub) {
      g.append('text')
        .attr('x', x).attr('y', y + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.muted)
        .attr('font-size', '9px')
        .text(sub);
    }
    return g;
  }

  function arrow(x1, y1, x2, y2) {
    svg.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-jepa)');
  }

  function realImage(x, y, size, src, label) {
    const g = svg.append('g');
    g.append('rect')
      .attr('x', x - size/2 - 2).attr('y', y - size/2 - 2)
      .attr('width', size + 4).attr('height', size + 4)
      .attr('rx', 3)
      .attr('fill', 'none')
      .attr('stroke', colors.stroke)
      .attr('stroke-width', 1);
    g.append('image')
      .attr('x', x - size/2).attr('y', y - size/2)
      .attr('width', size).attr('height', size)
      .attr('href', src)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .style('image-rendering', 'pixelated');
    if (label) {
      g.append('text')
        .attr('x', x).attr('y', y + size/2 + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.muted)
        .attr('font-size', '10px')
        .text(label);
    }
    return g;
  }

  function embedding(x, y, label, color = colors.accent) {
    const g = svg.append('g');
    g.append('circle')
      .attr('cx', x).attr('cy', y).attr('r', 12)
      .attr('fill', color + '22')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    g.append('text')
      .attr('x', x).attr('y', y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(label);
    return g;
  }

  // Layout
  const y1 = 55;   // Original image
  const y2 = 140;  // View generation box
  const y3 = 240;  // Views row
  const y4 = 340;  // Encoder
  const y5 = 420;  // Embeddings
  const y6 = 500;  // Loss insight
  const y7 = 555;  // Loss formula

  // Detect if we're in the posts directory or root
  const isInPostsDir = window.location.pathname.includes('/posts/');
  const imgPath = isInPostsDir ? 'images/' : 'posts/images/';
  const imgSize = 64;

  // 1. Original Image
  realImage(cx, y1, imgSize, imgPath + 'jepa_original.png', 'Image x');

  // Define crop regions (relative to image top-left corner)
  const imgLeft = cx - imgSize/2;
  const imgTop = y1 - imgSize/2;

  const crops = [
    // Global crops (larger, ~50-100% of image) - blue solid
    { x: 2, y: 2, w: 50, h: 50, color: colors.globalCrop, dash: false },
    { x: 10, y: 8, w: 46, h: 46, color: colors.globalCrop, dash: false },
    // Local crops (smaller, ~20-50% of image) - green dashed
    { x: 0, y: 0, w: 24, h: 24, color: colors.localCrop, dash: true },
    { x: 38, y: 4, w: 22, h: 22, color: colors.localCrop, dash: true },
    { x: 20, y: 40, w: 20, h: 20, color: colors.localCrop, dash: true },
  ];

  // Create individual crop overlays (one per view)
  const cropRects = crops.map(crop => {
    return svg.append('rect')
      .attr('x', imgLeft + crop.x)
      .attr('y', imgTop + crop.y)
      .attr('width', crop.w)
      .attr('height', crop.h)
      .attr('fill', crop.color + '33')
      .attr('stroke', crop.color)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', crop.dash ? '4,2' : 'none')
      .style('opacity', 0)
      .style('pointer-events', 'none');
  });

  // Helper to show/hide specific crop
  function showCrop(index) {
    cropRects[index].transition().duration(150).style('opacity', 1);
  }
  function hideCrop(index) {
    cropRects[index].transition().duration(150).style('opacity', 0);
  }
  function showAllCrops() {
    cropRects.forEach(r => r.transition().duration(150).style('opacity', 1));
  }
  function hideAllCrops() {
    cropRects.forEach(r => r.transition().duration(150).style('opacity', 0));
  }

  // Arrow to view generation
  arrow(cx, y1 + 40, cx, y2 - 22);

  // 2. View Generation Box (interactive - shows all crops)
  const viewGenBox = box(cx, y2, 400, 40, 'View Generation', 'hover to see crop regions');

  viewGenBox.append('rect')
    .attr('x', cx - 200).attr('y', y2 - 20)
    .attr('width', 400).attr('height', 40)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('mouseenter', showAllCrops)
    .on('mouseleave', hideAllCrops);

  // 3. Multiple Views with hover interactions
  const viewY = y3;
  const globalSize = 44;
  const localSize = 32;
  const spacing = 85;

  const globalX1 = cx - spacing * 2;
  const globalX2 = cx - spacing;
  const localX1 = cx + spacing * 0.3;
  const localX2 = cx + spacing * 1.1;
  const localX3 = cx + spacing * 1.9;

  // Helper to create interactive image
  function interactiveImage(x, y, size, src, label, cropIndex) {
    const g = realImage(x, y, size, src, label);
    // Add hover area
    g.append('rect')
      .attr('x', x - size/2 - 2).attr('y', y - size/2 - 2)
      .attr('width', size + 4).attr('height', size + 4)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', () => showCrop(cropIndex))
      .on('mouseleave', () => hideCrop(cropIndex));
    return g;
  }

  interactiveImage(globalX1, viewY, globalSize, imgPath + 'jepa_global_1.png', 'Global₁', 0);
  interactiveImage(globalX2, viewY, globalSize, imgPath + 'jepa_global_2.png', 'Global₂', 1);
  interactiveImage(localX1, viewY, localSize, imgPath + 'jepa_local_1.png', 'Local₁', 2);
  interactiveImage(localX2, viewY, localSize, imgPath + 'jepa_local_2.png', 'Local₂', 3);
  interactiveImage(localX3, viewY, localSize, imgPath + 'jepa_local_3.png', 'Local₃', 4);

  // Arrows from view gen to views
  arrow(cx - 100, y2 + 22, globalX1, viewY - globalSize/2 - 8);
  arrow(cx - 50, y2 + 22, globalX2, viewY - globalSize/2 - 8);
  arrow(cx + 30, y2 + 22, localX1, viewY - localSize/2 - 8);
  arrow(cx + 80, y2 + 22, localX2, viewY - localSize/2 - 8);
  arrow(cx + 130, y2 + 22, localX3, viewY - localSize/2 - 8);

  // 4. Shared Encoder
  box(cx, y4, 380, 40, 'Shared Encoder (ViT)', 'same weights for all views', colors.green);

  // Arrows from views to encoder
  arrow(globalX1, viewY + globalSize/2 + 18, cx - 150, y4 - 22);
  arrow(globalX2, viewY + globalSize/2 + 18, cx - 80, y4 - 22);
  arrow(localX1, viewY + localSize/2 + 18, cx + 20, y4 - 22);
  arrow(localX2, viewY + localSize/2 + 18, cx + 80, y4 - 22);
  arrow(localX3, viewY + localSize/2 + 18, cx + 140, y4 - 22);

  // 5. Embeddings
  const embY = y5;
  const embSpacing = 55;
  const embColors = [colors.globalCrop, colors.globalCrop, colors.localCrop, colors.localCrop, colors.localCrop];
  const embLabels = ['z₁', 'z₂', 'z₃', 'z₄', '...'];
  const embXStart = cx - embSpacing * 2;
  const encoderOutX = [cx - 150, cx - 80, cx + 20, cx + 80, cx + 140];

  for (let i = 0; i < 5; i++) {
    const ex = embXStart + i * embSpacing;
    embedding(ex, embY, embLabels[i], embColors[i]);
    arrow(encoderOutX[i], y4 + 22, ex, embY - 16);
  }

  // 6. Key Insight Box
  svg.append('rect')
    .attr('x', cx - 250).attr('y', y6 - 22)
    .attr('width', 500).attr('height', 44)
    .attr('rx', 4)
    .attr('fill', '#1a1a2a')
    .attr('stroke', '#3a3a5a');

  svg.append('text')
    .attr('x', cx).attr('y', y6 - 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#aaf')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .text('Key Insight: Global = Mean of Locals');

  svg.append('text')
    .attr('x', cx).attr('y', y6 + 12)
    .attr('text-anchor', 'middle')
    .attr('fill', colors.muted)
    .attr('font-size', '10px')
    .text('z_global ≈ mean(z_local) → each patch ≈ its corresponding local crop');

  // Arrows from embeddings to insight
  for (let i = 0; i < 5; i++) {
    const ex = embXStart + i * embSpacing;
    arrow(ex, embY + 14, cx - 60 + i * 30, y6 - 24);
  }

  // 7. Loss formula
  svg.append('rect')
    .attr('x', cx - 180).attr('y', y7 - 16)
    .attr('width', 360).attr('height', 32)
    .attr('rx', 4)
    .attr('fill', colors.loss)
    .attr('stroke', colors.stroke);

  svg.append('text')
    .attr('x', cx).attr('y', y7 + 4)
    .attr('text-anchor', 'middle')
    .attr('fill', colors.text)
    .attr('font-size', '12px')
    .text('ℒ_inv = Σ ‖zᵥ − z̄‖²  →  minimize variance across views');

  console.log('JEPA diagram rendered successfully');
}

/**
 * Render Stop-Gradient & EMA comparison diagram
 * Shows both SimSiam (stop-gradient) and BYOL/MoCo (EMA) approaches side by side
 */
function renderSimSiamDiagram(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof d3 === 'undefined') {
    console.error('Cannot render simsiam diagram:', containerId);
    return;
  }

  const width = 580;
  const height = 280;

  const colors = {
    bg: '#0a0c0a',
    box: '#1a1c1a',
    stroke: '#444',
    text: '#eee',
    muted: '#888',
    accent: '#4a9eff',
    green: '#1a3a1a',
    orange: '#3a2a1a',
    red: '#3a1a1a',
    stopGrad: '#ff6b6b',
    ema: '#ffa94d'
  };

  container.innerHTML = '';

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background', colors.bg)
    .style('border-radius', '6px')
    .style('display', 'block')
    .style('margin', '0 auto');

  // Arrow markers
  const defs = svg.append('defs');
  ['muted', 'accent', 'stopGrad', 'ema'].forEach(colorKey => {
    defs.append('marker')
      .attr('id', `arrow-${colorKey}`)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', colors[colorKey]);
  });

  // Helper functions
  function box(x, y, w, h, label, fill = colors.box, textColor = colors.text) {
    const g = svg.append('g');
    g.append('rect')
      .attr('x', x - w/2).attr('y', y - h/2)
      .attr('width', w).attr('height', h)
      .attr('rx', 4)
      .attr('fill', fill)
      .attr('stroke', colors.stroke);
    g.append('text')
      .attr('x', x).attr('y', y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .text(label);
    return g;
  }

  function arrow(x1, y1, x2, y2, colorKey = 'muted', dashed = false) {
    svg.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', colors[colorKey])
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', dashed ? '4,3' : 'none')
      .attr('marker-end', `url(#arrow-${colorKey})`);
  }

  function label(x, y, text, color = colors.text, size = '10px') {
    svg.append('text')
      .attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-size', size)
      .text(text);
  }

  // Layout - two columns with more spacing
  const leftCol = 145;   // SimSiam
  const rightCol = 435;  // BYOL/EMA
  const colSpread = 55;  // horizontal spread within each column

  // Vertical positions
  const y0 = 28;   // Title
  const y1 = 58;   // Input
  const y2 = 105;  // Encoder
  const y3 = 160;  // Processing (predictor / stop-grad)
  const y4 = 210;  // Output
  const y5 = 255;  // Loss

  // ============ LEFT: SimSiam (Stop-Gradient) ============
  label(leftCol, y0, 'SimSiam (Stop-Gradient)', colors.text, '12px');

  // Input views
  label(leftCol - colSpread, y1, 'x₁', colors.muted, '11px');
  label(leftCol + colSpread, y1, 'x₂', colors.muted, '11px');

  // Arrows to encoders
  arrow(leftCol - colSpread, y1 + 8, leftCol - colSpread, y2 - 14);
  arrow(leftCol + colSpread, y1 + 8, leftCol + colSpread, y2 - 14);

  // Encoders
  box(leftCol - colSpread, y2, 70, 26, 'Encoder f', colors.green);
  box(leftCol + colSpread, y2, 70, 26, 'Encoder f', colors.green);

  // Shared indicator
  svg.append('line')
    .attr('x1', leftCol - 15).attr('y1', y2)
    .attr('x2', leftCol + 15).attr('y2', y2)
    .attr('stroke', colors.accent)
    .attr('stroke-dasharray', '3,2');

  // z₁ → predictor
  arrow(leftCol - colSpread, y2 + 15, leftCol - colSpread, y3 - 14);
  box(leftCol - colSpread, y3, 70, 26, 'Predictor h', colors.box);

  // z₂ → stop gradient
  arrow(leftCol + colSpread, y2 + 15, leftCol + colSpread, y3 - 14);
  box(leftCol + colSpread, y3, 50, 26, 'sg( )', colors.red, colors.stopGrad);

  // Outputs
  arrow(leftCol - colSpread, y3 + 15, leftCol - colSpread, y4 - 8);
  label(leftCol - colSpread, y4, 'p₁', colors.accent, '11px');

  arrow(leftCol + colSpread, y3 + 15, leftCol + colSpread, y4 - 8, 'stopGrad', true);
  label(leftCol + colSpread, y4, 'sg(z₂)', colors.stopGrad, '11px');

  // Loss connection
  svg.append('line')
    .attr('x1', leftCol - 30).attr('y1', y4)
    .attr('x2', leftCol + 30).attr('y2', y4)
    .attr('stroke', colors.muted)
    .attr('stroke-width', 1);

  // Loss formula
  box(leftCol, y5, 120, 24, 'ℒ = ‖p₁ − sg(z₂)‖²', colors.red, colors.text);

  // Gradient annotations (below the boxes)
  label(leftCol - colSpread, y3 + 28, 'grad ↑', colors.accent, '8px');
  label(leftCol + colSpread, y3 + 28, 'no grad', colors.stopGrad, '8px');

  // ============ RIGHT: BYOL/MoCo (EMA) ============
  label(rightCol, y0, 'BYOL / MoCo (EMA)', colors.text, '12px');

  // Input views
  label(rightCol - colSpread, y1, 'x₁', colors.muted, '11px');
  label(rightCol + colSpread, y1, 'x₂', colors.muted, '11px');

  // Arrows to encoders
  arrow(rightCol - colSpread, y1 + 8, rightCol - colSpread, y2 - 14);
  arrow(rightCol + colSpread, y1 + 8, rightCol + colSpread, y2 - 14);

  // Online encoder (left)
  box(rightCol - colSpread, y2, 70, 26, 'Online f_θ', colors.green);

  // Target encoder (right) - EMA updated
  box(rightCol + colSpread, y2, 70, 26, 'Target f_ξ', colors.orange);

  // EMA update arrow (curved, above encoders)
  svg.append('path')
    .attr('d', `M ${rightCol - 15} ${y2 - 16} Q ${rightCol} ${y2 - 32} ${rightCol + 15} ${y2 - 16}`)
    .attr('fill', 'none')
    .attr('stroke', colors.ema)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4,2')
    .attr('marker-end', 'url(#arrow-ema)');
  label(rightCol, y2 - 40, 'ξ ← mξ + (1-m)θ', colors.ema, '8px');

  // z₁ → predictor
  arrow(rightCol - colSpread, y2 + 15, rightCol - colSpread, y3 - 14);
  box(rightCol - colSpread, y3, 70, 26, 'Predictor h', colors.box);

  // z₂ (target) - just passes through (no predictor)
  arrow(rightCol + colSpread, y2 + 15, rightCol + colSpread, y4 - 8, 'ema');

  // Outputs
  arrow(rightCol - colSpread, y3 + 15, rightCol - colSpread, y4 - 8);
  label(rightCol - colSpread, y4, 'p₁', colors.accent, '11px');

  label(rightCol + colSpread, y4, 'z₂', colors.ema, '11px');

  // Loss connection
  svg.append('line')
    .attr('x1', rightCol - 30).attr('y1', y4)
    .attr('x2', rightCol + 30).attr('y2', y4)
    .attr('stroke', colors.muted)
    .attr('stroke-width', 1);

  // Loss formula
  box(rightCol, y5, 100, 24, 'ℒ = ‖p₁ − z₂‖²', colors.orange, colors.text);

  // Gradient annotations
  label(rightCol - colSpread, y3 + 28, 'grad ↑', colors.accent, '8px');
  label(rightCol + colSpread, y3, 'no grad', colors.ema, '8px');

  // ============ Divider ============
  svg.append('line')
    .attr('x1', width / 2).attr('y1', y0 + 10)
    .attr('x2', width / 2).attr('y2', y5 + 15)
    .attr('stroke', colors.stroke)
    .attr('stroke-dasharray', '5,5');

  console.log('SimSiam/EMA diagram rendered successfully');
}

window.renderJEPADiagram = renderJEPADiagram;
window.renderSimSiamDiagram = renderSimSiamDiagram;
