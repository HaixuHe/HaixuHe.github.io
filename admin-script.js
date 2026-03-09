let data = {};
let githubConfig = {
    token: localStorage.getItem('github_token') || '',
    repo: localStorage.getItem('github_repo') || 'HaixuHe.github.io',
    branch: localStorage.getItem('github_branch') || 'main',
    owner: ''
};

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadConfig();
    loadData();
    
    window.testConnection = testConnection;
    window.saveConfig = saveConfig;
    window.closeModal = closeModal;
    window.openModal = openModal;
    window.addEducation = addEducation;
    window.addResearch = addResearch;
    window.removeItem = removeItem;
    window.addPublication = addPublication;
    window.removePublication = removePublication;
    window.addPatent = addPatent;
    window.removePatent = removePatent;
    window.addProject = addProject;
    window.removeProject = removeProject;
    window.previewData = previewData;
    window.copyToClipboard = copyToClipboard;
    window.saveToGitHub = saveToGitHub;
    window.showToast = showToast;
    window.updateCitations = updateCitations;
});

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });

    document.getElementById('configBtn').addEventListener('click', function() {
        openModal('configModal');
    });

    document.getElementById('previewBtn').addEventListener('click', previewData);
    document.getElementById('saveBtn').addEventListener('click', saveToGitHub);
}

function loadConfig() {
    document.getElementById('githubToken').value = githubConfig.token;
    document.getElementById('githubRepo').value = githubConfig.repo;
    document.getElementById('githubBranch').value = githubConfig.branch;
}

function saveConfig() {
    githubConfig.token = document.getElementById('githubToken').value.trim();
    githubConfig.repo = document.getElementById('githubRepo').value.trim();
    githubConfig.branch = document.getElementById('githubBranch').value.trim();

    localStorage.setItem('github_token', githubConfig.token);
    localStorage.setItem('github_repo', githubConfig.repo);
    localStorage.setItem('github_branch', githubConfig.branch);

    closeModal('configModal');
    showToast('配置已保存', 'success');
}

async function testConnection() {
    console.log('testConnection 函数被调用');
    
    const token = document.getElementById('githubToken').value.trim();
    const repoInput = document.getElementById('githubRepo').value.trim();
    const branch = document.getElementById('githubBranch').value.trim();

    console.log('Token:', token ? '已输入' : '未输入');
    console.log('Repo:', repoInput);
    console.log('Branch:', branch);

    if (!token) {
        showToast('请输入GitHub Token', 'error');
        return;
    }

    if (!repoInput) {
        showToast('请输入仓库名称', 'error');
        return;
    }

    showToast('正在测试连接...', 'info');

    try {
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!userResponse.ok) {
            if (userResponse.status === 401) {
                throw new Error('Token无效或已过期');
            }
            throw new Error('无法获取用户信息');
        }

        const userData = await userResponse.json();
        const username = userData.login;

        let owner = '';
        let repo = '';

        if (repoInput.includes('/')) {
            const parts = repoInput.split('/');
            owner = parts[0];
            repo = parts[1];
        } else {
            owner = username;
            repo = repoInput;
        }

        const repoResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!repoResponse.ok) {
            if (repoResponse.status === 404) {
                throw new Error(`仓库 ${owner}/${repo} 不存在或无访问权限`);
            }
            throw new Error('无法访问仓库');
        }

        const repoData = await repoResponse.json();

        if (!repoData.permissions || !repoData.permissions.push) {
            throw new Error('Token没有写入权限，请确保勾选了repo权限');
        }

        showToast(`连接成功！用户: ${username}, 仓库: ${owner}/${repo}`, 'success');
        
    } catch (error) {
        showToast('连接失败: ' + error.message, 'error');
        console.error('测试连接失败:', error);
    }
}

async function loadData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        if (!response.ok) throw new Error('无法加载数据');
        data = await response.json();
        
        populateProfile();
        populateStats();
        populatePublications();
        populatePatents();
        populateProjects();
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('加载数据失败: ' + error.message, 'error');
    }
}

function populateProfile() {
    const profile = data.profile || {};
    
    document.getElementById('name').value = profile.name || '';
    document.getElementById('nameEn').value = profile.nameEn || '';
    document.getElementById('title').value = profile.title || '';
    document.getElementById('description').value = profile.description || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('address').value = profile.address || '';
    document.getElementById('university').value = profile.university || '';
    document.getElementById('department').value = profile.department || '';
    document.getElementById('lab').value = profile.lab || '';

    const educationList = document.getElementById('educationList');
    educationList.innerHTML = '';
    (profile.education || []).forEach((edu, index) => {
        addEducation(edu, index);
    });

    const researchList = document.getElementById('researchList');
    researchList.innerHTML = '';
    (profile.researchInterests || []).forEach((interest, index) => {
        addResearch(interest, index);
    });

    const social = profile.socialLinks || {};
    document.getElementById('googleScholar').value = social.googleScholar || '';
    document.getElementById('researchGate').value = social.researchGate || '';
    document.getElementById('github').value = social.github || '';
    document.getElementById('linkedin').value = social.linkedin || '';
    document.getElementById('orcid').value = social.orcid || '';
}

function addEducation(edu = {}, index = null) {
    const educationList = document.getElementById('educationList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <div class="dynamic-item-content">
            <input type="text" placeholder="学位 - 专业 - 学校 - 年份" 
                   value="${edu.degree || ''} - ${edu.major || ''} - ${edu.school || ''} - ${edu.year || ''}"
                   data-field="education" data-index="${index !== null ? index : educationList.children.length}">
        </div>
        <button class="btn btn-delete" onclick="removeItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    educationList.appendChild(div);
}

function addResearch(interest = '', index = null) {
    const researchList = document.getElementById('researchList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <div class="dynamic-item-content">
            <input type="text" placeholder="研究方向" value="${interest}"
                   data-field="research" data-index="${index !== null ? index : researchList.children.length}">
        </div>
        <button class="btn btn-delete" onclick="removeItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    researchList.appendChild(div);
}

function removeItem(button) {
    button.parentElement.remove();
}

function populateStats() {
    const stats = data.stats || {};
    const autoStats = calculateAutoStats();
    
    document.getElementById('pubCountDisplay').value = autoStats.publications;
    document.getElementById('patentCountDisplay').value = autoStats.patents;
    document.getElementById('projectCountDisplay').value = autoStats.projects;
    document.getElementById('citationCount').value = stats.citations || 0;
}

function calculateAutoStats() {
    const publications = (data.publications || []).length;
    const patents = (data.patents || []).filter(p => p.status === 'granted').length;
    const projects = (data.projects || []).length;
    
    return {
        publications,
        patents,
        projects
    };
}

function populatePublications() {
    const list = document.getElementById('publicationsList');
    list.innerHTML = '';
    
    (data.publications || []).forEach((pub, index) => {
        const card = createPublicationCard(pub, index);
        list.appendChild(card);
    });
}

function createPublicationCard(pub, index) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="item-header">
            <div class="item-title">${pub.title || '新论文'}</div>
            <div class="item-actions">
                <button class="btn btn-delete" onclick="removePublication(${index})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
        <div class="item-body">
            <div class="item-form-row">
                <div class="item-form-group">
                    <label>年份</label>
                    <input type="number" value="${pub.year || ''}" data-field="year">
                </div>
                <div class="item-form-group">
                    <label>类型</label>
                    <select data-field="type">
                        <option value="journal" ${pub.type === 'journal' ? 'selected' : ''}>期刊论文</option>
                        <option value="conference" ${pub.type === 'conference' ? 'selected' : ''}>会议论文</option>
                    </select>
                </div>
            </div>
            <div class="item-form-group">
                <label>标题</label>
                <input type="text" value="${pub.title || ''}" data-field="title">
            </div>
            <div class="item-form-group">
                <label>作者（用逗号分隔）</label>
                <input type="text" value="${(pub.authors || []).join(', ')}" data-field="authors">
            </div>
            <div class="item-form-group">
                <label>期刊/会议</label>
                <input type="text" value="${pub.journal || ''}" data-field="journal">
            </div>
            <div class="item-form-row">
                <div class="item-form-group">
                    <label>DOI链接</label>
                    <input type="url" value="${pub.doi || ''}" data-field="doi">
                </div>
                <div class="item-form-group">
                    <label>PDF链接</label>
                    <input type="url" value="${pub.pdf || ''}" data-field="pdf">
                </div>
            </div>
            <div class="item-form-group">
                <label>代码链接</label>
                <input type="url" value="${pub.code || ''}" data-field="code">
            </div>
            <div class="item-form-group">
                <label>摘要</label>
                <textarea data-field="abstract" rows="4" placeholder="请输入论文摘要...">${pub.abstract || ''}</textarea>
            </div>
            <div class="item-form-group">
                <label>引用量</label>
                <input type="text" value="${pub.citations || 0}" disabled style="background: #f3f4f6; cursor: not-allowed;">
                <small style="color: #6b7280; font-size: 0.85rem; margin-top: 4px; display: block;">自动从OpenAlex获取，每天更新</small>
            </div>
            <div class="item-form-group">
                <label>
                    <input type="checkbox" ${pub.highlight ? 'checked' : ''} data-field="highlight">
                    标记为重要论文
                </label>
            </div>
        </div>
    `;
    
    return card;
}

function addPublication() {
    const newPub = {
        id: 'pub' + String(Date.now()).slice(-6),
        year: new Date().getFullYear(),
        type: 'journal',
        title: '',
        authors: [],
        journal: '',
        doi: '',
        pdf: '',
        code: '',
        highlight: false
    };
    
    if (!data.publications) data.publications = [];
    data.publications.unshift(newPub);
    populatePublications();
    showToast('已添加新论文条目', 'success');
}

function removePublication(index) {
    if (confirm('确定要删除这篇论文吗？')) {
        data.publications.splice(index, 1);
        populatePublications();
        showToast('论文已删除', 'success');
    }
}

function populatePatents() {
    const list = document.getElementById('patentsList');
    list.innerHTML = '';
    
    (data.patents || []).forEach((patent, index) => {
        const card = createPatentCard(patent, index);
        list.appendChild(card);
    });
}

function createPatentCard(patent, index) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="item-header">
            <div class="item-title">${patent.title || '新专利'}</div>
            <div class="item-actions">
                <button class="btn btn-delete" onclick="removePatent(${index})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
        <div class="item-body">
            <div class="item-form-row">
                <div class="item-form-group">
                    <label>年份</label>
                    <input type="number" value="${patent.year || ''}" data-field="year">
                </div>
                <div class="item-form-group">
                    <label>状态</label>
                    <select data-field="status">
                        <option value="granted" ${patent.status === 'granted' ? 'selected' : ''}>已授权</option>
                        <option value="pending" ${patent.status === 'pending' ? 'selected' : ''}>审查中</option>
                    </select>
                </div>
            </div>
            <div class="item-form-group">
                <label>专利名称</label>
                <input type="text" value="${patent.title || ''}" data-field="title">
            </div>
            <div class="item-form-group">
                <label>专利号</label>
                <input type="text" value="${patent.patentNumber || ''}" data-field="patentNumber">
            </div>
            <div class="item-form-group">
                <label>发明人（用逗号分隔）</label>
                <input type="text" value="${(patent.inventors || []).join(', ')}" data-field="inventors">
            </div>
        </div>
    `;
    
    return card;
}

function addPatent() {
    const newPatent = {
        id: 'pat' + String(Date.now()).slice(-6),
        title: '',
        patentNumber: '',
        status: 'pending',
        statusText: '审查中',
        inventors: [],
        year: new Date().getFullYear()
    };
    
    if (!data.patents) data.patents = [];
    data.patents.unshift(newPatent);
    populatePatents();
    showToast('已添加新专利条目', 'success');
}

function removePatent(index) {
    if (confirm('确定要删除这个专利吗？')) {
        data.patents.splice(index, 1);
        populatePatents();
        showToast('专利已删除', 'success');
    }
}

function populateProjects() {
    const list = document.getElementById('projectsList');
    list.innerHTML = '';
    
    (data.projects || []).forEach((project, index) => {
        const card = createProjectCard(project, index);
        list.appendChild(card);
    });
}

function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="item-header">
            <div class="item-title">${project.title || '新项目'}</div>
            <div class="item-actions">
                <button class="btn btn-delete" onclick="removeProject(${index})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
        <div class="item-body">
            <div class="item-form-row">
                <div class="item-form-group">
                    <label>时间</label>
                    <input type="text" value="${project.time || ''}" data-field="time" placeholder="如: 2022 - 至今">
                </div>
                <div class="item-form-group">
                    <label>角色</label>
                    <input type="text" value="${project.role || ''}" data-field="role">
                </div>
            </div>
            <div class="item-form-group">
                <label>项目名称</label>
                <input type="text" value="${project.title || ''}" data-field="title">
            </div>
            <div class="item-form-group">
                <label>项目副标题</label>
                <input type="text" value="${project.subtitle || ''}" data-field="subtitle">
            </div>
            <div class="item-form-group">
                <label>项目描述</label>
                <textarea data-field="description">${project.description || ''}</textarea>
            </div>
            <div class="item-form-group">
                <label>标签（用逗号分隔）</label>
                <input type="text" value="${(project.tags || []).join(', ')}" data-field="tags">
            </div>
        </div>
    `;
    
    return card;
}

function addProject() {
    const newProject = {
        id: 'proj' + String(Date.now()).slice(-6),
        title: '',
        subtitle: '',
        time: '',
        role: '',
        description: '',
        tags: []
    };
    
    if (!data.projects) data.projects = [];
    data.projects.unshift(newProject);
    populateProjects();
    showToast('已添加新项目条目', 'success');
}

function removeProject(index) {
    if (confirm('确定要删除这个项目吗？')) {
        data.projects.splice(index, 1);
        populateProjects();
        showToast('项目已删除', 'success');
    }
}

function collectData() {
    data.profile = {
        name: document.getElementById('name').value,
        nameEn: document.getElementById('nameEn').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        university: document.getElementById('university').value,
        department: document.getElementById('department').value,
        lab: document.getElementById('lab').value,
        education: [],
        researchInterests: [],
        socialLinks: {
            googleScholar: document.getElementById('googleScholar').value,
            researchGate: document.getElementById('researchGate').value,
            github: document.getElementById('github').value,
            linkedin: document.getElementById('linkedin').value,
            orcid: document.getElementById('orcid').value
        }
    };

    document.querySelectorAll('#educationList input').forEach(input => {
        const parts = input.value.split(' - ');
        if (parts.length >= 4) {
            data.profile.education.push({
                degree: parts[0].trim(),
                major: parts[1].trim(),
                school: parts[2].trim(),
                year: parts[3].trim()
            });
        }
    });

    document.querySelectorAll('#researchList input').forEach(input => {
        if (input.value.trim()) {
            data.profile.researchInterests.push(input.value.trim());
        }
    });

    data.stats = {
        citations: parseInt(document.getElementById('citationCount').value) || 0
    };

    document.querySelectorAll('#publicationsList .item-card').forEach(card => {
        const index = parseInt(card.dataset.index);
        if (data.publications[index]) {
            const inputs = card.querySelectorAll('[data-field]');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'authors') {
                    data.publications[index][field] = input.value.split(',').map(a => a.trim()).filter(a => a);
                } else if (field === 'highlight') {
                    data.publications[index][field] = input.checked;
                } else {
                    data.publications[index][field] = input.value;
                }
            });
        }
    });

    document.querySelectorAll('#patentsList .item-card').forEach(card => {
        const index = parseInt(card.dataset.index);
        if (data.patents[index]) {
            const inputs = card.querySelectorAll('[data-field]');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'inventors') {
                    data.patents[index][field] = input.value.split(',').map(a => a.trim()).filter(a => a);
                } else if (field === 'status') {
                    data.patents[index][field] = input.value;
                    data.patents[index].statusText = input.value === 'granted' ? '已授权' : '审查中';
                } else {
                    data.patents[index][field] = input.value;
                }
            });
        }
    });

    document.querySelectorAll('#projectsList .item-card').forEach(card => {
        const index = parseInt(card.dataset.index);
        if (data.projects[index]) {
            const inputs = card.querySelectorAll('[data-field]');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'tags') {
                    data.projects[index][field] = input.value.split(',').map(a => a.trim()).filter(a => a);
                } else {
                    data.projects[index][field] = input.value;
                }
            });
        }
    });

    return data;
}

function previewData() {
    const currentData = collectData();
    const previewContent = document.getElementById('previewContent');
    previewContent.textContent = JSON.stringify(currentData, null, 2);
    openModal('previewModal');
}

function copyToClipboard() {
    const previewContent = document.getElementById('previewContent').textContent;
    navigator.clipboard.writeText(previewContent).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(err => {
        showToast('复制失败: ' + err.message, 'error');
    });
}

async function saveToGitHub() {
    if (!githubConfig.token) {
        showToast('请先配置GitHub Token', 'error');
        openModal('configModal');
        return;
    }

    const currentData = collectData();
    const content = JSON.stringify(currentData, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    showLoading(true);

    try {
        let owner = '';
        let repo = '';
        
        const repoInput = githubConfig.repo.trim();
        
        if (repoInput.includes('/')) {
            const parts = repoInput.split('/');
            owner = parts[0];
            repo = parts[1];
        } else {
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('无法获取用户信息，请检查Token是否有效');
            }
            
            const userData = await userResponse.json();
            owner = userData.login;
            repo = repoInput || 'HaixuHe.github.io';
            
            localStorage.setItem('github_owner', owner);
        }

        console.log(`正在保存到仓库: ${owner}/${repo}`);

        let sha = null;
        try {
            const getResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/data.json?ref=${githubConfig.branch}`,
                {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (getResponse.status === 404) {
                console.log('文件不存在，将创建新文件');
            } else if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
                console.log('找到现有文件，SHA:', sha);
            } else {
                const errorData = await getResponse.json();
                console.error('获取文件失败:', errorData);
            }
        } catch (e) {
            console.log('获取文件时出错:', e.message);
        }

        const body = {
            message: `更新数据 - ${new Date().toLocaleString('zh-CN')}`,
            content: encodedContent,
            branch: githubConfig.branch
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/data.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('保存失败详情:', error);
            
            if (response.status === 404) {
                throw new Error('仓库不存在或无访问权限。请确认仓库名称正确，且Token有repo权限');
            } else if (response.status === 403) {
                throw new Error('权限不足。请确认Token有repo权限');
            } else {
                throw new Error(error.message || '保存失败');
            }
        }

        const result = await response.json();
        console.log('保存成功:', result);

        showLoading(false);
        showToast('数据已成功保存到GitHub！', 'success');
        
        setTimeout(() => {
            if (confirm('数据已保存！是否刷新主页查看效果？')) {
                window.open('index.html', '_blank');
            }
        }, 1000);
        
    } catch (error) {
        showLoading(false);
        showToast('保存失败: ' + error.message, 'error');
        console.error('保存错误:', error);
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

async function updateCitations() {
    if (!githubConfig.token) {
        showToast('请先配置GitHub Token', 'error');
        openModal('configModal');
        return;
    }

    if (!confirm('确定要更新所有论文的引用量吗？\n\n这将触发GitHub Actions自动更新引用数据，可能需要几分钟时间完成。')) {
        return;
    }

    showToast('正在触发引用量更新...', 'info');

    try {
        let owner = '';
        let repo = '';
        
        const repoInput = githubConfig.repo.trim();
        
        if (repoInput.includes('/')) {
            const parts = repoInput.split('/');
            owner = parts[0];
            repo = parts[1];
        } else {
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('无法获取用户信息');
            }
            
            const userData = await userResponse.json();
            owner = userData.login;
            repo = repoInput || 'HaixuHe.github.io';
        }

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/update_citations.yml/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: githubConfig.branch || 'main'
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 404) {
                throw new Error('未找到workflow文件，请确认.github/workflows/update_citations.yml已提交到仓库');
            } else if (response.status === 403) {
                throw new Error('权限不足，请确认Token有workflow权限');
            }
            throw new Error(error.message || '触发更新失败');
        }

        showToast('引用量更新已触发！请稍后在GitHub Actions页面查看进度', 'success');
        
    } catch (error) {
        showToast('触发失败: ' + error.message, 'error');
        console.error('触发更新失败:', error);
    }
}