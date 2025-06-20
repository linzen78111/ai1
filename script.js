// 全局變數
let schoolsData = []; // 將由 API 提供
let comparisonChart = null;
let trendChart = null;
let employmentChart = null;
const API_URL = 'http://localhost:3000/api/recommend';

// 初始化圖表容器
function initializeChartContainers() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="chart-section">
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h4>學校匹配度比較</h4>
                        <canvas id="comparisonChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h4>就業方向分析</h4>
                        <canvas id="employmentChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="chart-container">
                        <h4>跨校研究領域趨勢</h4>
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 處理表單提交
async function handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('表單提交開始');
    
    // 顯示加載視窗
    console.log('準備顯示加載視窗');
    showLoadingOverlay(true);
    
    // 額外確保加載視窗顯示
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            console.log('檢查加載視窗狀態:', loadingOverlay.style.display);
            if (loadingOverlay.style.display !== 'block') {
                console.log('強制顯示加載視窗');
                loadingOverlay.style.display = 'block';
                loadingOverlay.style.visibility = 'visible';
                loadingOverlay.style.opacity = '1';
                loadingOverlay.style.pointerEvents = 'auto';
            }
        }
    }, 100);
    
    // 設定超時機制（10秒後自動隱藏加載視窗）
    const timeoutId = setTimeout(() => {
        showLoadingOverlay(false);
        showError('請求超時，請稍後再試或檢查網路連接。');
    }, 10000);
    
    try {
        const formData = {
            score: document.getElementById('score').value,
            interest: document.getElementById('interest').value,
            learningStyle: document.getElementById('learningStyle').value,
            futureGoal: document.getElementById('futureGoal').value,
            region: document.getElementById('region').value
        };

        console.log('發送請求:', formData);

        // 等待2秒後再發送請求
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // 清除超時計時器
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '無法獲取推薦結果');
        }

        if (!data.success) {
            throw new Error(data.message || '推薦系統發生錯誤');
        }

        // 隱藏加載視窗
        showLoadingOverlay(false);

        // 顯示結果
        displayResults(data);
    } catch (error) {
        console.error('獲取推薦失敗:', error);
        
        // 清除超時計時器
        clearTimeout(timeoutId);
        
        // 隱藏加載視窗
        showLoadingOverlay(false);
        
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="error-message">
                <h3>抱歉，發生了一些問題</h3>
                <p>${error.message}</p>
                <p>請檢查：</p>
                <ul>
                    <li>確保所有欄位都已填寫</li>
                    <li>確保後端服務器正在運行</li>
                    <li>稍後再試</li>
                </ul>
            </div>
        `;
    }
}

// 顯示結果的函數
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    if (!data.recommendations || data.recommendations.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">沒有找到符合條件的學校，請嘗試調整您的選擇。</div>';
        return;
    }

    let html = `
        <div class="analysis-summary">
            <h2>分析結果</h2>
            <p>根據您的選擇，我們從 ${data.totalSchools} 所學校中找到了 ${data.recommendations.length} 所最適合的學校。</p>
            ${data.scoreAnalysis ? `<p><strong>成績分析：</strong>${data.scoreAnalysis}</p>` : ''}
        </div>
        
        <!-- 視覺化分析區域 -->
        <div class="visualization-section mb-4">
            <h3>📊 數據分析與視覺化</h3>
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h4>🏫 學校匹配度比較</h4>
                        <canvas id="comparisonChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h4>💼 就業方向分析</h4>
                        <canvas id="employmentChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="chart-container">
                        <h4>🔬 跨校研究領域趨勢</h4>
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 跨校比對表格 -->
        <div class="comparison-table-section mb-4">
            <h3>📋 跨校詳細比對</h3>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>學校名稱</th>
                            <th>類型</th>
                            <th>地區</th>
                            <th>最低分數</th>
                            <th>匹配度</th>
                            <th>特色課程</th>
                            <th>研究領域</th>
                            <th>產業連結</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.recommendations.map((school, index) => `
                            <tr>
                                <td><strong>${school.name}</strong></td>
                                <td><span class="badge bg-primary">${school.type}</span></td>
                                <td><span class="badge bg-secondary">${school.region}</span></td>
                                <td>${school.minScore || 'N/A'}</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-success" style="width: ${Math.round((school.score / 15) * 100)}%">
                                            ${Math.round((school.score / 15) * 100)}%
                                        </div>
                                    </div>
                                </td>
                                <td>${school.courseHighlights ? school.courseHighlights.slice(0, 2).join(', ') : 'N/A'}</td>
                                <td>${school.researchAreas ? school.researchAreas.slice(0, 2).join(', ') : 'N/A'}</td>
                                <td>${school.industryConnections ? school.industryConnections.slice(0, 2).join(', ') : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 教育政策與學術研究分析 -->
        <div class="policy-analysis mb-4">
            <h3>📚 教育政策與學術研究分析</h3>
            <div class="policy-metrics">
                <div class="policy-metric">
                    <h4>🏫 學校類型分布</h4>
                    <div class="metric-value">${analyzeSchoolTypes(data.recommendations)}</div>
                    <div class="metric-label">國立/私立比例</div>
                </div>
                <div class="policy-metric">
                    <h4>🌍 地區分布</h4>
                    <div class="metric-value">${analyzeRegionDistribution(data.recommendations)}</div>
                    <div class="metric-label">地區多樣性</div>
                </div>
                <div class="policy-metric">
                    <h4>🎯 研究強度</h4>
                    <div class="metric-value">${analyzeResearchIntensity(data.recommendations)}</div>
                    <div class="metric-label">平均研究領域數</div>
                </div>
                <div class="policy-metric">
                    <h4>🤝 產學合作</h4>
                    <div class="metric-value">${analyzeIndustryPartnerships(data.recommendations)}</div>
                    <div class="metric-label">合作強度指數</div>
                </div>
            </div>
        </div>

        <div class="recommendations">
            <h3>🎯 推薦學校詳細資訊</h3>
    `;

    data.recommendations.forEach((school, index) => {
        html += `
            <div class="school-card">
                <div class="school-header">
                    <h3>${index + 1}. ${school.name}</h3>
                    <div class="school-badges">
                        <span class="badge badge-primary">${school.type}</span>
                        <span class="badge badge-secondary">${school.region}</span>
                        <span class="badge badge-success">匹配度：${Math.round((school.score / 15) * 100)}%</span>
                        ${school.scoreMatch ? `<span class="badge badge-info">成績符合</span>` : ''}
                    </div>
                </div>
                
                <div class="school-info">
                    <p><strong>特色：</strong>${school.features}</p>
                    <p><strong>地點：</strong>${school.location}</p>
                    ${school.minScore ? `<p><strong>最低錄取分數：</strong>${school.minScore}分</p>` : ''}
                </div>

                <div class="departments-section">
                    <h4>相關科系：</h4>
                    ${school.departments ? school.departments.map(dept => `
                        <div class="department-card">
                            <h5>${dept.name}</h5>
                            <div class="department-details">
                                <div class="detail-group">
                                    <strong>主要課程：</strong>
                                    <div class="tags">
                                        ${dept.courses ? dept.courses.map(course => `<span class="tag">${course}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                                    </div>
                                </div>
                                <div class="detail-group">
                                    <strong>研究方向：</strong>
                                    <div class="tags">
                                        ${dept.research ? dept.research.map(research => `<span class="tag">${research}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                                    </div>
                                </div>
                                <div class="detail-group">
                                    <strong>就業方向：</strong>
                                    <div class="tags">
                                        ${dept.career ? dept.career.map(career => `<span class="tag">${career}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p>科系資料待補充</p>'}
                </div>

                <div class="school-highlights">
                    <div class="highlight-group">
                        <strong>學習風格：</strong>
                        <div class="tags">
                            ${school.learningStyle ? school.learningStyle.map(style => `<span class="tag">${style}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                        </div>
                    </div>
                    <div class="highlight-group">
                        <strong>未來目標：</strong>
                        <div class="tags">
                            ${school.futureGoals ? school.futureGoals.map(goal => `<span class="tag">${goal}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                        </div>
                    </div>
                    <div class="highlight-group">
                        <strong>產業連結：</strong>
                        <div class="tags">
                            ${school.industryConnections ? school.industryConnections.map(industry => `<span class="tag">${industry}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                        </div>
                    </div>
                    <div class="highlight-group">
                        <strong>研究領域：</strong>
                        <div class="tags">
                            ${school.researchAreas ? school.researchAreas.map(area => `<span class="tag">${area}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                        </div>
                    </div>
                    <div class="highlight-group">
                        <strong>特色課程：</strong>
                        <div class="tags">
                            ${school.courseHighlights ? school.courseHighlights.map(course => `<span class="tag">${course}</span>`).join('') : '<span class="tag">資料待補充</span>'}
                        </div>
                    </div>
                    ${school.certificationSupport ? `
                    <div class="highlight-group">
                        <strong>🏆 證照輔導：</strong>
                        <div class="tags">
                            ${school.certificationSupport.map(cert => `<span class="tag certification-tag">${cert}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${school.industryPartnerships ? `
                    <div class="highlight-group">
                        <strong>🤝 產學合作：</strong>
                        <div class="tags">
                            ${school.industryPartnerships.map(partnership => `<span class="tag partnership-tag">${partnership}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="school-actions">
                    <a href="${school.url}" target="_blank" class="btn btn-primary">官方網站</a>
                    <button class="btn btn-outline-primary" onclick="showSchoolDetails('${school.name}')">詳細資訊</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
    
    // 更新所有圖表
    updateComparisonChart(data.recommendations);
    updateEmploymentChart(data.recommendations);
    updateTrendChart(data.recommendations);
}

// 顯示學校詳細資訊
async function showSchoolDetails(schoolName) {
    try {
        const response = await fetch(`/api/schools/${encodeURIComponent(schoolName)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '無法獲取學校詳細資料');
        }

        const school = data.school;
        const modalContent = document.getElementById('schoolDetailContent');
        
        modalContent.innerHTML = `
            <div class="school-details">
                <h4>${school.name}</h4>
                <div class="school-badges mb-3">
                    <span class="badge badge-primary">${school.type}</span>
                    <span class="badge badge-secondary">${school.region}</span>
                    <span class="badge badge-info">${school.location}</span>
                </div>
                
                <hr>
                <h5>學校特色</h5>
                <p>${school.features}</p>
                
                <h5>科系資訊</h5>
                ${school.departments ? school.departments.map(dept => `
                    <div class="department-detail mb-4">
                        <h6>${dept.name}</h6>
                        <div class="row">
                            <div class="col-md-4">
                                <strong>主要課程：</strong>
                                <ul>
                                    ${dept.courses ? dept.courses.map(course => `<li>${course}</li>`).join('') : '<li>資料待補充</li>'}
                                </ul>
                            </div>
                            <div class="col-md-4">
                                <strong>研究方向：</strong>
                                <ul>
                                    ${dept.research ? dept.research.map(research => `<li>${research}</li>`).join('') : '<li>資料待補充</li>'}
                                </ul>
                            </div>
                            <div class="col-md-4">
                                <strong>就業方向：</strong>
                                <ul>
                                    ${dept.career ? dept.career.map(career => `<li>${career}</li>`).join('') : '<li>資料待補充</li>'}
                                </ul>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p>科系資料待補充</p>'}
                
                <h5>學習風格</h5>
                <div class="mb-3">
                    ${school.learningStyle ? school.learningStyle.map(style => 
                        `<span class="badge badge-interest">${style}</span>`
                    ).join('') : '<span class="badge badge-secondary">資料待補充</span>'}
                </div>
                
                <h5>未來發展方向</h5>
                <div class="mb-3">
                    ${school.futureGoals ? school.futureGoals.map(goal => 
                        `<span class="badge badge-feature">${goal}</span>`
                    ).join('') : '<span class="badge badge-secondary">資料待補充</span>'}
                </div>
                
                <h5>產業連結</h5>
                <div class="mb-3">
                    ${school.industryConnections ? school.industryConnections.map(industry => 
                        `<span class="badge badge-feature">${industry}</span>`
                    ).join('') : '<span class="badge badge-secondary">資料待補充</span>'}
                </div>
                
                <h5>研究領域</h5>
                <div class="mb-3">
                    ${school.researchAreas ? school.researchAreas.map(area => 
                        `<span class="badge badge-feature">${area}</span>`
                    ).join('') : '<span class="badge badge-secondary">資料待補充</span>'}
                </div>
                
                <h5>特色課程</h5>
                <div class="mb-3">
                    ${school.courseHighlights ? school.courseHighlights.map(course => 
                        `<span class="badge badge-feature">${course}</span>`
                    ).join('') : '<span class="badge badge-secondary">資料待補充</span>'}
                </div>
                
                <div class="text-center mt-4">
                    <a href="${school.url}" target="_blank" class="btn btn-primary">前往官方網站</a>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('schoolDetailModal'));
        modal.show();
    } catch (error) {
        console.error('獲取學校詳細資料失敗:', error);
        alert('無法獲取學校詳細資料：' + error.message);
    }
}

// 更新比較圖表
function updateComparisonChart(recommendations) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const labels = recommendations.map(school => school.name);
    const scores = recommendations.map(school => Math.round((school.score / 15) * 100));
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '匹配度 (%)',
                data: scores,
                backgroundColor: colors.slice(0, recommendations.length),
                borderColor: colors.slice(0, recommendations.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `匹配度: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

// 更新就業方向分析圖表
function updateEmploymentChart(recommendations) {
    const ctx = document.getElementById('employmentChart');
    if (!ctx) return;

    if (employmentChart) {
        employmentChart.destroy();
    }

    // 統計就業方向
    const employmentStats = {};
    recommendations.forEach(school => {
        if (school.departments) {
            school.departments.forEach(dept => {
                if (dept.career) {
                    dept.career.forEach(career => {
                        employmentStats[career] = (employmentStats[career] || 0) + 1;
                    });
                }
            });
        }
    });

    const labels = Object.keys(employmentStats);
    const data = Object.values(employmentStats);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    employmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} 次 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 更新跨校研究領域趨勢圖表
function updateTrendChart(recommendations) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (trendChart) {
        trendChart.destroy();
    }

    // 統計研究領域
    const researchStats = {};
    recommendations.forEach(school => {
        if (school.researchAreas) {
            school.researchAreas.forEach(area => {
                researchStats[area] = (researchStats[area] || 0) + 1;
            });
        }
    });

    const labels = Object.keys(researchStats);
    const data = Object.values(researchStats);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    trendChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '研究領域強度',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.r} 所學校`;
                        }
                    }
                }
            }
        }
    });
}

// 顯示載入狀態
function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// 顯示錯誤訊息
function showError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
}

// 教育政策分析函數
function analyzeSchoolTypes(recommendations) {
    const types = {};
    recommendations.forEach(school => {
        types[school.type] = (types[school.type] || 0) + 1;
    });
    
    const national = types['國立'] || 0;
    const private = types['私立'] || 0;
    const total = recommendations.length;
    
    if (total === 0) return 'N/A';
    
    const nationalRatio = ((national / total) * 100).toFixed(0);
    const privateRatio = ((private / total) * 100).toFixed(0);
    
    return `${nationalRatio}%/${privateRatio}%`;
}

function analyzeRegionDistribution(recommendations) {
    const regions = {};
    recommendations.forEach(school => {
        regions[school.region] = (regions[school.region] || 0) + 1;
    });
    
    const uniqueRegions = Object.keys(regions).length;
    const total = recommendations.length;
    
    if (total === 0) return 'N/A';
    
    const diversity = ((uniqueRegions / 4) * 100).toFixed(0); // 4個主要地區
    return `${diversity}%`;
}

function analyzeResearchIntensity(recommendations) {
    let totalResearchAreas = 0;
    let schoolsWithResearch = 0;
    
    recommendations.forEach(school => {
        if (school.researchAreas && school.researchAreas.length > 0) {
            totalResearchAreas += school.researchAreas.length;
            schoolsWithResearch++;
        }
    });
    
    if (schoolsWithResearch === 0) return '0';
    
    const average = (totalResearchAreas / schoolsWithResearch).toFixed(1);
    return average;
}

function analyzeIndustryPartnerships(recommendations) {
    let totalPartnerships = 0;
    let schoolsWithPartnerships = 0;
    
    recommendations.forEach(school => {
        if (school.industryPartnerships && school.industryPartnerships.length > 0) {
            totalPartnerships += school.industryPartnerships.length;
            schoolsWithPartnerships++;
        }
    });
    
    if (schoolsWithPartnerships === 0) return '0';
    
    const average = (totalPartnerships / schoolsWithPartnerships).toFixed(1);
    return average;
}

// 顯示加載視窗
function showLoadingOverlay(show) {
    console.log(`showLoadingOverlay 被調用，參數: ${show}`);
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (show) {
            // 顯示加載視窗
            loadingOverlay.style.display = 'block';
            loadingOverlay.style.visibility = 'visible';
            loadingOverlay.style.opacity = '1';
            loadingOverlay.style.pointerEvents = 'auto';
            console.log('加載視窗已顯示');
        } else {
            // 隱藏加載視窗
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.visibility = 'hidden';
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.pointerEvents = 'none';
            console.log('加載視窗已隱藏');
        }
    } else {
        console.error('找不到 loadingOverlay 元素');
    }
}

// 頁面載入時強制隱藏加載視窗
document.addEventListener('DOMContentLoaded', function() {
    console.log('頁面載入，強制隱藏加載視窗');
    
    // 綁定表單提交事件
    document.getElementById('preferenceForm').addEventListener('submit', handleFormSubmit);
    
    // 初始化圖表容器
    initializeChartContainers();
    
    // 強制隱藏加載視窗
    showLoadingOverlay(false);
}); 