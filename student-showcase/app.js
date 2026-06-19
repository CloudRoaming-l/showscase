/**
 * 学生作品照片画廊 - 500人校区版本
 * 支持大量照片、懒加载、分页加载、分类筛选
 */

class PhotoGallery {
    constructor() {
        this.currentFilter = 'all';
        this.currentLightboxIndex = 0;
        this.itemsPerPage = 24;
        this.currentPage = 1;
        this.isLoading = false;
        this.observer = null;
        this.canvasAnimId = null;
        this.resizeTimer = null;

        // 照片数据 - 120张照片
        this.photoData = this.generatePhotoData();

        this.init();
    }

    // 生成120张照片数据
    generatePhotoData() {
        const categories = {
            lego: { name: '乐高搭建', class: 'cat-lego', count: 25 },
            robot: { name: '机器人', class: 'cat-robot', count: 20 },
            scratch: { name: 'Scratch', class: 'cat-scratch', count: 25 },
            python: { name: 'Python', class: 'cat-python', count: 20 },
            arduino: { name: 'Arduino', class: 'cat-arduino', count: 20 },
            award: { name: '竞赛获奖', class: 'cat-award', count: 10 }
        };

        const legoTitles = [
            '未来城市', '机械手臂', '齿轮传动', '起重机', '摩天轮', '汽车工厂',
            '智能房屋', '桥梁结构', '飞行器', '机器人', '传送带', '电梯系统',
            '风车发电', '太阳能车', '月球车', '挖掘机', '推土机', '消防车',
            '救护车', '警车', '坦克', '飞机', '轮船', '潜艇', '火箭'
        ];

        const robotTitles = [
            '巡线小车', '避障机器人', '机械臂', '抓取机器人', '跟随小车',
            '战斗机器人', '舞蹈机器人', '足球机器人', '投篮机器人', '攀爬机器人',
            '平衡车', '四驱车', '六足机器人', '蛇形机器人', '人形机器人',
            '智能小车', '遥控车', '自动门', '电梯模型', '分拣机器人'
        ];

        const scratchTitles = [
            '太空冒险', '迷宫逃脱', '音乐游戏', '打地鼠', '接苹果',
            '飞机大战', '跑酷游戏', '贪吃蛇', '弹球游戏', '拼图游戏',
            'Quiz问答', '画画板', '钢琴模拟', '计算器', '时钟',
            '天气预报', '聊天机器人', '故事动画', '电子贺卡', '相册',
            '赛车游戏', '坦克大战', '保卫萝卜', '植物大战僵尸', '我的世界'
        ];

        const pythonTitles = [
            '智能计算器', '数据分析', '猜数字', '石头剪刀布', '抽奖程序',
            '日记本', '通讯录', '画图工具', '时钟程序', '倒计时',
            '二维码生成', '密码生成器', '文件管理器', '音乐播放器', '视频下载器',
            '网页爬虫', '数据可视化', '游戏开发', '聊天程序', 'AI小助手'
        ];

        const arduinoTitles = [
            '智能家居', '温湿度监测', 'LED矩阵', '超声波测距', '红外遥控',
            '光控灯', '声控灯', '人体感应', '烟雾报警', '雨滴监测',
            '土壤湿度', '自动浇花', '智能窗帘', '门禁系统', '停车场',
            '电子琴', '节拍器', '心率监测', '电子秤', '气象站'
        ];

        const awardTitles = [
            '市级机器人竞赛一等奖', 'Scratch创意赛金奖', 'Arduino创新赛特等奖',
            '乐高搭建挑战赛冠军', 'Python编程赛一等奖', '科技创新大赛银奖',
            '人工智能挑战赛金奖', '创客马拉松最佳创意奖', '青少年科技创新奖', '优秀学员奖'
        ];

        const students = [
            '张小明', '李小红', '王小华', '赵小杰', '陈小艺', '刘小雨', '周小星',
            '吴小月', '郑小阳', '孙小峰', '钱小江', '冯小雪', '褚小磊', '卫小波',
            '蒋小涛', '沈小文', '韩小武', '杨小志', '朱小英', '秦小俊', '尤小伟',
            '许小芳', '何小娟', '吕小敏', '施小静', '张小龙', '孔小亮', '曹小云',
            '严小霞', '华小琴', '金小萍', '魏小玲', '陶小娜', '姜小艳', '范小莉',
            '方小婷', '薛小倩', '雷小霞', '闫小波', '侯小峰', '肖小伟', '田小华',
            '董小芳', '袁小敏', '邓小静', '许小艳', '傅小琴', '沈小萍', '曾小玲',
            '彭小娜', '吕小艳', '苏小莉', '卢小婷', '蔡小倩', '贾小霞', '丁小波'
        ];

        const data = [];
        let id = 1;

        Object.entries(categories).forEach(([cat, info]) => {
            const titles = cat === 'lego' ? legoTitles :
                          cat === 'robot' ? robotTitles :
                          cat === 'scratch' ? scratchTitles :
                          cat === 'python' ? pythonTitles :
                          cat === 'arduino' ? arduinoTitles : awardTitles;

            for (let i = 0; i < info.count; i++) {
                const isWide = Math.random() > 0.8;
                const width = isWide ? 800 : 400;
                const height = isWide ? 450 : 300;

                data.push({
                    id: id++,
                    category: cat,
                    categoryName: info.name,
                    categoryClass: info.class,
                    title: titles[i % titles.length] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ''),
                    author: students[Math.floor(Math.random() * students.length)] + ' · ' + (7 + Math.floor(Math.random() * 7)) + '岁',
                    image: `https://picsum.photos/seed/photo${id}/${width}/${height}`,
                    isWide: isWide
                });
            }
        });

        return data.sort(() => Math.random() - 0.5);
    }

    init() {
        this.cacheElements();
        this.updateStats();
        this.initIntersectionObserver();  // [修复1] 必须在 loadItems 之前初始化 observer
        this.initHeaderCanvas();
        this.loadItems(1);
        this.bindEvents();
    }

    cacheElements() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImg = document.getElementById('lightboxImg');
        this.lightboxTitle = document.getElementById('lightboxTitle');
        this.lightboxDesc = document.getElementById('lightboxDesc');
        this.lightboxClose = document.getElementById('lightboxClose');
        this.lightboxPrev = document.getElementById('lightboxPrev');
        this.lightboxNext = document.getElementById('lightboxNext');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.headerCanvas = document.getElementById('headerCanvas');
        this.statTotal = document.getElementById('statTotal');
        this.statAward = document.getElementById('statAward');
    }

    updateStats() {
        const total = this.photoData.length;
        const awards = this.photoData.filter(p => p.category === 'award').length;
        this.animateNumber(this.statTotal, total);
        this.animateNumber(this.statAward, awards);
    }

    animateNumber(element, target) {
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 30);
    }

    // ===== 头部 Canvas 背景动画 =====
    initHeaderCanvas() {
        const canvas = this.headerCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // [修复5] 重置变换矩阵，防止重复 scale 叠加
            ctx.scale(dpr, dpr);
        };
        resize();

        // [修复5] resize 防抖
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(resize, 200);
        });

        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width / dpr,
                y: Math.random() * canvas.height / dpr,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        const animate = () => {
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;
            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.globalAlpha = (1 - dist / 120) * 0.2;
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
                ctx.globalAlpha = 1;
                ctx.fill();
            });

            this.canvasAnimId = requestAnimationFrame(animate);
        };

        this.canvasAnimId = requestAnimationFrame(animate);
    }

    // ===== 加载照片 =====
    loadItems(page) {
        if (this.isLoading) return;
        this.isLoading = true;

        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const itemsToLoad = this.getFilteredData().slice(start, end);

        if (itemsToLoad.length === 0) {
            this.loadMoreBtn.classList.add('hidden');
            this.isLoading = false;
            return;
        }

        itemsToLoad.forEach((item, index) => {
            const element = this.createGalleryItem(item);
            this.galleryGrid.appendChild(element);

            // 延迟显示动画
            setTimeout(() => {
                element.classList.add('visible');
            }, index * 50);

            // 懒加载图片
            const img = element.querySelector('.gallery-img');
            if (img && this.observer) {
                this.observer.observe(img);
            }
        });

        this.currentPage = page;

        if (end >= this.getFilteredData().length) {
            this.loadMoreBtn.classList.add('hidden');
        } else {
            this.loadMoreBtn.classList.remove('hidden');
        }

        this.isLoading = false;
    }

    createGalleryItem(item) {
        const div = document.createElement('div');
        div.className = `gallery-item ${item.isWide ? 'wide' : ''}`;
        div.dataset.category = item.category;
        div.dataset.id = item.id;

        div.innerHTML = `
            <img data-src="${item.image}" alt="${item.title}" class="gallery-img">
            <div class="gallery-overlay">
                <span class="gallery-category ${item.categoryClass}">${item.categoryName}</span>
                <h3 class="gallery-title">${item.title}</h3>
                <p class="gallery-author">${item.author}</p>
            </div>
        `;

        // [修复4] 图片加载失败时显示占位背景
        const img = div.querySelector('.gallery-img');
        img.addEventListener('error', () => {
            img.style.display = 'none';
            div.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.05), rgba(255,0,110,0.05))';
        });

        div.addEventListener('click', () => this.openLightbox(item));

        return div;
    }

    // ===== 懒加载 =====
    initIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.onload = () => img.classList.add('loaded');
                        img.onerror = () => {
                            img.style.display = 'none';
                            img.parentElement.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.05), rgba(255,0,110,0.05))';
                        };
                    }
                    this.observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
    }

    // ===== 筛选功能 =====
    getFilteredData() {
        if (this.currentFilter === 'all') {
            return this.photoData;
        }
        return this.photoData.filter(item => item.category === this.currentFilter);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.galleryGrid.innerHTML = '';
        this.loadItems(1);
    }

    // ===== 事件绑定 =====
    bindEvents() {
        // 筛选按钮
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setFilter(filter);
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 加载更多
        this.loadMoreBtn.addEventListener('click', () => {
            this.loadItems(this.currentPage + 1);
        });

        // 弹窗控制
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevImage();
        });
        this.lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextImage();
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') this.closeLightbox();
            if (e.key === 'ArrowLeft') this.prevImage();
            if (e.key === 'ArrowRight') this.nextImage();
        });

        // 点击背景关闭
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.closeLightbox();
        });
    }

    // ===== 照片预览 =====
    openLightbox(item) {
        const filtered = this.getFilteredData();
        this.currentLightboxIndex = filtered.findIndex(i => i.id === item.id);
        if (this.currentLightboxIndex === -1) this.currentLightboxIndex = 0;

        this.updateLightboxContent();

        // [修复2] 用 visibility + opacity 替代 display，实现平滑过渡
        this.lightbox.style.visibility = 'visible';
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 聚焦到关闭按钮，方便键盘操作
        this.lightboxClose.focus();
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        // 等过渡动画结束后再隐藏
        setTimeout(() => {
            if (!this.lightbox.classList.contains('active')) {
                this.lightbox.style.visibility = 'hidden';
            }
        }, 400);
        document.body.style.overflow = '';
    }

    updateLightboxContent() {
        const filtered = this.getFilteredData();
        const item = filtered[this.currentLightboxIndex];
        if (!item) return;

        this.lightboxImg.src = item.image;
        this.lightboxImg.alt = item.title;
        this.lightboxTitle.textContent = item.title;
        this.lightboxDesc.textContent = `${item.categoryName} · ${item.author}`;
    }

    prevImage() {
        const filtered = this.getFilteredData();
        this.currentLightboxIndex--;
        if (this.currentLightboxIndex < 0) {
            this.currentLightboxIndex = filtered.length - 1;
        }
        this.updateLightboxContent();
    }

    nextImage() {
        const filtered = this.getFilteredData();
        this.currentLightboxIndex++;
        if (this.currentLightboxIndex >= filtered.length) {
            this.currentLightboxIndex = 0;
        }
        this.updateLightboxContent();
    }

    // ===== 清理 =====
    destroy() {
        if (this.observer) this.observer.disconnect();
        if (this.canvasAnimId) cancelAnimationFrame(this.canvasAnimId);
        clearTimeout(this.resizeTimer);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new PhotoGallery();

    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => gallery.destroy());
});
