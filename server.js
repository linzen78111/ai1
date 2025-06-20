const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 提供當前目錄的靜態文件

// 讀取學校資料庫
let schoolsDatabase = [];
try {
    const data = fs.readFileSync(path.join(__dirname, 'schools_database.json'), 'utf8');
    schoolsDatabase = JSON.parse(data);
    console.log(`成功載入 ${schoolsDatabase.length} 所學校資料`);
} catch (error) {
    console.error('讀取學校資料庫失敗:', error);
    // 如果讀取失敗，使用預設資料
    schoolsDatabase = [
        {
            name: "國立台灣大學",
            type: "國立",
            region: "北部",
            location: "台北市",
            minScore: 450,
            departments: [
                {
                    name: "資訊工程學系",
                    courses: ["程式設計", "資料結構", "演算法"],
                    research: ["人工智慧", "大數據分析", "網路安全"],
                    career: ["軟體工程師", "資料科學家", "系統架構師"]
                }
            ],
            features: "台灣最頂尖的綜合型大學",
            learningStyle: ["研究導向", "自主學習", "團隊合作"],
            futureGoals: ["學術研究", "國際發展", "創新創業"],
            industryConnections: ["科技業", "金融業", "研究機構"],
            researchAreas: ["人工智慧", "生醫科技", "永續發展"],
            courseHighlights: ["創新創業學程", "國際交換計畫", "跨領域研究"],
            url: "https://www.ntu.edu.tw"
        }
    ];
}

// 成績範圍對應的最低分數
const scoreRanges = {
    "450-500": { min: 450, max: 500, level: "頂尖大學" },
    "400-449": { min: 400, max: 449, level: "國立大學" },
    "350-399": { min: 350, max: 399, level: "國立大學/頂尖私立" },
    "300-349": { min: 300, max: 349, level: "私立大學" },
    "250-299": { min: 250, max: 299, level: "私立大學/科技大學" },
    "200-249": { min: 200, max: 249, level: "科技大學/技術學院" },
    "150-199": { min: 150, max: 199, level: "技術學院" },
    "100-149": { min: 100, max: 149, level: "專科學校" }
};

// AI語義相似度計算函數
function calculateSemanticSimilarity(interest, target) {
    try {
        // 正規化文字 - 統一轉為小寫並移除空格
        const normalizedInterest = interest.toLowerCase().replace(/\s+/g, '');
        const normalizedTarget = target.toLowerCase().replace(/\s+/g, '');
        
        // 1. 完全匹配
        if (normalizedInterest === normalizedTarget) {
            return 1.0;
        }
        
        // 2. 包含匹配
        if (normalizedTarget.includes(normalizedInterest) || normalizedInterest.includes(normalizedTarget)) {
            const similarity = Math.min(normalizedInterest.length, normalizedTarget.length) / 
                              Math.max(normalizedInterest.length, normalizedTarget.length);
            return 0.7 + similarity * 0.3; // 0.7-1.0 範圍
        }
        
        // 3. 智能關鍵字語義映射
        const semanticMap = {
            // 財務金融類
            '財務': ['財務', '金融', '理財', '投資', '會計', '審計', '經濟', '銀行', '保險', '證券', '基金', '資產', '資本'],
            '金融': ['金融', '財務', '銀行', '投資', '證券', '保險', '基金', '資本市場', '金融市場', '貨幣', '信貸'],
            '會計': ['會計', '審計', '財務', '成本', '稅務', '帳務', '記帳', '查帳', '財報'],
            '投資': ['投資', '理財', '基金', '證券', '股票', '債券', '資產配置', '財富管理', '投資組合'],
            
            // 管理類
            '管理': ['管理', '經營', '策略', '領導', '營運', '行政', '組織', '企劃', '規劃'],
            '企業': ['企業', '公司', '商業', '營運', '經營', '管理', '組織', '商務'],
            '行銷': ['行銷', '市場', '銷售', '推廣', '廣告', '品牌', '公關', '客戶', '消費者'],
            
            // 科技類
            '資訊': ['資訊', '電腦', '程式', '軟體', '系統', '網路', '數據', '科技', 'IT'],
            '程式': ['程式', '軟體', '開發', '編程', '程式設計', '系統', '應用程式'],
            '人工智慧': ['人工智慧', 'AI', '機器學習', '深度學習', '神經網路', '演算法', '自動化', '智能'],
            '資料': ['資料', '數據', '統計', '分析', '大數據', '資料庫', '資訊'],
            
            // 工程類
            '工程': ['工程', '技術', '設計', '建設', '開發', '製造', '建造'],
            '電機': ['電機', '電子', '電力', '通訊', '自動化', '控制', '電路'],
            '機械': ['機械', '製造', '生產', '機電', '自動化', '精密', '工業'],
            '土木': ['土木', '建築', '結構', '營建', '工程', '建設', '基礎設施'],
            
            // 設計類
            '設計': ['設計', '創意', '美術', '藝術', '視覺', '平面', '產品', '工業設計'],
            '建築': ['建築', '設計', '空間', '結構', '都市', '景觀', '室內'],
            
            // 醫療類
            '醫學': ['醫學', '醫療', '臨床', '健康', '生醫', '醫院', '診斷', '治療'],
            '護理': ['護理', '照護', '醫療', '健康', '臨床', '護士'],
            
            // 教育類
            '教育': ['教育', '教學', '學習', '師資', '課程', '培訓', '指導'],
            
            // 傳播類
            '傳播': ['傳播', '媒體', '新聞', '廣播', '電視', '網路媒體', '數位媒體'],
            '新聞': ['新聞', '記者', '媒體', '報導', '採訪', '編輯']
        };
        
        // 計算語義相似度
        let maxSimilarity = 0;
        
        // 檢查興趣是否在語義映射中
        for (const [key, synonyms] of Object.entries(semanticMap)) {
            if (normalizedInterest.includes(key) || key.includes(normalizedInterest)) {
                for (const synonym of synonyms) {
                    if (normalizedTarget.includes(synonym)) {
                        const similarity = calculateJaccardSimilarity(normalizedInterest, normalizedTarget);
                        maxSimilarity = Math.max(maxSimilarity, 0.6 + similarity * 0.4);
                    }
                }
            }
        }
        
        // 檢查目標是否在語義映射中
        for (const [key, synonyms] of Object.entries(semanticMap)) {
            if (normalizedTarget.includes(key) || key.includes(normalizedTarget)) {
                for (const synonym of synonyms) {
                    if (normalizedInterest.includes(synonym)) {
                        const similarity = calculateJaccardSimilarity(normalizedInterest, normalizedTarget);
                        maxSimilarity = Math.max(maxSimilarity, 0.6 + similarity * 0.4);
                    }
                }
            }
        }
        
        // 4. 字符相似度計算（Jaccard相似度）
        if (maxSimilarity === 0) {
            maxSimilarity = calculateJaccardSimilarity(normalizedInterest, normalizedTarget);
        }
        
        return maxSimilarity;
        
    } catch (error) {
        console.error('語義相似度計算錯誤:', error);
        return 0;
    }
}

// Jaccard相似度計算輔助函數
function calculateJaccardSimilarity(str1, str2) {
    // 將字串轉換為字符集合
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    // 計算交集
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // 計算聯集
    const union = new Set([...set1, ...set2]);
    
    // 返回 Jaccard 相似度
    return intersection.size / union.size;
}

// 計算匹配分數的輔助函數
function calculateMatchScore(school, preferences) {
    try {
        let score = 0;
        const { score: userScore, interest, learningStyle, futureGoal, region } = preferences;

        // 成績匹配 (最高5分)
        if (userScore && school.minScore) {
            const scoreRange = scoreRanges[userScore];
            if (scoreRange) {
                if (school.minScore <= scoreRange.max && school.minScore >= scoreRange.min) {
                    score += 5; // 完全符合
                } else if (school.minScore <= scoreRange.max + 50) {
                    score += 3; // 接近符合
                } else if (school.minScore <= scoreRange.max + 100) {
                    score += 1; // 勉強符合
                }
            }
        }

        // AI驅動的興趣匹配 - 使用語義相似度分析
        const interestMatch = school.departments.some(dept => {
            // 計算課程匹配分數
            const courseMatch = dept.courses.some(course => {
                return calculateSemanticSimilarity(interest, course) > 0.6; // 60%以上相似度才算匹配
            });
            
            // 計算研究領域匹配分數
            const researchMatch = dept.research.some(research => {
                return calculateSemanticSimilarity(interest, research) > 0.6;
            });
            
            // 計算職業匹配分數
            const careerMatch = dept.career.some(career => {
                return calculateSemanticSimilarity(interest, career) > 0.6;
            });
            
            return courseMatch || researchMatch || careerMatch;
        });
        if (interestMatch) score += 3;
        
        // 學習風格匹配分數（最高2分）
        const learningStyleMatch = school.departments.some(dept => 
            dept.courses.some(course => 
                (learningStyle === '實作導向' && (course.includes('實習') || course.includes('實務') || course.includes('技術'))) ||
                (learningStyle === '研究導向' && (course.includes('研究') || course.includes('理論') || course.includes('分析'))) ||
                (learningStyle === '自主學習' && (course.includes('專題') || course.includes('專案') || course.includes('獨立')))
            )
        );
        if (learningStyleMatch) score += 2;
        
        // 未來目標匹配分數（最高2分）
        const futureGoalMatch = school.departments.some(dept => 
            dept.career.some(career => 
                (futureGoal === '科技研發' && (career.includes('研發') || career.includes('工程師') || career.includes('技術'))) ||
                (futureGoal === '學術研究' && (career.includes('研究') || career.includes('教授') || career.includes('學者'))) ||
                (futureGoal === '企業服務' && (career.includes('管理') || career.includes('顧問') || career.includes('服務'))) ||
                (futureGoal === '產業創新' && (career.includes('創新') || career.includes('創業') || career.includes('產業')))
            )
        );
        if (futureGoalMatch) score += 2;
        
        return score;
    } catch (error) {
        console.error('計算匹配分數錯誤:', error);
        return 0;
    }
}

// 生成成績分析的輔助函數
function generateScoreAnalysis(userScore, recommendedSchools) {
    if (!recommendedSchools || recommendedSchools.length === 0) {
        return '目前沒有符合條件的學校推薦。建議調整您的條件或考慮相近的興趣領域。';
    }
    
    const scoreRange = scoreRanges[userScore];
    if (!scoreRange) {
        return '請提供有效的成績範圍。';
    }
    
    // 計算推薦學校中符合錄取標準的數量
    const eligibleSchools = recommendedSchools.filter(school => 
        school.minScore && school.minScore <= scoreRange.max
    );
    
    const recommendedCount = recommendedSchools.length;
    const eligibleCount = eligibleSchools.length;
    
    if (eligibleCount === recommendedCount) {
        return `根據您的成績範圍 ${userScore}，推薦的 ${recommendedCount} 所學校都符合錄取標準。建議優先考慮匹配度最高的前幾所。`;
    } else if (eligibleCount > 0) {
        return `根據您的成績範圍 ${userScore}，推薦的 ${recommendedCount} 所學校中有 ${eligibleCount} 所符合錄取標準。建議重點考慮符合錄取標準且匹配度較高的學校。`;
    } else {
        return `根據您的成績範圍 ${userScore}，推薦的 ${recommendedCount} 所學校可能錄取門檻較高。建議考慮提升成績或選擇相近的興趣領域。`;
    }
}

// 學校推薦API
app.post('/api/recommend', (req, res) => {
    try {
        const { score, interest, learningStyle, futureGoal, region } = req.body;
        
        // 驗證必要參數
        if (!score || !interest || !learningStyle || !futureGoal) {
            return res.status(400).json({
                success: false,
                message: '請提供所有必要的參數'
            });
        }
        
        // 根據地區篩選學校
        let regionSchools = schoolsDatabase;
        if (region && region !== '不限') {
            regionSchools = schoolsDatabase.filter(school => school.region === region);
        }
        
        // 取得成績範圍
        const scoreRange = scoreRanges[score];
        if (!scoreRange) {
            return res.status(400).json({
                success: false,
                message: '無效的成績範圍'
            });
        }
        
        // 計算每所學校的匹配分數
        const scoredSchools = regionSchools.map(school => {
            const matchScore = calculateMatchScore(school, {
                score: scoreRange,
                interest,
                learningStyle,
                futureGoal,
                region
            });
            
            return {
                ...school,
                score: matchScore,
                scoreMatch: school.minScore && school.minScore >= scoreRange.min && school.minScore <= scoreRange.max
            };
        });
        
        // 排序並取前5所最匹配的學校
        const sortedSchools = scoredSchools
            .filter(school => school.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.scoreMatch && !b.scoreMatch) return -1;
                if (!a.scoreMatch && b.scoreMatch) return 1;
                return (a.minScore || 0) - (b.minScore || 0);
            })
            .slice(0, 5); // 只取前5名最匹配的學校
        
        // 生成成績分析
        const scoreAnalysis = generateScoreAnalysis(score, sortedSchools);
        
        res.json({
            success: true,
            recommendations: sortedSchools,
            totalSchools: schoolsDatabase.length,
            eligibleSchools: regionSchools.length,
            scoreAnalysis
        });
    } catch (error) {
        console.error('推薦系統錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統發生錯誤，請稍後再試'
        });
    }
});

// 獲取所有學校資料的API
app.get('/api/schools', (req, res) => {
    try {
        res.json({
            success: true,
            schools: schoolsDatabase,
            total: schoolsDatabase.length
        });
    } catch (error) {
        console.error('獲取學校資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取學校資料失敗'
        });
    }
});

// 獲取學校詳細資料的API
app.get('/api/schools/:schoolName', (req, res) => {
    try {
        const schoolName = req.params.schoolName;
        const school = schoolsDatabase.find(s => s.name === schoolName);
        
        if (!school) {
            return res.status(404).json({
                success: false,
                message: '找不到該學校'
            });
        }

        res.json({
            success: true,
            school: school
        });
    } catch (error) {
        console.error('獲取學校詳細資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取學校詳細資料失敗'
        });
    }
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        schoolsLoaded: schoolsDatabase.length
    });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`選校AI系統伺服器運行在 http://localhost:${port}`);
    console.log(`已載入 ${schoolsDatabase.length} 所學校資料`);
    console.log('API端點:');
    console.log('  POST /api/recommend - 獲取學校推薦');
    console.log('  GET  /api/schools - 獲取所有學校資料');
    console.log('  GET  /api/schools/:name - 獲取特定學校資料');
    console.log('  GET  /api/health - 健康檢查');
}); 