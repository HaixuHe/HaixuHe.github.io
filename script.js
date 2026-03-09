let siteData = {};

document.addEventListener('DOMContentLoaded', async function() {
    await loadSiteData();
    initializeNavigation();
    initializeScrollEffects();
    initializeAnimations();
    initializeInteractions();
    
    window.toggleAbstract = toggleAbstract;
});

async function loadSiteData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        if (!response.ok) throw new Error('无法加载数据');
        siteData = await response.json();
        populatePage();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function populatePage() {
    const profile = siteData.profile || {};

    document.getElementById('navName').textContent = profile.nameEn || 'Haixu He';
    document.getElementById('heroName').textContent = profile.name || '贺海旭';
    document.getElementById('heroTitle').textContent = profile.title || '';
    document.getElementById('heroDescription').textContent = profile.description || '';

    if (profile.socialLinks) {
        updateLink('linkGoogleScholar', profile.socialLinks.googleScholar);
        updateLink('linkResearchGate', profile.socialLinks.researchGate);
        updateLink('linkGithub', profile.socialLinks.github);
        updateLink('linkLinkedin', profile.socialLinks.linkedin);
    }

    const aboutIntro = `你好！我是${profile.name || '贺海旭'}，${profile.description || ''}`;
    document.getElementById('aboutIntro').textContent = aboutIntro;

    if (profile.education && profile.education.length > 0) {
        const eduHtml = profile.education.map(e => 
            `${e.degree} - ${e.major}<br>`
        ).join('');
        document.getElementById('educationInfo').innerHTML = eduHtml;
    }

    if (profile.researchInterests && profile.researchInterests.length > 0) {
        document.getElementById('researchInfo').innerHTML = 
            profile.researchInterests.join('<br>');
    }

    const institution = [];
    if (profile.university) institution.push(profile.university);
    if (profile.department) institution.push(profile.department);
    if (profile.lab) institution.push(profile.lab);
    if (institution.length > 0) {
        document.getElementById('institutionInfo').innerHTML = institution.join('<br>');
    }

    const autoStats = calculateStats();
    document.getElementById('statPubs').setAttribute('data-target', autoStats.publications);
    document.getElementById('statPatents').setAttribute('data-target', autoStats.patents);
    document.getElementById('statProjects').setAttribute('data-target', autoStats.projects);
    document.getElementById('statCitations').setAttribute('data-target', siteData.stats?.citations || 0);

    renderPublications();
    renderPatents();
    renderProjects();
    updateContactInfo(profile);
    updateFooter(profile);
    
    toggleSection('patents', (siteData.patents || []).length > 0);
    toggleSection('projects', (siteData.projects || []).length > 0);
    toggleNavLink('patents', (siteData.patents || []).length > 0);
    toggleNavLink('projects', (siteData.projects || []).length > 0);
}

function toggleSection(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = show ? 'block' : 'none';
    }
}

function toggleNavLink(sectionId, show) {
    const navLink = document.getElementById(`nav${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`);
    if (navLink) {
        navLink.parentElement.style.display = show ? 'block' : 'none';
    }
}

function calculateStats() {
    const publications = (siteData.publications || []).length;
    const patents = (siteData.patents || []).filter(p => p.status === 'granted').length;
    const projects = (siteData.projects || []).length;
    
    return {
        publications,
        patents,
        projects
    };
}

function updateLink(elementId, url) {
    const element = document.getElementById(elementId);
    if (element && url) {
        element.href = url;
    }
}

function renderPublications() {
    const container = document.getElementById('publicationsList');
    if (!container || !siteData.publications) return;

    const sortedPubs = [...siteData.publications].sort((a, b) => b.year - a.year);

    container.innerHTML = sortedPubs.map((pub, index) => `
        <div class="publication-item" data-type="${pub.type}">
            <div class="pub-year">${pub.year}</div>
            <div class="pub-content">
                <h3 class="pub-title">${pub.title}</h3>
                <p class="pub-authors"><strong>${formatAuthors(pub.authors)}</strong></p>
                <p class="pub-journal">
                    <i class="fas ${pub.type === 'journal' ? 'fa-book' : 'fa-calendar-alt'}"></i> ${pub.journal}
                    ${pub.citations !== undefined ? `<span class="pub-citations"><i class="fas fa-quote-right"></i> ${pub.citations} 次引用</span>` : ''}
                </p>
                ${pub.abstract ? `
                <div class="pub-abstract-section">
                    <button class="pub-abstract-toggle" onclick="toggleAbstract(${index})">
                        <i class="fas fa-chevron-down"></i> 查看摘要
                    </button>
                    <div class="pub-abstract" id="abstract-${index}" style="display: none;">
                        <p>${pub.abstract}</p>
                    </div>
                </div>
                ` : ''}
                <div class="pub-links">
                    ${pub.doi ? `<a href="${pub.doi}" class="pub-link" target="_blank"><i class="fas fa-external-link-alt"></i> DOI</a>` : ''}
                    ${pub.pdf ? `<a href="${pub.pdf}" class="pub-link" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>` : ''}
                    ${pub.code ? `<a href="${pub.code}" class="pub-link" target="_blank"><i class="fas fa-code"></i> Code</a>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    initializePublicationFilter();
}

function toggleAbstract(index) {
    const abstractDiv = document.getElementById(`abstract-${index}`);
    const section = abstractDiv.parentElement;
    const button = section.querySelector('.pub-abstract-toggle');
    const icon = button.querySelector('i');
    
    if (abstractDiv.style.display === 'none') {
        abstractDiv.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        button.innerHTML = '<i class="fas fa-chevron-up"></i> 收起摘要';
    } else {
        abstractDiv.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        button.innerHTML = '<i class="fas fa-chevron-down"></i> 查看摘要';
    }
}

function formatAuthors(authors) {
    if (!authors || authors.length === 0) return '';
    return authors.map(author => {
        if (author.includes('He, H.') || author.includes('何海旭')) {
            return `<strong>${author}</strong>`;
        }
        return author;
    }).join(', ');
}

function renderPatents() {
    const container = document.getElementById('patentsList');
    if (!container || !siteData.patents) return;

    container.innerHTML = siteData.patents.map(patent => `
        <div class="patent-card">
            <div class="patent-icon">
                <i class="fas fa-certificate"></i>
            </div>
            <div class="patent-content">
                <h3>${patent.title}</h3>
                <p class="patent-number">专利号: ${patent.patentNumber}</p>
                <p class="patent-status">
                    <span class="status-badge ${patent.status}">${patent.statusText}</span>
                </p>
                <p class="patent-inventors">发明人: ${(patent.inventors || []).join(', ')}</p>
            </div>
        </div>
    `).join('');
}

function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container || !siteData.projects) return;

    container.innerHTML = siteData.projects.map(project => `
        <div class="project-item">
            <div class="project-marker"></div>
            <div class="project-card">
                <div class="project-header">
                    <span class="project-time">${project.time}</span>
                    <span class="project-role">${project.role}</span>
                </div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-subtitle">${project.subtitle}</p>
                <p class="project-description">${project.description}</p>
                <div class="project-tags">
                    ${(project.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function updateContactInfo(profile) {
    if (profile.email) {
        const emailLink = document.getElementById('contactEmail');
        emailLink.href = `mailto:${profile.email}`;
        emailLink.textContent = profile.email;
    }

    if (profile.address) {
        document.getElementById('contactAddress').innerHTML = profile.address;
    }

    if (profile.socialLinks) {
        updateLink('contactGoogleScholar', profile.socialLinks.googleScholar);
        updateLink('contactResearchGate', profile.socialLinks.researchGate);
        updateLink('contactOrcid', profile.socialLinks.orcid);
        updateLink('contactGithub', profile.socialLinks.github);
    }
}

function updateFooter(profile) {
    const year = new Date().getFullYear();
    document.getElementById('footerText').innerHTML = 
        `&copy; ${year} ${profile.name || '贺海旭'} | ${profile.title || '遥感科学与技术'}`;
}

function initializeNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link:not(.admin-link)');
    const backToTop = document.getElementById('backToTop');

    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        const icon = navToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.querySelector('i').classList.remove('fa-times');
            navToggle.querySelector('i').classList.add('fa-bars');
        });
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });
}

function initializeScrollEffects() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link:not(.admin-link)');

    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (scrollTop > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        if (scrollTop > lastScrollTop && scrollTop > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        updateActiveNavLink(sections, navLinks);
    });
}

function updateActiveNavLink(sections, navLinks) {
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

function initializePublicationFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const publicationItems = document.querySelectorAll('.publication-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            publicationItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                
                if (filterValue === 'all' || itemType === filterValue) {
                    item.style.display = 'flex';
                    item.style.animation = 'fadeInUp 0.5s ease';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function initializeAnimations() {
    const statNumbers = document.querySelectorAll('.stat-number');

    function animateNumbers() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target')) || 0;
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateNumber = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = target;
                }
            };

            updateNumber();
        });
    }

    const statsSection = document.querySelector('.about-stats');
    let hasAnimated = false;

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                animateNumbers();
                hasAnimated = true;
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    const fadeElements = document.querySelectorAll('.section-title, .detail-item, .stat-card, .publication-item, .patent-card, .project-card, .contact-item, .link-card');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in', 'visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(element => {
        element.classList.add('fade-in');
        fadeObserver.observe(element);
    });
}

function initializeInteractions() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                window.scrollTo({
                    top: aboutSection.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    }

    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    if (avatarPlaceholder) {
        avatarPlaceholder.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        avatarPlaceholder.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) rotate(5deg)';
        });
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotate(0deg)';
        });
    });

    const btns = document.querySelectorAll('.btn');
    btns.forEach(btn => {
        btn.addEventListener('mouseenter', function(e) {
            const x = e.clientX - this.getBoundingClientRect().left;
            const y = e.clientY - this.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    console.log('🛰️ 个人主页加载完成 - 遥感科学与技术');
}
