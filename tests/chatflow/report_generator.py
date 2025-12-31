"""
ChatFlow Test Report Generator
==============================
Generates comprehensive HTML test reports with scores, metrics, and visualizations.

ZERO FUNCTIONAL CHANGES: This module is read-only and does not modify
any production code, chat flow, or APIs.

Features:
- Comprehensive HTML report with all test results
- Score visualization with color-coded indicators
- Category breakdown with charts
- Failed test details with assertions
- Performance metrics

Author: Summitly QA Team
Date: December 31, 2025
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from tests.chatflow.test_schemas import (
    TestCaseResult,
    TestStatus,
    TestSuiteResult,
    TurnResult,
)


# =============================================================================
# HTML TEMPLATES
# =============================================================================

HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatFlow Test Report - {suite_name}</title>
    <style>
        :root {{
            --color-pass: #22c55e;
            --color-fail: #ef4444;
            --color-error: #f97316;
            --color-skip: #6b7280;
            --color-bg: #f8fafc;
            --color-card: #ffffff;
            --color-border: #e2e8f0;
            --color-text: #1e293b;
            --color-text-secondary: #64748b;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        /* Header */
        .header {{
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 24px;
        }}
        
        .header h1 {{
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }}
        
        .header .meta {{
            opacity: 0.9;
            font-size: 14px;
        }}
        
        /* Summary Cards */
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        
        .summary-card {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }}
        
        .summary-card .label {{
            font-size: 12px;
            text-transform: uppercase;
            color: var(--color-text-secondary);
            margin-bottom: 4px;
        }}
        
        .summary-card .value {{
            font-size: 32px;
            font-weight: 700;
        }}
        
        .summary-card.pass .value {{ color: var(--color-pass); }}
        .summary-card.fail .value {{ color: var(--color-fail); }}
        .summary-card.error .value {{ color: var(--color-error); }}
        
        /* Score Cards */
        .scores-section {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }}
        
        .scores-section h2 {{
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--color-border);
        }}
        
        .scores-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }}
        
        .score-card {{
            padding: 16px;
            border-radius: 8px;
            background: #f1f5f9;
        }}
        
        .score-card .score-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }}
        
        .score-card .score-name {{
            font-weight: 600;
            font-size: 14px;
        }}
        
        .score-card .score-value {{
            font-size: 24px;
            font-weight: 700;
        }}
        
        .score-bar {{
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }}
        
        .score-bar .fill {{
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }}
        
        .score-excellent .score-value {{ color: #22c55e; }}
        .score-excellent .fill {{ background: #22c55e; }}
        
        .score-good .score-value {{ color: #84cc16; }}
        .score-good .fill {{ background: #84cc16; }}
        
        .score-fair .score-value {{ color: #eab308; }}
        .score-fair .fill {{ background: #eab308; }}
        
        .score-poor .score-value {{ color: #f97316; }}
        .score-poor .fill {{ background: #f97316; }}
        
        .score-critical .score-value {{ color: #ef4444; }}
        .score-critical .fill {{ background: #ef4444; }}
        
        /* Category Section */
        .category-section {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }}
        
        .category-section h2 {{
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--color-border);
        }}
        
        .category-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
        }}
        
        .category-card {{
            padding: 16px;
            border-radius: 8px;
            background: #f8fafc;
            border: 1px solid var(--color-border);
        }}
        
        .category-card .category-name {{
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            text-transform: capitalize;
        }}
        
        .category-card .stats {{
            display: flex;
            gap: 16px;
        }}
        
        .category-card .stat {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}
        
        .category-card .stat-dot {{
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }}
        
        .category-card .stat-dot.pass {{ background: var(--color-pass); }}
        .category-card .stat-dot.fail {{ background: var(--color-fail); }}
        .category-card .stat-dot.error {{ background: var(--color-error); }}
        
        /* Test Results Table */
        .results-section {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }}
        
        .results-section h2 {{
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--color-border);
        }}
        
        .filter-tabs {{
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }}
        
        .filter-tab {{
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid var(--color-border);
            background: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }}
        
        .filter-tab:hover {{
            background: #f1f5f9;
        }}
        
        .filter-tab.active {{
            background: #6366f1;
            color: white;
            border-color: #6366f1;
        }}
        
        .test-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .test-table th {{
            text-align: left;
            padding: 12px;
            background: #f8fafc;
            border-bottom: 2px solid var(--color-border);
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            color: var(--color-text-secondary);
        }}
        
        .test-table td {{
            padding: 12px;
            border-bottom: 1px solid var(--color-border);
            vertical-align: top;
        }}
        
        .test-table tr:hover {{
            background: #f8fafc;
        }}
        
        .status-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }}
        
        .status-badge.passed {{
            background: #dcfce7;
            color: #166534;
        }}
        
        .status-badge.failed {{
            background: #fee2e2;
            color: #991b1b;
        }}
        
        .status-badge.error {{
            background: #ffedd5;
            color: #9a3412;
        }}
        
        .status-badge.skipped {{
            background: #f1f5f9;
            color: #475569;
        }}
        
        /* Test Detail */
        .test-detail {{
            margin-top: 12px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 13px;
        }}
        
        .test-detail h4 {{
            font-size: 13px;
            margin-bottom: 8px;
            color: var(--color-text-secondary);
        }}
        
        .assertion-list {{
            list-style: none;
        }}
        
        .assertion-list li {{
            padding: 4px 0;
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 12px;
        }}
        
        .assertion-list li.pass {{
            color: #166534;
        }}
        
        .assertion-list li.fail {{
            color: #991b1b;
        }}
        
        /* Conversation View */
        .conversation {{
            margin-top: 16px;
        }}
        
        .turn {{
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 8px;
        }}
        
        .turn.user {{
            background: #e0e7ff;
            margin-right: 20%;
        }}
        
        .turn.assistant {{
            background: #f1f5f9;
            margin-left: 20%;
        }}
        
        .turn .role {{
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--color-text-secondary);
            margin-bottom: 4px;
        }}
        
        .turn .message {{
            font-size: 14px;
        }}
        
        .turn .metadata {{
            margin-top: 8px;
            font-size: 11px;
            color: var(--color-text-secondary);
        }}
        
        /* Latency Section */
        .latency-section {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }}
        
        .latency-section h2 {{
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--color-border);
        }}
        
        .latency-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
        }}
        
        .latency-card {{
            text-align: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
        }}
        
        .latency-card .latency-value {{
            font-size: 28px;
            font-weight: 700;
            color: #6366f1;
        }}
        
        .latency-card .latency-unit {{
            font-size: 12px;
            color: var(--color-text-secondary);
        }}
        
        .latency-card .latency-label {{
            margin-top: 4px;
            font-size: 12px;
            color: var(--color-text-secondary);
        }}
        
        /* Failures Section */
        .failures-section {{
            background: var(--color-card);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid var(--color-fail);
        }}
        
        .failures-section h2 {{
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--color-border);
            color: var(--color-fail);
        }}
        
        .failure-item {{
            padding: 16px;
            background: #fef2f2;
            border-radius: 8px;
            margin-bottom: 12px;
        }}
        
        .failure-item:last-child {{
            margin-bottom: 0;
        }}
        
        .failure-item .failure-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }}
        
        .failure-item .test-id {{
            font-weight: 600;
            font-size: 14px;
        }}
        
        .failure-item .category {{
            font-size: 12px;
            color: var(--color-text-secondary);
        }}
        
        .failure-item .assertions {{
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 12px;
            color: #991b1b;
        }}
        
        /* Footer */
        .footer {{
            text-align: center;
            padding: 20px;
            color: var(--color-text-secondary);
            font-size: 12px;
        }}
        
        /* Expandable */
        .expandable {{
            cursor: pointer;
        }}
        
        .expandable-content {{
            display: none;
            padding-top: 12px;
        }}
        
        .expandable.expanded .expandable-content {{
            display: block;
        }}
        
        .expand-icon {{
            display: inline-block;
            width: 20px;
            transition: transform 0.2s;
        }}
        
        .expandable.expanded .expand-icon {{
            transform: rotate(90deg);
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🤖 {suite_name}</h1>
            <div class="meta">
                <span>📅 {report_date}</span> &nbsp;|&nbsp;
                <span>🌐 {server_url}</span> &nbsp;|&nbsp;
                <span>⏱️ Duration: {duration}s</span>
            </div>
        </div>
        
        <!-- Summary -->
        <div class="summary-grid">
            <div class="summary-card">
                <div class="label">Total Tests</div>
                <div class="value">{total_tests}</div>
            </div>
            <div class="summary-card pass">
                <div class="label">Passed</div>
                <div class="value">{passed}</div>
            </div>
            <div class="summary-card fail">
                <div class="label">Failed</div>
                <div class="value">{failed}</div>
            </div>
            <div class="summary-card error">
                <div class="label">Errors</div>
                <div class="value">{errors}</div>
            </div>
            <div class="summary-card">
                <div class="label">Pass Rate</div>
                <div class="value" style="color: {pass_rate_color}">{pass_rate}%</div>
            </div>
        </div>
        
        <!-- Quality Scores -->
        <div class="scores-section">
            <h2>📊 Quality Scores</h2>
            <div class="scores-grid">
                {score_cards}
            </div>
        </div>
        
        <!-- Latency Metrics -->
        <div class="latency-section">
            <h2>⚡ Response Time Metrics</h2>
            <div class="latency-grid">
                <div class="latency-card">
                    <div class="latency-value">{avg_latency}</div>
                    <div class="latency-unit">ms</div>
                    <div class="latency-label">Average</div>
                </div>
                <div class="latency-card">
                    <div class="latency-value">{min_latency}</div>
                    <div class="latency-unit">ms</div>
                    <div class="latency-label">Minimum</div>
                </div>
                <div class="latency-card">
                    <div class="latency-value">{max_latency}</div>
                    <div class="latency-unit">ms</div>
                    <div class="latency-label">Maximum</div>
                </div>
                <div class="latency-card">
                    <div class="latency-value">{p95_latency}</div>
                    <div class="latency-unit">ms</div>
                    <div class="latency-label">P95</div>
                </div>
            </div>
        </div>
        
        <!-- Category Breakdown -->
        <div class="category-section">
            <h2>📁 Category Breakdown</h2>
            <div class="category-grid">
                {category_cards}
            </div>
        </div>
        
        <!-- Failures -->
        {failures_section}
        
        <!-- All Test Results -->
        <div class="results-section">
            <h2>📋 All Test Results</h2>
            <div class="filter-tabs">
                <button class="filter-tab active" onclick="filterTests('all')">All ({total_tests})</button>
                <button class="filter-tab" onclick="filterTests('passed')">Passed ({passed})</button>
                <button class="filter-tab" onclick="filterTests('failed')">Failed ({failed})</button>
                <button class="filter-tab" onclick="filterTests('error')">Errors ({errors})</button>
            </div>
            <table class="test-table">
                <thead>
                    <tr>
                        <th>Test ID</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Scores</th>
                    </tr>
                </thead>
                <tbody>
                    {test_rows}
                </tbody>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Generated by Summitly ChatFlow Test Framework v1.0.0</p>
            <p>Report generated at {report_timestamp}</p>
        </div>
    </div>
    
    <script>
        // Toggle expandable sections
        document.querySelectorAll('.expandable').forEach(el => {{
            el.querySelector('.expandable-header').addEventListener('click', () => {{
                el.classList.toggle('expanded');
            }});
        }});
        
        // Filter tests
        function filterTests(filter) {{
            document.querySelectorAll('.filter-tab').forEach(tab => {{
                tab.classList.remove('active');
            }});
            event.target.classList.add('active');
            
            document.querySelectorAll('.test-table tbody tr').forEach(row => {{
                const status = row.dataset.status;
                if (filter === 'all' || status === filter) {{
                    row.style.display = '';
                }} else {{
                    row.style.display = 'none';
                }}
            }});
        }}
    </script>
</body>
</html>
'''


# =============================================================================
# REPORT GENERATOR
# =============================================================================

class ChatFlowReportGenerator:
    """
    Generates comprehensive HTML reports for chatflow test results.
    """
    
    def __init__(self, output_dir: str = "tests/chatflow/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_report(
        self,
        result: TestSuiteResult,
        output_filename: Optional[str] = None
    ) -> str:
        """
        Generate HTML report from test suite result.
        
        Args:
            result: TestSuiteResult from test runner
            output_filename: Optional custom filename
            
        Returns:
            Path to generated report file
        """
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"chatflow_report_{timestamp}.html"
        
        output_path = self.output_dir / output_filename
        
        # Generate HTML content
        html_content = self._render_html(result)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return str(output_path)
    
    def _render_html(self, result: TestSuiteResult) -> str:
        """Render the HTML template with test results."""
        
        # Calculate pass rate color
        pass_rate = result.pass_rate
        if pass_rate >= 90:
            pass_rate_color = "#22c55e"
        elif pass_rate >= 70:
            pass_rate_color = "#eab308"
        else:
            pass_rate_color = "#ef4444"
        
        # Generate score cards
        score_cards = self._generate_score_cards(result)
        
        # Generate category cards
        category_cards = self._generate_category_cards(result)
        
        # Generate failures section
        failures_section = self._generate_failures_section(result)
        
        # Generate test rows
        test_rows = self._generate_test_rows(result)
        
        # Fill template
        html = HTML_TEMPLATE.format(
            suite_name=result.suite_name,
            report_date=result.completed_at.strftime("%Y-%m-%d %H:%M:%S"),
            server_url=result.server_url,
            duration=f"{result.total_duration_seconds:.1f}",
            total_tests=result.total_tests,
            passed=result.passed,
            failed=result.failed,
            errors=result.errors,
            pass_rate=f"{result.pass_rate:.1f}",
            pass_rate_color=pass_rate_color,
            score_cards=score_cards,
            avg_latency=f"{result.avg_response_time_ms:.0f}",
            min_latency=f"{result.min_response_time_ms:.0f}",
            max_latency=f"{result.max_response_time_ms:.0f}",
            p95_latency=f"{result.p95_response_time_ms:.0f}",
            category_cards=category_cards,
            failures_section=failures_section,
            test_rows=test_rows,
            report_timestamp=datetime.now().isoformat()
        )
        
        return html
    
    def _get_score_class(self, score: float) -> str:
        """Get CSS class for score value."""
        if score >= 90:
            return "score-excellent"
        elif score >= 75:
            return "score-good"
        elif score >= 60:
            return "score-fair"
        elif score >= 40:
            return "score-poor"
        else:
            return "score-critical"
    
    def _generate_score_cards(self, result: TestSuiteResult) -> str:
        """Generate HTML for score cards."""
        scores = [
            ("Context Retention", result.avg_context_retention_score, "How well the bot remembers context across turns"),
            ("Follow-up Correctness", result.avg_followup_correctness_score, "Accuracy of follow-up handling"),
            ("NLP Extraction", result.avg_nlp_extraction_accuracy, "Accuracy of intent and entity extraction"),
            ("UX Quality", result.avg_ux_quality_score, "Overall user experience quality"),
        ]
        
        cards_html = []
        for name, score, description in scores:
            score_class = self._get_score_class(score)
            card = f'''
            <div class="score-card {score_class}">
                <div class="score-header">
                    <span class="score-name">{name}</span>
                    <span class="score-value">{score:.1f}</span>
                </div>
                <div class="score-bar">
                    <div class="fill" style="width: {score}%"></div>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #64748b;">{description}</div>
            </div>
            '''
            cards_html.append(card)
        
        return '\n'.join(cards_html)
    
    def _generate_category_cards(self, result: TestSuiteResult) -> str:
        """Generate HTML for category breakdown cards."""
        cards_html = []
        
        for category, stats in result.category_results.items():
            passed = stats.get("passed", 0)
            failed = stats.get("failed", 0)
            errors = stats.get("errors", 0)
            
            # Clean up category name for display
            display_name = category.replace("_", " ").title()
            
            card = f'''
            <div class="category-card">
                <div class="category-name">{display_name}</div>
                <div class="stats">
                    <div class="stat">
                        <span class="stat-dot pass"></span>
                        <span>{passed} passed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-dot fail"></span>
                        <span>{failed} failed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-dot error"></span>
                        <span>{errors} errors</span>
                    </div>
                </div>
            </div>
            '''
            cards_html.append(card)
        
        return '\n'.join(cards_html)
    
    def _generate_failures_section(self, result: TestSuiteResult) -> str:
        """Generate HTML for failures section."""
        if not result.failures:
            return ""
        
        failure_items = []
        for failure in result.failures[:20]:  # Limit to 20 failures
            assertions_html = ""
            if failure.get("failed_assertions"):
                assertions_html = "<br>".join(failure["failed_assertions"][:5])
            
            error_msg = failure.get("error_message", "")
            if error_msg:
                assertions_html = error_msg + "<br>" + assertions_html
            
            item = f'''
            <div class="failure-item">
                <div class="failure-header">
                    <span class="test-id">{failure.get("test_id", "Unknown")}</span>
                    <span class="category">{failure.get("category", "").replace("_", " ").title()}</span>
                </div>
                <div class="assertions">{assertions_html}</div>
            </div>
            '''
            failure_items.append(item)
        
        return f'''
        <div class="failures-section">
            <h2>❌ Failed Tests ({len(result.failures)})</h2>
            {''.join(failure_items)}
        </div>
        '''
    
    def _generate_test_rows(self, result: TestSuiteResult) -> str:
        """Generate HTML for test result rows."""
        rows_html = []
        
        for test_result in result.test_results:
            status_class = test_result.status.value
            
            # Score summary
            scores_html = f'''
            <span title="Context: {test_result.context_retention_score:.0f}%, 
                        Follow-up: {test_result.followup_correctness_score:.0f}%, 
                        NLP: {test_result.nlp_extraction_accuracy:.0f}%, 
                        UX: {test_result.ux_quality_score:.0f}%">
                📊 {((test_result.context_retention_score + 
                     test_result.followup_correctness_score + 
                     test_result.nlp_extraction_accuracy + 
                     test_result.ux_quality_score) / 4):.0f}%
            </span>
            '''
            
            # Detail section
            detail_html = self._generate_test_detail(test_result)
            
            row = f'''
            <tr data-status="{status_class}" class="expandable">
                <td>
                    <span class="expand-icon">▶</span>
                    {test_result.test_id}
                </td>
                <td>{test_result.category.value.replace("_", " ").title()}</td>
                <td>{test_result.description[:80]}...</td>
                <td><span class="status-badge {status_class}">{status_class}</span></td>
                <td>{test_result.total_duration_ms:.0f}ms</td>
                <td>{scores_html}</td>
            </tr>
            <tr data-status="{status_class}" class="expandable-content">
                <td colspan="6">
                    {detail_html}
                </td>
            </tr>
            '''
            rows_html.append(row)
        
        return '\n'.join(rows_html)
    
    def _generate_test_detail(self, test_result: TestCaseResult) -> str:
        """Generate detail section for a single test."""
        
        # Assertions
        assertions_html = ""
        if test_result.passed_assertions or test_result.failed_assertions:
            passed_items = "".join(
                f'<li class="pass">{a}</li>' 
                for a in test_result.passed_assertions[:10]
            )
            failed_items = "".join(
                f'<li class="fail">{a}</li>' 
                for a in test_result.failed_assertions[:10]
            )
            assertions_html = f'''
            <div class="test-detail">
                <h4>Assertions</h4>
                <ul class="assertion-list">
                    {passed_items}
                    {failed_items}
                </ul>
            </div>
            '''
        
        # Conversation
        conversation_html = ""
        if test_result.turn_results:
            turns = []
            for tr in test_result.turn_results[:10]:
                turn_html = f'''
                <div class="turn user">
                    <div class="role">👤 User</div>
                    <div class="message">{tr.user_message}</div>
                </div>
                <div class="turn assistant">
                    <div class="role">🤖 Assistant</div>
                    <div class="message">{tr.bot_response[:500]}{"..." if len(tr.bot_response) > 500 else ""}</div>
                    <div class="metadata">
                        Intent: {tr.intent_detected or "N/A"} | 
                        Confidence: {tr.confidence or "N/A"} | 
                        Properties: {tr.property_count} |
                        Time: {tr.response_time_ms:.0f}ms
                    </div>
                </div>
                '''
                turns.append(turn_html)
            
            conversation_html = f'''
            <div class="test-detail">
                <h4>Conversation</h4>
                <div class="conversation">
                    {"".join(turns)}
                </div>
            </div>
            '''
        
        # Error info
        error_html = ""
        if test_result.error_message:
            error_html = f'''
            <div class="test-detail" style="background: #fef2f2;">
                <h4>Error</h4>
                <pre style="font-size: 12px; white-space: pre-wrap;">{test_result.error_message}</pre>
            </div>
            '''
        
        return assertions_html + conversation_html + error_html


def generate_chatflow_report(result: TestSuiteResult, output_dir: str = "tests/chatflow/reports") -> str:
    """
    Convenience function to generate a chatflow report.
    
    Args:
        result: TestSuiteResult from test runner
        output_dir: Directory for report output
        
    Returns:
        Path to generated report file
    """
    generator = ChatFlowReportGenerator(output_dir=output_dir)
    return generator.generate_report(result)
