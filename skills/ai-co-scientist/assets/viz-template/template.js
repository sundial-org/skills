// AI Co-Scientist Visualization Script
// TREE_DATA_PLACEHOLDER

// Global state
let currentStage = null;
let currentIteration = 1;
let selectedNode = null;
let canvas;
let panX = 0;
let panY = 0;
let zoom = 1;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Node dimensions
const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const NODE_RADIUS = 8;

// Colors
const COLORS = {
    success: '#4ecca3',
    buggy: '#e94560',
    pending: '#888888',
    selected: '#ffc107',
    edge: '#0f3460',
    text: '#ffffff',
    subtext: '#888888'
};

function setup() {
    const container = document.getElementById('canvas-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas = createCanvas(w, h);
    canvas.parent('canvas-container');

    // Initialize UI
    initializeStageNav();
    updateHypothesisDisplay();

    // Find the first stage with data
    findInitialStage();

    // Handle window resize
    window.addEventListener('resize', () => {
        const container = document.getElementById('canvas-container');
        resizeCanvas(container.clientWidth, container.clientHeight);
    });
}

function initializeStageNav() {
    const buttons = document.querySelectorAll('.stage-btn');
    buttons.forEach(btn => {
        const stage = parseInt(btn.dataset.stage);

        // Check stage status from history
        const history = TREE_DATA.stage_history || [];
        const stageEntries = history.filter(e => e.stage === stage);

        if (stageEntries.length > 0) {
            const latestEntry = stageEntries[stageEntries.length - 1];
            if (latestEntry.outcome === 'success') {
                btn.classList.add('completed');
            } else if (latestEntry.outcome === 'loop_back') {
                btn.classList.add('loop-back');
            }
        }

        btn.addEventListener('click', () => {
            selectStage(stage);
        });
    });
}

function findInitialStage() {
    const history = TREE_DATA.stage_history || [];
    if (history.length > 0) {
        const latest = history[history.length - 1];
        selectStage(latest.stage, latest.iteration);
    } else {
        // No history, check for any trees
        const treeKeys = Object.keys(TREE_DATA.trees || {});
        if (treeKeys.length > 0) {
            const match = treeKeys[0].match(/stage_(\d+)_iter_(\d+)/);
            if (match) {
                selectStage(parseInt(match[1]), parseInt(match[2]));
            }
        }
    }
}

function selectStage(stage, iteration = null) {
    currentStage = stage;

    // Find the latest iteration for this stage if not specified
    if (iteration === null) {
        const history = TREE_DATA.stage_history || [];
        const stageEntries = history.filter(e => e.stage === stage);
        if (stageEntries.length > 0) {
            currentIteration = stageEntries[stageEntries.length - 1].iteration;
        } else {
            currentIteration = 1;
        }
    } else {
        currentIteration = iteration;
    }

    // Update nav buttons
    document.querySelectorAll('.stage-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.stage) === stage) {
            btn.classList.add('active');
        }
    });

    // Reset view
    panX = 50;
    panY = 50;
    zoom = 1;
    selectedNode = null;
    updateNodeDetails(null);
}

function updateHypothesisDisplay() {
    const display = document.getElementById('hypothesis-display');
    if (TREE_DATA.hypothesis) {
        display.textContent = `Hypothesis: ${TREE_DATA.hypothesis}`;
    } else {
        display.textContent = 'No hypothesis set';
    }
}

function getCurrentTreeKey() {
    return `stage_${currentStage}_iter_${currentIteration}`;
}

function getCurrentTree() {
    const key = getCurrentTreeKey();
    return TREE_DATA.trees ? TREE_DATA.trees[key] : null;
}

function getCurrentLayout() {
    const key = getCurrentTreeKey();
    return TREE_DATA.layouts ? TREE_DATA.layouts[key] : null;
}

function draw() {
    background(26, 26, 46);

    if (currentStage === null) {
        drawEmptyState();
        return;
    }

    const tree = getCurrentTree();
    const layout = getCurrentLayout();

    if (!tree || !layout || Object.keys(tree.nodes || {}).length === 0) {
        drawEmptyState();
        return;
    }

    push();
    translate(panX, panY);
    scale(zoom);

    // Draw edges first
    drawEdges(tree, layout);

    // Draw nodes
    drawNodes(tree, layout);

    pop();
}

function drawEmptyState() {
    fill(100);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text('No experiments in this stage yet', width / 2, height / 2 - 20);
    textSize(12);
    fill(80);
    text('Start by adding a root node to begin experimentation', width / 2, height / 2 + 10);
}

function drawEdges(tree, layout) {
    stroke(COLORS.edge);
    strokeWeight(2);

    for (const [nodeId, node] of Object.entries(tree.nodes || {})) {
        const pos = layout[nodeId];
        if (!pos) continue;

        for (const childId of node.children || []) {
            const childPos = layout[childId];
            if (childPos) {
                line(pos.x, pos.y + NODE_HEIGHT / 2, childPos.x, childPos.y - NODE_HEIGHT / 2);
            }
        }
    }
}

function drawNodes(tree, layout) {
    for (const [nodeId, node] of Object.entries(tree.nodes || {})) {
        const pos = layout[nodeId];
        if (!pos) continue;

        const x = pos.x - NODE_WIDTH / 2;
        const y = pos.y - NODE_HEIGHT / 2;

        // Determine node color
        let nodeColor;
        if (node.is_buggy) {
            nodeColor = color(COLORS.buggy);
        } else if (node.metric) {
            nodeColor = color(COLORS.success);
        } else {
            nodeColor = color(COLORS.pending);
        }

        // Draw selection highlight
        if (selectedNode === nodeId) {
            stroke(COLORS.selected);
            strokeWeight(3);
        } else {
            stroke(nodeColor);
            strokeWeight(1);
        }

        // Draw node rectangle
        fill(32, 32, 64);
        rect(x, y, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);

        // Draw status indicator
        noStroke();
        fill(nodeColor);
        ellipse(x + 15, y + 15, 10, 10);

        // Draw step number
        fill(COLORS.text);
        textAlign(LEFT, TOP);
        textSize(10);
        text(`Step ${node.step}`, x + 25, y + 10);

        // Draw plan (truncated)
        fill(COLORS.subtext);
        textSize(11);
        const planText = node.plan || 'No plan';
        const truncated = planText.length > 40 ? planText.substring(0, 40) + '...' : planText;
        text(truncated, x + 10, y + 30, NODE_WIDTH - 20, NODE_HEIGHT - 40);

        // Draw metric if present
        if (node.metric && node.metric.value !== undefined) {
            fill(COLORS.success);
            textSize(12);
            textAlign(RIGHT, BOTTOM);
            text(node.metric.value.toFixed(3), x + NODE_WIDTH - 10, y + NODE_HEIGHT - 8);
        }
    }
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    const tree = getCurrentTree();
    const layout = getCurrentLayout();
    if (!tree || !layout) return;

    // Check if clicked on a node
    const clickX = (mouseX - panX) / zoom;
    const clickY = (mouseY - panY) / zoom;

    for (const [nodeId, pos] of Object.entries(layout)) {
        const x = pos.x - NODE_WIDTH / 2;
        const y = pos.y - NODE_HEIGHT / 2;

        if (clickX >= x && clickX <= x + NODE_WIDTH &&
            clickY >= y && clickY <= y + NODE_HEIGHT) {
            selectedNode = nodeId;
            updateNodeDetails(tree.nodes[nodeId]);
            return;
        }
    }

    // Start panning
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function mouseReleased() {
    isDragging = false;
}

function mouseDragged() {
    if (isDragging) {
        panX += mouseX - lastMouseX;
        panY += mouseY - lastMouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseWheel(event) {
    const zoomSensitivity = 0.001;
    zoom -= event.delta * zoomSensitivity;
    zoom = constrain(zoom, 0.3, 2);
    return false;
}

function updateNodeDetails(node) {
    const panel = document.getElementById('node-details');

    if (!node) {
        panel.innerHTML = `
            <div class="empty-state">
                <h3>No Node Selected</h3>
                <p>Click a node to view details</p>
            </div>
        `;
        return;
    }

    const metricHtml = node.metric
        ? `<span class="metric">${node.metric.name || 'value'}: ${node.metric.value.toFixed(4)}</span>`
        : '<span class="metric buggy">No metric</span>';

    const statusHtml = node.is_buggy
        ? '<span class="metric buggy">BUGGY</span>'
        : metricHtml;

    panel.innerHTML = `
        <div class="section">
            <div class="label">Node ID</div>
            <div class="value">${node.id}</div>
        </div>

        <div class="section">
            <div class="label">Step / Stage</div>
            <div class="value">Step ${node.step} | Stage ${node.stage}</div>
        </div>

        <div class="section">
            <div class="label">Status</div>
            <div class="value">${statusHtml}</div>
        </div>

        <div class="section">
            <div class="label">Plan</div>
            <div class="value">${escapeHtml(node.plan || 'No plan')}</div>
        </div>

        <div class="section">
            <div class="label">Code</div>
            <div class="code">${escapeHtml(node.code || 'No code')}</div>
        </div>

        <div class="section">
            <div class="label">Output</div>
            <div class="code">${escapeHtml(node.term_out || 'No output')}</div>
        </div>

        <div class="section">
            <div class="label">Analysis</div>
            <div class="value">${escapeHtml(node.analysis || 'No analysis')}</div>
        </div>

        ${node.commit_hash ? `
        <div class="section">
            <div class="label">Git Commit</div>
            <div class="value">${node.commit_hash}</div>
        </div>
        ` : ''}

        ${node.plots && node.plots.length > 0 ? `
        <div class="section">
            <div class="label">Plots</div>
            <div class="value">${node.plots.join(', ')}</div>
        </div>
        ` : ''}
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-reload check (for development)
let lastModified = null;

async function checkForUpdates() {
    try {
        const response = await fetch(window.location.href, { method: 'HEAD' });
        const modified = response.headers.get('last-modified');
        if (lastModified && modified !== lastModified) {
            window.location.reload();
        }
        lastModified = modified;
    } catch (e) {
        // Ignore errors
    }
}

// Check for updates every 2 seconds
setInterval(checkForUpdates, 2000);
